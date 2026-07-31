import { supabaseAdmin } from "../config/supabase.js";

/* ==========================================================
   Create Subscription
========================================================== */

export async function createSubscriptionService(subscriptionData) {
  const {
    customer_id,
    product_id,
    address_id,
    quantity,
    size,
    delivery_time,
    frequency,
    start_date,    
    total_amount,
     // NEW
  payment_method = "COD",
  payment_status = "Pending",
  payment_date = null,
  payment_reference = null,
  payment_amount = total_amount,

  } = subscriptionData;
  const start = new Date(start_date);
  const end = new Date(start);
  end.setDate(end.getDate() + 30);
  const end_date = end.toISOString().split("T")[0];

  // Create subscription
  const { data: subscription, error } = await supabaseAdmin
    .from("subscriptions")
    .insert({
      customer_id,
      address_id,
      start_date,
      end_date,
      delivery_time,
      frequency,
      total_amount,

      payment_method,
      payment_status,
      payment_date,
      payment_reference,
      payment_amount,

      status: "Active",
    })
    .select()
    .single();

  if (error) {
    return { data: null, error };
  }

  // Create one subscription item
  // Daily price per litre
const PRICE_PER_LITER = 90;

let multiplier = 1;

switch (size) {
  case "250ml":
    multiplier = 0.25;
    break;

  case "500ml":
    multiplier = 0.5;
    break;

  case "1L":
    multiplier = 1;
    break;

  case "2L":
    multiplier = 2;
    break;

  case "3L":
    multiplier = 3;
    break;

  case "5L":
    multiplier = 5;
    break;

  default:
    multiplier = 1;
}

const dailyPrice =
  PRICE_PER_LITER *
  multiplier *
  quantity;

const { error: itemError } = await supabaseAdmin
  .from("subscription_items")
  .insert({
    subscription_id: subscription.id,
    product_id,
    quantity,
    size,

    // Daily price
    unit_price: dailyPrice,

    // Monthly subscription amount
    price: total_amount,
  });

  if (itemError) {
    await supabaseAdmin
      .from("subscriptions")
      .delete()
      .eq("id", subscription.id);

    return { data: null, error: itemError };
  }

  return {
    data: subscription,
    error: null,
  };
}

/* ==========================================================
   Active Subscription
========================================================== */

export async function getCustomerSubscriptionService(customerId) {
  return await supabaseAdmin
    .from("subscriptions")
    .select(`
      *,
      addresses(*),
      subscription_items(
        *,
        products(*)
      )
    `)
    .eq("customer_id", customerId)
    .eq("status", "Active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
}

/* ==========================================================
   Subscription History
========================================================== */

export async function getSubscriptionHistoryService(customerId) {
  return await supabaseAdmin
    .from("subscriptions")
    .select(`
      *,
      addresses(*),
      subscription_items(
        *,
        products(*)
      )
    `)
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });
}

/* ==========================================================
   Billing Summary
========================================================== */

export async function getBillingSummaryService(customerId) {
  return await supabaseAdmin
    .from("subscriptions")
    .select(`
      id,
      total_amount,
      start_date,
      end_date,
      status
    `)
    .eq("customer_id", customerId)
    .eq("status", "Active")
    .maybeSingle();
}

/* ==========================================================
   Upcoming Delivery
========================================================== */

export async function getUpcomingDeliveryService(customerId) {
  return await supabaseAdmin
    .from("subscriptions")
    .select(`
      *,
      addresses(*),
      subscription_items(
        *,
        products(*)
      )
    `)
    .eq("customer_id", customerId)
    .eq("status", "Active")
    .maybeSingle();
}

/* ==========================================================
   Get Subscription By ID
========================================================== */

export async function getSubscriptionByIdService(id) {
  return await supabaseAdmin
    .from("subscriptions")
    .select(`
      *,
      addresses(*),
      subscription_items(
        *,
        products(*)
      )
    `)
    .eq("id", id)
    .single();
}

/* ==========================================================
   Update Subscription
========================================================== */

