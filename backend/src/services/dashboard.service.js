import { supabaseAdmin } from "../config/supabase.js";

export const getDashboardService = async (customerId) => {
  // Customer
  const { data: customer, error: customerError } =
    await supabaseAdmin
      .from("customers")
      .select("*")
      .eq("id", customerId)
      .single();

  if (customerError) return { error: customerError };

  // Orders
const { data: orders, error: ordersError } =
  await supabaseAdmin
    .from("orders")
    .select(`
      *,
      order_items(
        id,
        quantity,
        total_price,
        products(
          id,
          name,
          image
        )
      )
    `)
    .eq("customer_id", customerId)
    .order("order_date", { ascending: false });

if (ordersError) {
  throw ordersError;
}
const formattedOrders = (orders || []).map((order) => ({
  id: order.id,

  orderNumber: order.order_number || order.id.substring(0, 8),

  orderDate: order.order_date,

  totalAmount: Number(order.total_amount || 0),

  paymentMethod: order.payment_method,

  paymentStatus: order.payment_status || "Pending",

  status: order.status || "Pending",

  totalItems: order.order_items?.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  ) || 0,

  items: order.order_items || [],
}));

  // Subscriptions
 const { data: subscriptions, error: subscriptionsError } =
  await supabaseAdmin
    .from("subscriptions")
    .select(`
      *,
      addresses(
        id,
        house_no,
        street,
        area,
        city,
        state,
        pincode
      ),
      subscription_items(
        id,
        quantity,
        size,
        unit_price,
        price,
        products(
          id,
          name,
          image
        )
      )
    `)
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

if (subscriptionsError) {
  throw subscriptionsError;
}
const formattedSubscriptions = (subscriptions || []).map((sub) => {
  const item = sub.subscription_items?.[0];

  return {
  id: sub.id,

  product: item?.products?.name || "Milk Subscription",

  image: item?.products?.image || "",

  quantity: item?.quantity ?? 1,

  size: item?.size || "1L",

  monthlyAmount:
    sub.total_amount ??
    item?.price ??
    item?.unit_price ??
    0,

  deliveryType: sub.delivery_time || "Morning",

  frequency: sub.frequency,

  startDate: sub.start_date,

  expireDate: sub.end_date,

  // Keep status if you still need it elsewhere
  status: sub.status,

  // ✅ ADD THESE
  is_paused: sub.is_paused,
  pause_from: sub.pause_from,
  pause_to: sub.pause_to,
  paused_days: sub.paused_days,

  address: sub.addresses,
};
});

  // Addresses
  const { data: addresses, error: addressError } =
    await supabaseAdmin
      .from("addresses")
      .select("*")
      .eq("customer_id", customerId);

  if (addressError) return { error: addressError };

  // Summary
  const totalSpent = orders.reduce(
    (sum, order) => sum + Number(order.total_amount || 0),
    0
  );

  const activeSubscriptions = subscriptions.filter(
  (sub) => sub.status === "Active" && !sub.is_paused
);

const pausedSubscriptions = subscriptions.filter(
  (sub) => sub.is_paused
);


  return {
    data: {
      customer,

    summary: {
        totalOrders: orders.length,
        totalSpent,
        totalSubscriptions: subscriptions.length,
        activeSubscriptions: activeSubscriptions.length,

        status:
          activeSubscriptions.length > 0
            ? "Active"
            : pausedSubscriptions.length > 0
            ? "Paused"
            : "No Subscription",
      },

      recentOrders: formattedOrders.slice(0, 5),

      subscriptions: formattedSubscriptions,

      addresses,
    },
  };
};