import { supabaseAdmin } from "../config/supabase.js";

function getIndiaToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
  }).format(new Date());
}

// ==========================================================
// AUTO ASSIGN SETTING
// ==========================================================

export async function getAutoAssignSettingService() {
  const { data, error } = await supabaseAdmin
    .from("app_settings")
    .select("value")
    .eq("key", "auto_assign_delivery_boy")
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.value === "true";
}

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

  return data?.value === "true";
}

// ==========================================================
// WORKLOAD-BASED AUTO ASSIGNMENT
// ==========================================================

export async function autoAssignTodayDeliveriesService() {
  const enabled = await getAutoAssignSettingService();

  if (!enabled) {
    console.log("AUTO ASSIGN: Disabled");

    return {
      enabled: false,
      assigned: 0,
      pending: 0,
      workload: [],
    };
  }

  const today = getIndiaToday();

  console.log("==================================");
  console.log("AUTO DELIVERY BOY ASSIGNMENT");
  console.log("India Today:", today);
  console.log("==================================");

  // --------------------------------------------------------
  // 1. GET TODAY'S UNASSIGNED PENDING DELIVERIES
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
      created_at
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

  if (!deliveries || deliveries.length === 0) {
    console.log("AUTO ASSIGN: No pending deliveries.");

    return {
      enabled: true,
      assigned: 0,
      pending: 0,
      workload: [],
    };
  }

  // --------------------------------------------------------
  // 2. GET AVAILABLE DELIVERY BOYS
  // --------------------------------------------------------

  const {
    data: deliveryBoys,
    error: deliveryBoyError,
  } = await supabaseAdmin
    .from("delivery_boys")
    .select(`
      id,
      full_name,
      phone,
      is_available,
      is_active
    `)
    .eq("is_active", true)
    .eq("is_available", true);

  if (deliveryBoyError) {
    throw deliveryBoyError;
  }

  if (!deliveryBoys || deliveryBoys.length === 0) {
    console.log("AUTO ASSIGN: No available delivery boys.");

    return {
      enabled: true,
      assigned: 0,
      pending: deliveries.length,
      workload: [],
    };
  }

  // --------------------------------------------------------
  // 3. GET CURRENT WORKLOAD FOR TODAY
  // --------------------------------------------------------

  const {
    data: existingAssignments,
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
  // 4. BUILD WORKLOAD MAP
  // --------------------------------------------------------

  const workload = {};

  for (const boy of deliveryBoys) {
    workload[boy.id] = 0;
  }

  for (const delivery of existingAssignments || []) {
    if (workload[delivery.delivery_boy_id] !== undefined) {
      workload[delivery.delivery_boy_id]++;
    }
  }

  // --------------------------------------------------------
  // 5. ASSIGN EACH DELIVERY TO LOWEST WORKLOAD
  // --------------------------------------------------------

  let assigned = 0;

  for (const delivery of deliveries) {
    const availableBoys = deliveryBoys
      .filter((boy) => workload[boy.id] !== undefined)
      .sort((a, b) => {
        if (workload[a.id] !== workload[b.id]) {
          return workload[a.id] - workload[b.id];
        }

        return a.full_name.localeCompare(b.full_name);
      });

    const selectedBoy = availableBoys[0];

    if (!selectedBoy) {
      continue;
    }

    // ------------------------------------------------------
    // Conditional update prevents duplicate assignment
    // if the cron is triggered twice at the same time.
    // ------------------------------------------------------

    const {
      data: updatedDelivery,
      error: updateError,
    } = await supabaseAdmin
      .from("subscription_deliveries")
      .update({
        delivery_boy_id: selectedBoy.id,
        status: "Assigned",
        updated_at: new Date().toISOString(),
      })
      .eq("id", delivery.id)
      .eq("status", "Pending")
      .is("delivery_boy_id", null)
      .select("id, delivery_boy_id, status")
      .maybeSingle();

    if (updateError) {
      throw updateError;
    }

    // Another process may already have assigned it.
    if (!updatedDelivery) {
      continue;
    }

    workload[selectedBoy.id]++;
    assigned++;

    console.log(
      `ASSIGNED: ${delivery.delivery_number} → ${selectedBoy.full_name}`
    );
  }

  // --------------------------------------------------------
  // 6. FINAL WORKLOAD
  // --------------------------------------------------------

  const workloadResult = deliveryBoys.map((boy) => ({
    id: boy.id,
    full_name: boy.full_name,
    workload: workload[boy.id] || 0,
  }));

  const pending =
    deliveries.length - assigned;

  console.log(
    `AUTO ASSIGN COMPLETE: ${assigned} assigned, ${pending} pending`
  );

  return {
    enabled: true,
    assigned,
    pending,
    workload: workloadResult,
  };
}