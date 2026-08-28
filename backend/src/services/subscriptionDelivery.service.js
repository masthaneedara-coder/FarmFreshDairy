import { supabaseAdmin } from "../config/supabase.js";

export async function getTodayDeliveriesService() {
  const today = new Date().toISOString().split("T")[0];

  return await supabaseAdmin
    .from("subscription_deliveries")
    .select(`
      *,
      customers(
        id,
        full_name,
        phone
      ),
      addresses(
        house_no,
        street,
        area,
        city,
        state,
        pincode
      ),
      delivery_boys(
        id,
        full_name,
        phone
      ),
      subscription_delivery_items(
        *,
        products(
          id,
          name,
          image
        )
      )
    `)
    .eq("delivery_date", today)
    .order("created_at", { ascending: false });
}
export async function getDeliveryByIdService(id) {
  return await supabaseAdmin
    .from("subscription_deliveries")
    .select(`
      *,
      customers(*),
      addresses(*),
      delivery_boys(*),
      subscription_delivery_items(
        *,
        products(*)
      )
    `)
    .eq("id", id)
    .single();
}
export async function assignDeliveryBoyService(
  deliveryId,
  deliveryBoyId
) {
  return await supabaseAdmin
    .from("subscription_deliveries")
    .update({
      delivery_boy_id: deliveryBoyId,
  status: "Assigned",
  assigned_at: new Date().toISOString(),
    })
    .eq("id", deliveryId)
    .select()
    .single();
}
export async function updateDeliveryStatusService(
  deliveryId,
  status,
  type
) {
  const now = new Date().toISOString();

  const update = {
    status,
    updated_at: now,
  };

  // ==========================================
  // ORDER
  // ==========================================
  if (type === "Order") {

    if (status === "Out for Delivery") {
      update.out_for_delivery_at = now;
    }

    if (status === "Delivered") {
      update.delivery_completed_at = now;
    }

    return await supabaseAdmin
      .from("orders")
      .update(update)
      .eq("id", deliveryId)
      .select()
      .single();
  }

  // ==========================================
  // SUBSCRIPTION
  // ==========================================
  if (type === "Subscription") {

    return await supabaseAdmin
      .from("subscription_deliveries")
      .update(update)
      .eq("id", deliveryId)
      .select()
      .single();
  }

  throw new Error(
    `Invalid delivery type: ${type}`
  );
}
export async function deleteDeliveryService(id) {
  return await supabaseAdmin
    .from("subscription_deliveries")
    .delete()
    .eq("id", id);
}
export async function generateTodayDeliveriesService() {
  const today = new Date().toISOString().split("T")[0];

  const {
    data: subscriptions,
    error,
  } = await supabaseAdmin
    .from("subscriptions")
    .select(`
      *,
      subscription_items(
        *,
        products(*)
      )
    `)
    .eq("status", "Active");

  if (error) throw error;

  const created = [];
  const updated = [];
  let skipped = 0;

  for (const subscription of subscriptions || []) {

    console.log("=================================");
    console.log("CHECKING SUBSCRIPTION:", subscription.id);
    console.log("Start:", subscription.start_date);
    console.log("End:", subscription.end_date);
    console.log("Frequency:", subscription.frequency);
    console.log("Paused:", subscription.is_paused);
    console.log("Today:", today);

    // ==========================================
    // 1. Check subscription eligibility
    // ==========================================

    const eligible = shouldGenerateDelivery(
      subscription,
      today
    );

    console.log(
      "ELIGIBLE:",
      subscription.id,
      eligible
    );

    if (!eligible) {
      skipped++;
      continue;
    }

    // ==========================================
    // 2. Check today's delivery
    // ==========================================

    const {
      data: existingDelivery,
      error: existingError,
    } = await supabaseAdmin
      .from("subscription_deliveries")
      .select("id, delivery_number, status")
      .eq("subscription_id", subscription.id)
      .eq("delivery_date", today)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    let delivery;

    // ==========================================
    // 3. If delivery already exists
    // ==========================================

    if (existingDelivery) {

      console.log(
        "TODAY'S DELIVERY ALREADY EXISTS:",
        existingDelivery
      );

      delivery = existingDelivery;

      // IMPORTANT:
      // Do NOT skip here.
      //
      // We still need to sync approved Extra Milk.

    } else {

      // ==========================================
      // 4. Create today's delivery
      // ==========================================

      const deliveryNumber =
        await generateDeliveryNumber();

      const {
        data: newDelivery,
        error: deliveryError,
      } = await supabaseAdmin
        .from("subscription_deliveries")
       .insert({
          delivery_number: deliveryNumber,
          subscription_id: subscription.id,
          customer_id: subscription.customer_id,
          address_id: subscription.address_id,
          delivery_date: today,
          delivery_type: subscription.delivery_type,
          status: "Pending",
        })
        .select()
        .single();

      if (deliveryError) {
        console.error(
          "Delivery Insert Error:",
          deliveryError
        );

        throw deliveryError;
      }

      delivery = newDelivery;

      console.log(
        "NEW DELIVERY CREATED:",
        delivery.id
      );

      // ==========================================
      // 5. Insert normal subscription items
      // ==========================================

      const normalItems =
        (subscription.subscription_items || []).map(
          (item) => ({
            delivery_id: delivery.id,
            product_id: item.product_id,
            quantity: item.quantity,
            size: item.size,
            unit_price:
              item.unit_price ?? item.price ?? 0,
            total_price:
              Number(item.quantity) *
              Number(item.unit_price ?? item.price ?? 0),

            is_extra: false,
          })
        );

      if (normalItems.length > 0) {

        const {
          error: itemError,
        } = await supabaseAdmin
          .from("subscription_delivery_items")
          .insert(normalItems);

        if (itemError) {
          throw itemError;
        }
      }

      created.push(delivery);
    }

    // ==========================================
    // 6. Get approved Extra Milk for today
    // ==========================================

    const {
      data: extraMilkRequests,
      error: extraError,
    } = await supabaseAdmin
      .from("extra_milk_requests")
      .select(`
        *,
        products(
          id,
          name,
          price,
          is_available
        )
      `)
      .eq("subscription_id", subscription.id)
      .eq("status", "Approved")
      .lte("from_date", today)
      .gte("to_date", today);

    if (extraError) {
      console.error(
        "Extra Milk Query Error:",
        extraError
      );

      throw extraError;
    }

    console.log(
      "APPROVED EXTRA MILK:",
      extraMilkRequests
    );

    // ==========================================
    // 7. Insert approved Extra Milk
    // ==========================================

   // ==========================================
// 7. Insert approved Extra Milk
// ==========================================

for (const request of extraMilkRequests || []) {

  console.log("--------------------------------");
  console.log("PROCESSING EXTRA MILK REQUEST");
  console.log("Request ID:", request.id);
  console.log("Product:", request.products?.name);
  console.log("Size:", request.size);
  console.log("Quantity:", request.quantity);

  // ------------------------------------------
  // Check if this request is already added
  // ------------------------------------------

  const {
    data: existingExtraItem,
    error: existingExtraError,
  } = await supabaseAdmin
    .from("subscription_delivery_items")
    .select("id")
    .eq("delivery_id", delivery.id)
    .eq("extra_milk_request_id", request.id)
    .maybeSingle();

  if (existingExtraError) {
    console.error(
      "Existing Extra Item Check Error:",
      existingExtraError
    );

    throw existingExtraError;
  }

  // Already added
  if (existingExtraItem) {

    console.log(
      "EXTRA MILK ALREADY ADDED:",
      request.id
    );

    continue;
  }

  // ------------------------------------------
  // Calculate quantity
  // ------------------------------------------

  const quantity =
    Number(request.quantity || 0);

  if (quantity <= 0) {
    console.log(
      "Skipping Extra Milk - invalid quantity"
    );

    continue;
  }

  // ------------------------------------------
  // Calculate price
  // ------------------------------------------

  let unitPrice = 0;

  switch (request.size) {

    case "250ml":
      unitPrice =
        Number(request.products?.price_250ml || 0);
      break;

    case "500ml":
      unitPrice =
        Number(request.products?.price_500ml || 0);
      break;

    case "1L":
      unitPrice =
        Number(
          request.products?.price_1l ||
          request.products?.price ||
          0
        );
      break;

    case "2L":
      unitPrice =
        Number(request.products?.price_2l || 0);
      break;

    case "3L":
      unitPrice =
        Number(request.products?.price_3l || 0);
      break;

    case "5L":
      unitPrice =
        Number(request.products?.price_5l || 0);
      break;

    default:
      unitPrice =
        Number(request.products?.price || 0);
  }

  // ------------------------------------------
  // Create Extra Milk Item
  // ------------------------------------------

  const extraItem = {
    delivery_id: delivery.id,

    product_id: request.product_id,

    quantity,

    size: request.size,

    unit_price: unitPrice,

    total_price:
      quantity * unitPrice,

    is_extra: true,

    extra_milk_request_id:
      request.id,
  };

  console.log(
    "INSERTING EXTRA MILK ITEM:",
    extraItem
  );

  // ------------------------------------------
  // Insert
  // ------------------------------------------

  const {
    error: insertExtraError,
  } = await supabaseAdmin
    .from("subscription_delivery_items")
    .insert(extraItem);

  if (insertExtraError) {

    console.error(
      "Extra Milk Insert Error:",
      insertExtraError
    );

    throw insertExtraError;
  }

  console.log(
    "✅ EXTRA MILK ADDED:",
    request.id
  );
}

    // ==========================================
    // 8. Mark delivery as updated
    // ==========================================

    if (existingDelivery) {
      updated.push(delivery);
    }
  }

  return {
    created,
    updated,
    skipped,
  };
}
function shouldGenerateDelivery(subscription, today) {

  console.log("----- ELIGIBILITY CHECK -----");

  const todayDate = new Date(today);
  const startDate = new Date(subscription.start_date);

  console.log("todayDate:", todayDate);
  console.log("startDate:", startDate);

  // Before subscription starts
  if (todayDate < startDate) {
    console.log("❌ Before start date");
    return false;
  }

  // Subscription ended
  if (
    subscription.end_date &&
    todayDate > new Date(subscription.end_date)
  ) {
    console.log("❌ Subscription ended");
    return false;
  }

  // Paused
  if (
    subscription.is_paused &&
    subscription.pause_from &&
    subscription.pause_to
  ) {

    const pauseFrom =
      new Date(subscription.pause_from);

    const pauseTo =
      new Date(subscription.pause_to);

    console.log("Pause from:", pauseFrom);
    console.log("Pause to:", pauseTo);

    if (
      todayDate >= pauseFrom &&
      todayDate <= pauseTo
    ) {
      console.log("❌ Subscription paused");
      return false;
    }
  }

  const frequency =
    (subscription.frequency || "")
      .trim()
      .toLowerCase();

  console.log("Frequency:", frequency);

  switch (frequency) {

    case "daily":

      console.log("✅ DAILY → ELIGIBLE");

      return true;

    case "alternate":
    case "alternate day":
    case "alternate days": {

      const diffDays = Math.floor(
        (
          todayDate.getTime() -
          startDate.getTime()
        ) /
        (1000 * 60 * 60 * 24)
      );

      console.log(
        "Alternate diffDays:",
        diffDays
      );

      return diffDays % 2 === 0;
    }

    case "weekly":

      return (
        todayDate.getDay() ===
        startDate.getDay()
      );

    default:

      console.log(
        "⚠️ Unknown frequency, allowing delivery"
      );

      return true;
  }
}
async function generateDeliveryNumber() {

  const { count } = await supabaseAdmin
    .from("subscription_deliveries")
    .select("*", {
      count: "exact",
      head: true,
    });

  return `SDL${String((count || 0) + 1).padStart(6, "0")}`;
}
export async function assignSubscriptionDeliveryService(
  id,
  deliveryBoyId
) {

  const { data, error } =
    await supabaseAdmin
      .from("subscription_deliveries")
      .update({
        delivery_boy_id: deliveryBoyId,
        status: "Assigned",
      })
      .eq("id", id)
      .select()
      .single();

  if (error) throw error;

  return data;
}
export async function getCustomerDeliverySummaryService(customerId) {
  const { data, error } = await supabaseAdmin
    .from("subscription_deliveries")
    .select("status")
    .eq("customer_id", customerId);

  if (error) throw error;

  const summary = {
    total: data.length,
    delivered: 0,
    outForDelivery: 0,
    assigned: 0,
    pending: 0,
    skipped: 0,
    cancelled: 0,
  };

  data.forEach((item) => {
    switch ((item.status || "").toLowerCase()) {
      case "delivered":
        summary.delivered++;
        break;

      case "out for delivery":
        summary.outForDelivery++;
        break;

      case "assigned":
        summary.assigned++;
        break;

      case "pending":
        summary.pending++;
        break;

      case "skipped":
        summary.skipped++;
        break;

      case "cancelled":
        summary.cancelled++;
        break;
    }
  });

  summary.remaining =
    summary.pending +
    summary.assigned +
    summary.outForDelivery;

  return summary;
}
export async function bulkAssignSubscriptionDeliveriesService(
  deliveryIds,
  deliveryBoyId
) {

  const {
    data,
    error,
  } = await supabaseAdmin
    .from("subscription_deliveries")
    .update({
      delivery_boy_id: deliveryBoyId,
      status: "Assigned",
      updated_at: new Date().toISOString(),
    })
    .in("id", deliveryIds)
    .select(`
      id,
      delivery_number,
      delivery_boy_id,
      status,
      customers(
        id,
        full_name,
        phone
      ),
      delivery_boys(
        id,
        full_name,
        phone
      )
    `);

  if (error) {
    throw error;
  }

  return data;
}