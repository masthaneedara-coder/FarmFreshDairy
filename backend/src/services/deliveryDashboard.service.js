import { supabaseAdmin } from "../config/supabase.js";

/**
 * Get Delivery Dashboard
 */
export async function getDeliveryDashboardService(deliveryBoyId) {

  const today = new Date().toISOString().split("T")[0];

  // ===============================
  // Today's One-Time Orders
  // ===============================
 const {
  data: orders,
  error: orderError,
} = await supabaseAdmin
  .from("orders")
  .select(`
    id,
    order_number,
    total_amount,
    payment_method,
    payment_status,
    status,
    created_at,
    customer_id,
    address_id,
    delivery_boy_id,
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
    order_items(
      id,
      quantity,
      unit_price,
      total_price,
      size,
      products(
        id,
        name,
        image
      )
    )
  `)
  .eq("delivery_boy_id", deliveryBoyId)
.not("status", "eq", "Cancelled")
.not("status", "eq", "Delivered")
.order("created_at", { ascending: false });

  if (orderError) throw orderError;

  // ===============================
  // Today's Subscription Deliveries
  // ===============================
  const {
    data: subscriptions,
    error: subscriptionError,
  } = await supabaseAdmin
    .from("subscription_deliveries")
    .select(`
  id,
  delivery_number,
  status,
  created_at,
  customer_id,
  address_id,
  delivery_boy_id,
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
  subscription_delivery_items(
    id,
    quantity,
    unit_price,
    total_price,
    size,
    is_extra,
    products(
      id,
      name,
      image
    )
  )
`)
    .eq("delivery_boy_id", deliveryBoyId)
    .eq("delivery_date", today)
    .not("status", "eq", "Cancelled");

  if (subscriptionError) {
    console.log("Subscription Error:");
    console.log(subscriptionError);
    throw subscriptionError;
}

  // ===============================
  // Convert Orders
  // ===============================
  const orderList = (orders || []).map(order => ({
  type: "Order",
  id: order.id,
  number: order.order_number,
  status: order.status,

  total_amount: order.total_amount,
  payment_status: order.payment_status,
  payment_method: order.payment_method,

  created_at: order.created_at,
  customer: order.customers,
  address: order.addresses,
  items: order.order_items,
}));

  // ===============================
  // Convert Subscription Deliveries
  // ===============================
 const subscriptionList = (subscriptions || []).map(delivery => {

  const totalAmount =
    (delivery.subscription_delivery_items || []).reduce(
      (sum, item) => sum + Number(item.total_price || 0),
      0
    );

  return {
    type: "Subscription",
    id: delivery.id,
    number: delivery.delivery_number,
    status: delivery.status,
    created_at: delivery.created_at,

    total_amount: totalAmount,

    payment_method: "Monthly Billing",
    payment_status: "Pending",

    customer: delivery.customers,
    address: delivery.addresses,
    items: delivery.subscription_delivery_items,
  };
});

  // ===============================
  // Merge Both Lists
  // ===============================
  const deliveries = [
    ...orderList,
    ...subscriptionList,
  ];

  // Latest First
  deliveries.sort(
    (a, b) =>
      new Date(b.created_at) -
      new Date(a.created_at)
  );

  return {

    summary: getDashboardSummary(deliveries),

    deliveries,

  };

}

/**
 * Dashboard Summary
 */
function getDashboardSummary(deliveries) {

  return {

    total: deliveries.length,

    pending: deliveries.filter(
      d => d.status === "Pending"
    ).length,

    assigned: deliveries.filter(
      d => d.status === "Assigned"
    ).length,

    outForDelivery: deliveries.filter(
      d => d.status === "Out for Delivery"
    ).length,

    delivered: deliveries.filter(
      d => d.status === "Delivered"
    ).length,

    failed: deliveries.filter(
      d => d.status === "Failed"
    ).length,

  };

}
export async function updateDeliveryStatusService(
  orderId,
  status
) {
  const update = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === "Out for Delivery") {
    update.out_for_delivery_at =
      new Date().toISOString();
  }

  if (status === "Delivered") {
    update.delivery_completed_at =
      new Date().toISOString();
  }

  return await supabaseAdmin
    .from("orders")
    .update(update)
    .eq("id", orderId)
    .select()
    .single();
}