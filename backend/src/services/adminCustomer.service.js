import { supabaseAdmin } from "../config/supabase.js";

// =============================
// Get All Customers
// =============================
export async function getAllCustomersService() {
  const { data: customers, error } = await supabaseAdmin
    .from("customers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  const result = [];

  for (const customer of customers) {
    // Orders
    const { data: orders } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("customer_id", customer.id);

    // Subscriptions
    const { data: subscriptions } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .eq("customer_id", customer.id);

    // Address
    const { data: addresses } = await supabaseAdmin
      .from("addresses")
      .select("*")
      .eq("customer_id", customer.id)
      .order("created_at", { ascending: false })
      .limit(1);

    const address = addresses?.[0];

    const totalSpent = (orders || []).reduce(
      (sum, order) => sum + Number(order.total_amount || 0),
      0
    );

    result.push({
      id: customer.id,
      name: customer.full_name,
      phone: customer.phone,
      email: customer.email,
      area: address?.area || "-",

      address: address
        ? [
            address.house_no,
            address.street,
            address.area,
            address.city,
            address.state,
            address.pincode,
          ]
            .filter(Boolean)
            .join(", ")
        : "-",

      totalOrders: orders?.length || 0,

      totalSpent,

      totalSubscriptions:
        subscriptions?.length || 0,

      activeSubscriptions:
        subscriptions?.filter(
          (s) => s.status === "Active"
        ).length || 0,

      latestOrderDate:
        orders?.length > 0
          ? orders[0].created_at
          : "",

      latestSubscriptionDate:
        subscriptions?.length > 0
          ? subscriptions[0].created_at
          : "",
    });
  }

  return result;
}
// =============================
// Get Customer By ID
// =============================
export async function getCustomerByIdService(id) {
  // Customer
  const { data: customer, error } = await supabaseAdmin
    .from("customers")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;

  // Orders
  const { data: orders = [] } = await supabaseAdmin
    .from("orders")
    .select("*")
    .eq("customer_id", id)
    .order("created_at", { ascending: false });

  // Subscriptions
  const { data: subscriptions = [] } = await supabaseAdmin
    .from("subscriptions")
    .select("*")
    .eq("customer_id", id)
    .order("created_at", { ascending: false });

  // Total Spent
  const totalSpent = orders.reduce(
    (sum, order) => sum + Number(order.total_amount || 0),
    0
  );
  // Addresses
// Addresses
const { data: addresses = [], error: addressError } =
  await supabaseAdmin
    .from("addresses")
    .select("*")
    .eq("customer_id", id)
    .order("created_at", { ascending: false });

if (addressError) {
  throw addressError;
}

  return {
    ...customer,

    totalOrders: orders.length,

    totalSpent,

    totalSubscriptions: subscriptions.length,

    activeSubscriptions: subscriptions.filter(
      (s) => s.status === "Active"
    ).length,

    orders,

    subscriptions,
    // ✅ ADD THIS
  addresses,
  };
}