export async function updateSubscriptionService(id, payload) {
  return await supabaseAdmin
    .from("subscriptions")
    .update({
      delivery_time: payload.delivery_time,
      address_id: payload.address_id,
      total_amount: payload.total_amount,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();
}

/* ==========================================================
   Update Subscription Item
========================================================== */

export async function updateSubscriptionItemService(
  subscriptionId,
  payload
) {
  return await supabaseAdmin
    .from("subscription_items")
    .update({
      quantity: payload.quantity,
      size: payload.size,
    })
    .eq("subscription_id", subscriptionId)
    .select();
}

/* ==========================================================
   Update Status
========================================================== */

export async function updateSubscriptionStatusService(
  subscriptionId,
  status
) {
  return await supabaseAdmin
    .from("subscriptions")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", subscriptionId)
    .select()
    .single();
}

/* ==========================================================
   Delete Subscription
========================================================== */

export async function deleteSubscriptionService(subscriptionId) {
  return await supabaseAdmin
    .from("subscriptions")
    .delete()
    .eq("id", subscriptionId);
}

/* ==========================================================
   Renew Subscription
========================================================== */

export async function renewSubscriptionService(
  subscriptionId,
  endDate,
  totalAmount
) {
  return await supabaseAdmin
    .from("subscriptions")
    .update({
      end_date: endDate,
      total_amount: totalAmount,
      status: "Active",
      updated_at: new Date().toISOString(),
    })
    .eq("id", subscriptionId)
    .select()
    .single();
}

export async function getSubscriptionDeliverySummaryService(subscriptionId) {

  // Delivered
  const { count: delivered, error: deliveredError } =
    await supabaseAdmin
      .from("subscription_deliveries")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("subscription_id", subscriptionId)
      .eq("status", "Delivered");

  if (deliveredError) throw deliveredError;

  // Out for Delivery
  const { count: outForDelivery, error: outError } =
    await supabaseAdmin
      .from("subscription_deliveries")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("subscription_id", subscriptionId)
      .eq("status", "Out for Delivery");

  if (outError) throw outError;

  // Pending
  const { count: pending, error: pendingError } =
    await supabaseAdmin
      .from("subscription_deliveries")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("subscription_id", subscriptionId)
      .eq("status", "Pending");

  if (pendingError) throw pendingError;

  // Missed
  const { count: missed, error: missedError } =
    await supabaseAdmin
      .from("subscription_deliveries")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("subscription_id", subscriptionId)
      .eq("status", "Missed");

  if (missedError) throw missedError;

  // Total
  const total =
    delivered +
    outForDelivery +
    pending +
    missed;

  return {
    delivered,
    outForDelivery,
    pending,
    missed,
    total,
  };
}
export async function pauseSubscriptionService(
  subscriptionId,
  pauseFrom,
  pauseTo
) {
  console.log("=================================");
  console.log("Pause Service");
  console.log("Subscription ID:", subscriptionId);
  console.log("Pause From:", pauseFrom);
  console.log("Pause To:", pauseTo);

  const result = await supabaseAdmin
    .from("subscriptions")
    .update({
      is_paused: true,
      pause_from: pauseFrom,
      pause_to: pauseTo,
      updated_at: new Date().toISOString(),
    })
    .eq("id", subscriptionId)
    .select();

  console.log("Supabase Result:");
  console.log(result);
  console.log("=================================");

  if (result.error) {
    throw result.error;
  }

  if (!result.data || result.data.length === 0) {
    throw new Error("No subscription was updated.");
  }

  return result.data[0];
}
export async function resumeSubscriptionService(subscriptionId) {

  // Load subscription
  const { data: subscription, error } = await supabaseAdmin
    .from("subscriptions")
    .select("*")
    .eq("id", subscriptionId)
    .single();

  if (error) throw error;

  if (
    !subscription.is_paused ||
    !subscription.pause_from ||
    !subscription.pause_to
  ) {
    return subscription;
  }

  const pauseFrom = new Date(subscription.pause_from);
  const pauseTo = new Date(subscription.pause_to);

  const pausedDays =
    Math.floor(
      (pauseTo - pauseFrom) /
      (1000 * 60 * 60 * 24)
    ) + 1;

  const endDate = new Date(subscription.end_date);
  endDate.setDate(endDate.getDate() + pausedDays);

  const { data, error: updateError } =
    await supabaseAdmin
      .from("subscriptions")
      .update({
        is_paused: false,
        pause_from: null,
        pause_to: null,
        paused_days:
          (subscription.paused_days || 0) + pausedDays,
        end_date: endDate.toISOString().split("T")[0],
        updated_at: new Date().toISOString(),
      })
      .eq("id", subscriptionId)
      .select()
      .single();

  if (updateError) throw updateError;

  return data;
}