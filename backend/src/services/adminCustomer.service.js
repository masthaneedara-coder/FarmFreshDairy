import { supabaseAdmin } from "../config/supabase.js";

// ===================================
// Check whether subscription is currently paused
// ===================================
function isSubscriptionCurrentlyPaused(subscription) {
  if (
    !subscription.is_paused ||
    !subscription.pause_from ||
    !subscription.pause_to
  ) {
    return false;
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    today >= subscription.pause_from &&
    today <= subscription.pause_to
  );
}
// ===================================
// Get subscription status for Admin
// ===================================
function getSubscriptionDisplayStatus(subscription) {
  // Currently inside pause period
  if (isSubscriptionCurrentlyPaused(subscription)) {
    return "Paused";
  }

  // Pause period has ended
  if (
    subscription.status === "Paused" &&
    subscription.pause_to
  ) {
    const today = new Date().toISOString().split("T")[0];

    if (today > subscription.pause_to) {
      return "Active";
    }
  }

  // Normal active subscription
  if (subscription.status === "Active") {
    return "Active";
  }

  return subscription.status || "Unknown";
}

// ===================================
// Get All Customers
// ===================================
export async function getAllCustomersService() {
  const { data: customers, error } = await supabaseAdmin
    .from("customers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  const result = [];

  for (const customer of customers) {
    // ===================================
    // Orders
    // ===================================

    const { data: orders = [] } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("customer_id", customer.id)
      .order("created_at", { ascending: false });

    // ===================================
    // Subscriptions
    // ===================================

    const { data: subscriptions = [] } =
      await supabaseAdmin
        .from("subscriptions")
        .select("*")
        .eq("customer_id", customer.id)
        .order("created_at", { ascending: false });

    // ===================================
    // Address
    // ===================================

    const { data: addresses } = await supabaseAdmin
      .from("addresses")
      .select("*")
      .eq("customer_id", customer.id)
      .order("created_at", { ascending: false })
      .limit(1);

    const address = addresses?.[0];

    // ===================================
    // Total Spent
    // ===================================

    const totalSpent = orders.reduce(
      (sum, order) =>
        sum + Number(order.total_amount || 0),
      0
    );

   // ===================================
// Subscription Counts
// ===================================

const activeSubscriptions = subscriptions.filter(
  (subscription) =>
    getSubscriptionDisplayStatus(subscription) === "Active"
);

const pausedSubscriptions = subscriptions.filter(
  (subscription) =>
    getSubscriptionDisplayStatus(subscription) === "Paused"
);

const stoppedSubscriptions = subscriptions.filter(
  (subscription) =>
    subscription.status === "Stopped"
);


// ===================================
// Customer Subscription Status
// ===================================

let customerSubscriptionStatus = "No Subscription";

if (pausedSubscriptions.length > 0) {
  customerSubscriptionStatus = "Paused";
} else if (activeSubscriptions.length > 0) {
  customerSubscriptionStatus = "Active";
} else if (stoppedSubscriptions.length > 0) {
  customerSubscriptionStatus = "Stopped";
}

// ===================================
// Latest Subscription
// ===================================

    const latestSubscription =
      subscriptions?.[0] || null;

    const latestSubscriptionStatus =
      latestSubscription
        ? getSubscriptionDisplayStatus(
            latestSubscription
          )
        : null;

    // ===================================
    // Customer Result
    // ===================================

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

      totalOrders: orders.length,

      totalSpent,

      totalSubscriptions:
        subscriptions.length,

      activeSubscriptions:
        activeSubscriptions.length,

      pausedSubscriptions:
        pausedSubscriptions.length,

      stoppedSubscriptions:
        stoppedSubscriptions.length,

      subscriptionStatus:
        customerSubscriptionStatus,

      latestSubscriptionStatus,

      latestSubscription:
        latestSubscription
          ? {
              id: latestSubscription.id,

              status:
                latestSubscriptionStatus,

              start_date:
                latestSubscription.start_date,

              end_date:
                latestSubscription.end_date,

              frequency:
                latestSubscription.frequency,

              is_paused:
                isSubscriptionCurrentlyPaused(
                  latestSubscription
                ),

              pause_from:
                latestSubscription.pause_from,

              pause_to:
                latestSubscription.pause_to,
            }
          : null,

      latestOrderDate:
        orders.length > 0
          ? orders[0].created_at
          : "",

      latestSubscriptionDate:
        latestSubscription
          ? latestSubscription.created_at
          : "",
    });
  }

  return result;
}
// ===================================
// Get Customer By ID
// ===================================
export async function getCustomerByIdService(id) {
  // ===================================
  // Customer
  // ===================================
  const { data: customer, error } =
    await supabaseAdmin
      .from("customers")
      .select("*")
      .eq("id", id)
      .single();

  if (error) throw error;

  // ===================================
  // Orders
  // ===================================
  const { data: orders = [] } =
    await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("customer_id", id)
      .order("created_at", {
        ascending: false,
      });

  // ===================================
  // Subscriptions
  // ===================================
  const { data: subscriptions = [] } =
    await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .eq("customer_id", id)
      .order("created_at", {
        ascending: false,
      });

  // ===================================
  // Total Spent
  // ===================================
  const totalSpent = orders.reduce(
    (sum, order) =>
      sum + Number(order.total_amount || 0),
    0
  );

  // ===================================
  // Addresses
  // ===================================
  const {
    data: addresses = [],
    error: addressError,
  } = await supabaseAdmin
    .from("addresses")
    .select("*")
    .eq("customer_id", id)
    .order("created_at", {
      ascending: false,
    });

  if (addressError) {
    throw addressError;
  }

  // ===================================
  // Subscription Counts
  // ===================================
  // ===================================
// Subscription Counts
// ===================================

const activeSubscriptions = subscriptions.filter(
  (subscription) =>
    subscription.status === "Active" &&
    !isSubscriptionCurrentlyPaused(subscription)
);

const pausedSubscriptions = subscriptions.filter(
  (subscription) =>
    isSubscriptionCurrentlyPaused(subscription)
);

const stoppedSubscriptions = subscriptions.filter(
  (subscription) =>
    subscription.status === "Stopped"
);

// ===================================
// Customer Subscription Status
// ===================================

let customerSubscriptionStatus = "No Subscription";

if (pausedSubscriptions.length > 0) {
  customerSubscriptionStatus = "Paused";
} else if (activeSubscriptions.length > 0) {
  customerSubscriptionStatus = "Active";
} else if (stoppedSubscriptions.length > 0) {
  customerSubscriptionStatus = "Stopped";
}

  // ===================================
  // Add display status to subscriptions
  // ===================================
  const formattedSubscriptions =
    subscriptions.map((subscription) => ({
      ...subscription,

      display_status:
        getSubscriptionDisplayStatus(
          subscription
        ),

      is_currently_paused:
        isSubscriptionCurrentlyPaused(
          subscription
        ),
    }));

  // ===================================
  // Latest Subscription
  // ===================================
  const latestSubscription =
    formattedSubscriptions[0] || null;

  return {
  ...customer,

  totalOrders: orders.length,

  totalSpent,

  totalSubscriptions:
    subscriptions.length,

  activeSubscriptions:
    activeSubscriptions.length,

  pausedSubscriptions:
    pausedSubscriptions.length,

  stoppedSubscriptions:
    stoppedSubscriptions.length,

  subscriptionStatus:
    customerSubscriptionStatus,

  latestSubscriptionStatus:
    latestSubscription
      ? latestSubscription.display_status
      : null,

  orders,

  subscriptions:
    formattedSubscriptions,

  addresses,
};
}