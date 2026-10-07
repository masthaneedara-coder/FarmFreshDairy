import { supabaseAdmin } from "../config/supabase.js";

/**
 * ==========================================================
 * INDIA TODAY
 * ==========================================================
 */
function getIndiaToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
  }).format(new Date());
}

/**
 * ==========================================================
 * GET AUTO ASSIGN SETTING
 * ==========================================================
 */
export async function getAutoAssignSettingService() {
  const { data, error } = await supabaseAdmin
    .from("app_settings")
    .select("value")
    .eq("key", "auto_assign_delivery_boy")
    .maybeSingle();

  if (error) {
    throw error;
  }

  // Default ON if setting doesn't exist
  if (!data) {
    return true;
  }

  return String(data.value).toLowerCase() === "true";
}

/**
 * ==========================================================
 * SET AUTO ASSIGN SETTING
 * ==========================================================
 */
export async function setAutoAssignSettingService(enabled) {
  const { data, error } = await supabaseAdmin
    .from("app_settings")
    .upsert(
      {
        key: "auto_assign_delivery_boy",
        value: enabled ? "true" : "false",
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "key",
      }
    )
    .select()
    .single();

  if (error) {
    throw error;
  }

  return {
    enabled: String(data.value).toLowerCase() === "true",
  };
}

/**
 * ==========================================================
 * AUTO ASSIGN TODAY'S DELIVERIES
 *
 * WORKLOAD BASED
 * ==========================================================
 */
export async function autoAssignTodayDeliveriesService() {
  const today = getIndiaToday();

  console.log("=================================");
  console.log("AUTO ASSIGN DELIVERY BOYS");
  console.log("Today:", today);
  console.log("=================================");

  // --------------------------------------------------------
  // 1. CHECK AUTO ASSIGN SETTING
  // --------------------------------------------------------

  const enabled =
    await getAutoAssignSettingService();

  if (!enabled) {
    console.log(
      "AUTO ASSIGN IS OFF - NO DELIVERIES ASSIGNED"
    );

    return {
      enabled: false,
      assigned: [],
      pending: [],
    };
  }

  // --------------------------------------------------------
  // 2. GET PENDING SUBSCRIPTION DELIVERIES
  // --------------------------------------------------------

  const {
    data: deliveries,
    error: deliveryError,
  } = await supabaseAdmin
    .from("subscription_deliveries")
    .select(`
      id,
      delivery_number,
      delivery_date,
      status,
      delivery_boy_id,
      customer_id
    `)
    .eq("delivery_date", today)
    .eq("status", "Pending")
    .is("delivery_boy_id", null)
    .order("created_at", {
      ascending: true,
    });

  if (deliveryError) {
    throw deliveryError;
  }

  if (!deliveries?.length) {
    console.log(
      "No pending deliveries available for auto assignment."
    );

    return {
      enabled: true,
      assigned: [],
      pending: [],
    };
  }

  // --------------------------------------------------------
  // 3. GET ACTIVE + AVAILABLE DELIVERY BOYS
  // --------------------------------------------------------

  const {
    data: deliveryBoys,
    error: boyError,
  } = await supabaseAdmin
    .from("delivery_boys")
    .select(`
      id,
      full_name,
      phone,
      is_active,
      is_available
    `)
    .eq("is_active", true)
    .eq("is_available", true)
    .order("full_name", {
      ascending: true,
    });

  if (boyError) {
    throw boyError;
  }

  if (!deliveryBoys?.length) {
    console.log(
      "NO ACTIVE + AVAILABLE DELIVERY BOYS."
    );

    return {
      enabled: true,
      assigned: [],
      pending: deliveries,
    };
  }

  // --------------------------------------------------------
  // 4. GET TODAY'S EXISTING WORKLOAD
  //
  // Count:
  // Pending
  // Assigned
  // Out for Delivery
  // --------------------------------------------------------

  const {
    data: existingDeliveries,
    error: workloadError,
  } = await supabaseAdmin
    .from("subscription_deliveries")
    .select(`
      id,
      delivery_boy_id,
      status
    `)
    .eq("delivery_date", today)
    .not("delivery_boy_id", "is", null)
    .in("status", [
      "Pending",
      "Assigned",
      "Out for Delivery",
    ]);

  if (workloadError) {
    throw workloadError;
  }

  // --------------------------------------------------------
  // 5. CREATE WORKLOAD MAP
  // --------------------------------------------------------

  const workload = {};

  for (const boy of deliveryBoys) {
    workload[boy.id] = 0;
  }

  for (const delivery of existingDeliveries || []) {
    if (
      workload[delivery.delivery_boy_id] !== undefined
    ) {
      workload[delivery.delivery_boy_id]++;
    }
  }

  console.log(
    "INITIAL WORKLOAD:",
    workload
  );

  // --------------------------------------------------------
  // 6. ASSIGN ONE BY ONE
  // --------------------------------------------------------

  const assigned = [];
  const pending = [];

  for (const delivery of deliveries) {
    // Find delivery boy with lowest workload
    const selectedBoy =
      deliveryBoys.reduce((lowest, boy) => {
        if (
          workload[boy.id] <
          workload[lowest.id]
        ) {
          return boy;
        }

        return lowest;
      }, deliveryBoys[0]);

    if (!selectedBoy) {
      pending.push(delivery);
      continue;
    }

    // ------------------------------------------------------
    // UPDATE DELIVERY
    // ------------------------------------------------------

    const {
      data: updatedDelivery,
      error: updateError,
    } = await supabaseAdmin
      .from("subscription_deliveries")
      .update({
        delivery_boy_id: selectedBoy.id,
        status: "Assigned",
        assigned_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", delivery.id)
      .eq("status", "Pending")
      .is("delivery_boy_id", null)
      .select(`
        id,
        delivery_number,
        delivery_date,
        status,
        delivery_boy_id
      `)
      .maybeSingle();

    if (updateError) {
      console.error(
        "Auto Assignment Error:",
        updateError
      );

      pending.push(delivery);
      continue;
    }

    // Another process may have already assigned it
    if (!updatedDelivery) {
      console.log(
        `Delivery ${delivery.delivery_number} was already assigned.`
      );

      continue;
    }

    // Increase workload immediately
    workload[selectedBoy.id]++;

    assigned.push({
      delivery: updatedDelivery,
      deliveryBoy: {
        id: selectedBoy.id,
        name: selectedBoy.full_name,
      },
      workload: workload[selectedBoy.id],
    });

    console.log(
      `✅ ${delivery.delivery_number} → ${selectedBoy.full_name} | Workload: ${workload[selectedBoy.id]}`
    );
  }

  console.log("=================================");
  console.log(
    "AUTO ASSIGN COMPLETE"
  );
  console.log(
    "Assigned:",
    assigned.length
  );
  console.log(
    "Pending:",
    pending.length
  );
  console.log("=================================");

  return {
    enabled: true,
    assigned,
    pending,
    workload,
  };
}