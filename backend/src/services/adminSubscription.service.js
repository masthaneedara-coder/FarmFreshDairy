import { supabaseAdmin } from "../config/supabase.js";

// ======================================
// Get All Subscriptions
// ======================================
export async function getAllSubscriptionsService() {
  const { data: subscriptions, error } = await supabaseAdmin
    .from("subscriptions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  const result = [];

  for (const sub of subscriptions) {
    // Customer
    const { data: customer } = await supabaseAdmin
      .from("customers")
      .select("full_name, phone")
      .eq("id", sub.customer_id)
      .single();

    // Address
    const { data: address } = await supabaseAdmin
      .from("addresses")
      .select("*")
      .eq("id", sub.address_id)
      .single();

    result.push({
      subscriptionId: sub.id,

      customerName: customer?.full_name || "-",

      phone: customer?.phone || "-",

      product: sub.product || "Milk",

      qty: sub.quantity || "1",

      deliveryType: sub.delivery_time,

      monthlyAmount: sub.total_amount,

      status: sub.status,

      startDate: sub.start_date,

      expireDate: sub.end_date,

      address: address
        ? `${address.house_no}, ${address.street}`
        : "-",

      area: address?.area || "-",
    });
  }

  return result;
}

// ======================================
// Update Subscription Status
// ======================================
export async function updateSubscriptionStatusService(
  id,
  status
) {
  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .update({
      status,
      updated_at: new Date(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return data;
}