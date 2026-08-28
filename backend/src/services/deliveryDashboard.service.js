import { supabaseAdmin } from "../config/supabase.js";

/**
 * Normalize delivery shift
 */
function normalizeShift(value) {
  if (!value) return null;

  const shift = String(value).trim().toLowerCase();

  if (shift === "morning") return "Morning";
  if (shift === "evening") return "Evening";

  return null;
}

/**
 * Get Delivery Dashboard
 */
export async function getDeliveryDashboardService(deliveryBoyId) {
  // =====================================================
  // India Date
  // =====================================================

  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
  }).format(new Date());

  console.log("=================================");
  console.log("DELIVERY DASHBOARD");
  console.log("Delivery Boy:", deliveryBoyId);
  console.log("Today:", today);
  console.log("=================================");

  // =====================================================
  // 1. Today's One-Time Orders
  // =====================================================

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
      order_date,
      delivery_date,
      created_at,
      delivery_shift,
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
    .eq("delivery_date", today)
    .not("status", "eq", "Cancelled")
    .order("created_at", { ascending: false });

  if (orderError) {
    console.error("❌ Order Error:", orderError);
    throw orderError;
  }

  // =====================================================
  // 2. Today's Subscription Deliveries
  // =====================================================

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
      delivery_date,
      customer_id,
      address_id,
      delivery_boy_id,
      payment_status,

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

      subscriptions(
        id,
        delivery_time
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
    console.error("❌ Subscription Error:", subscriptionError);
    throw subscriptionError;
  }

  console.log("Orders:", orders?.length || 0);
  console.log("Subscriptions:", subscriptions?.length || 0);

  // =====================================================
  // 3. Convert One-Time Orders
  // =====================================================

 const orderList = (orders || []).map((order) => ({
  type: "Order",

  id: order.id,

  number: order.order_number,

  status: order.status,

  delivery_date: order.delivery_date,

  delivery_shift: normalizeShift(
    order.delivery_shift
  ),

  total_amount: Number(
    order.total_amount || 0
  ),

  payment_status: order.payment_status,

  payment_method: order.payment_method,

  created_at: order.created_at,

  customer: order.customers,

  address: order.addresses,

  items: order.order_items || [],
}));

  // =====================================================
  // 4. Convert Subscription Deliveries
  // =====================================================

const subscriptionList = (subscriptions || []).map((delivery) => {
  const totalAmount = (
    delivery.subscription_delivery_items || []
  ).reduce(
    (sum, item) => sum + Number(item.total_price || 0),
    0
  );

  const deliveryShift = normalizeShift(
    delivery.subscriptions?.delivery_time
  );

  return {
    type: "Subscription",

    id: delivery.id,

    number: delivery.delivery_number,

    status: delivery.status,

    delivery_date: delivery.delivery_date,

    delivery_shift: deliveryShift,

    total_amount: totalAmount,

    payment_method: "Monthly Billing",

    payment_status:
      delivery.payment_status || "Pending",

    created_at: delivery.created_at,

    customer: delivery.customers,

    address: delivery.addresses,

    items:
      delivery.subscription_delivery_items || [],
  };
});

  // =====================================================
  // 5. Merge Orders + Subscriptions
  // =====================================================

  const deliveries = [
    ...orderList,
    ...subscriptionList,
  ];
  console.log("========== FINAL API DATA ==========");

console.table(
  deliveries.map((d) => ({
    type: d.type,
    number: d.number,
    customer: d.customer?.full_name,
    delivery_date: d.delivery_date,
    delivery_shift: d.delivery_shift,
    status: d.status,
  }))
);

console.log("====================================");

  // =====================================================
  // 6. Sort Latest First
  // =====================================================

  deliveries.sort(
    (a, b) =>
      new Date(b.created_at) -
      new Date(a.created_at)
  );

  // =====================================================
  // 7. Debug Final Data
  // =====================================================

  console.log("=================================");
  console.log("FINAL API DATA");
  console.log("=================================");

  console.table(
    deliveries.map((d) => ({
      type: d.type,
      number: d.number,
      customer: d.customer?.full_name,
      delivery_date: d.delivery_date,
      delivery_shift: d.delivery_shift,
      status: d.status,
    }))
  );

  // =====================================================
  // 8. Shift Counts
  // =====================================================

  const morningDeliveries = deliveries.filter(
    (d) => d.delivery_shift === "Morning"
  );

  const eveningDeliveries = deliveries.filter(
    (d) => d.delivery_shift === "Evening"
  );

  console.log("---------------------------------");
  console.log("TOTAL:", deliveries.length);
  console.log("MORNING:", morningDeliveries.length);
  console.log("EVENING:", eveningDeliveries.length);
  console.log("---------------------------------");

  // =====================================================
  // 9. Return API Response
  // =====================================================

  return {
    summary: getDashboardSummary(deliveries),

    deliveries,

    shifts: {
      all: deliveries.length,
      morning: morningDeliveries.length,
      evening: eveningDeliveries.length,
    },
  };
}

/**
 * Dashboard Summary
 */
function getDashboardSummary(deliveries) {
  return {
    total: deliveries.length,

    pending: deliveries.filter(
      (d) => d.status === "Pending"
    ).length,

    assigned: deliveries.filter(
      (d) => d.status === "Assigned"
    ).length,

    outForDelivery: deliveries.filter(
      (d) => d.status === "Out for Delivery"
    ).length,

    delivered: deliveries.filter(
      (d) => d.status === "Delivered"
    ).length,

    missed: deliveries.filter(
      (d) => d.status === "Missed"
    ).length,

    failed: deliveries.filter(
      (d) => d.status === "Failed"
    ).length,
  };
}