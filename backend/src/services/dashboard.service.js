import { supabaseAdmin } from "../config/supabase.js";

// ======================================
// Customer Wallet
// ======================================
async function getCustomerWallet(customerId) {
  const { data, error } = await supabaseAdmin
    .from("wallet_accounts")
    .select(`
      id,
      customer_id,
      balance,
      wallet_type,
      status
    `)
    .eq("customer_id", customerId)
    .maybeSingle();

  if (error) {
    console.error(
      "Customer wallet lookup error:",
      error
    );

    throw error;
  }

  return {
    balance: Number(data?.balance || 0),
    type: data?.wallet_type || "Prepaid",
    status: data?.status || "Active",
  };
}

// ======================================
// Customer Outstanding Billing
// ======================================
async function getCustomerOutstanding(customerId) {
  if (!customerId) {
    throw new Error("Customer ID is required");
  }

  const { data, error } = await supabaseAdmin
    .from("billing")
    .select(`
      id,
      invoice_number,
      invoice_type,
      subscription_id,
      order_id,
      customer_id,
      total_amount,
      payment_status,
      payment_method,
      invoice_date,
      billing_month,
      billing_year,
      subtotal,
      discount,
      gst_amount,
      delivered_days,
      daily_rate
    `)
    .eq("customer_id", customerId)
    .order("invoice_date", {
      ascending: false,
    });

  if (error) {
    console.error(
      "Customer outstanding billing error:",
      error
    );

    throw error;
  }

  // ======================================
  // Find unpaid COD/Postpaid bills
  // ======================================
  const unpaidBills = (data || []).filter((bill) => {
    const paymentMethod = String(
      bill.payment_method || ""
    )
      .trim()
      .toLowerCase();

    const paymentStatus = String(
      bill.payment_status || ""
    )
      .trim()
      .toLowerCase();

    // Only COD / Postpaid contributes
    // to outstanding amount.
    const isPostpaid =
      paymentMethod === "cod" ||
      paymentMethod === "postpaid";

    const isPaid =
      paymentStatus === "paid" ||
      paymentStatus === "completed" ||
      paymentStatus === "success" ||
      paymentStatus === "successful";

    return isPostpaid && !isPaid;
  });

  // ======================================
  // Calculate Outstanding
  // ======================================
  const outstanding = unpaidBills.reduce(
    (sum, bill) =>
      sum + Number(bill.total_amount || 0),
    0
  );

  return {
    outstanding,
    billCount: unpaidBills.length,
    bills: unpaidBills,
  };
}

// ======================================
// Customer Dashboard
// ======================================
export const getDashboardService = async (
  customerId
) => {
  if (!customerId) {
    return {
      error: new Error(
        "Customer ID is required"
      ),
    };
  }

  // ======================================
  // Customer
  // ======================================
  const {
    data: customer,
    error: customerError,
  } = await supabaseAdmin
    .from("customers")
    .select("*")
    .eq("id", customerId)
    .single();

  if (customerError) {
    return {
      error: customerError,
    };
  }

  // ======================================
  // Orders
  // ======================================
  const {
    data: orders,
    error: ordersError,
  } = await supabaseAdmin
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
    .order("order_date", {
      ascending: false,
    });

  if (ordersError) {
    throw ordersError;
  }

  const formattedOrders = (
    orders || []
  ).map((order) => ({
    id: order.id,

    orderNumber:
      order.order_number ||
      order.id.substring(0, 8),

    orderDate:
      order.order_date,

    totalAmount:
      Number(order.total_amount || 0),

    paymentMethod:
      order.payment_method,

    paymentStatus:
      order.payment_status ||
      "Pending",

    status:
      order.status ||
      "Pending",

    totalItems:
      order.order_items?.reduce(
        (sum, item) =>
          sum +
          Number(item.quantity || 0),
        0
      ) || 0,

    items:
      order.order_items || [],
  }));

  // ======================================
  // Subscriptions
  // ======================================
  const {
    data: subscriptions,
    error: subscriptionsError,
  } = await supabaseAdmin
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
    .order("created_at", {
      ascending: false,
    });

  if (subscriptionsError) {
    throw subscriptionsError;
  }

  const formattedSubscriptions = (
    subscriptions || []
  ).map((sub) => {
    const item =
      sub.subscription_items?.[0];

    return {
      id: sub.id,

      product:
        item?.products?.name ||
        "Milk Subscription",

      image:
        item?.products?.image ||
        "",

      quantity:
        item?.quantity ?? 1,

      size:
        item?.size ||
        "1L",

      monthlyAmount:
        sub.total_amount ??
        item?.price ??
        item?.unit_price ??
        0,

      deliveryType:
        sub.delivery_time ||
        "Morning",

      frequency:
        sub.frequency,

      startDate:
        sub.start_date,

      expireDate:
        sub.end_date,

      status:
        sub.status,

      is_paused:
        sub.is_paused,

      pause_from:
        sub.pause_from,

      pause_to:
        sub.pause_to,

      paused_days:
        sub.paused_days,

      address:
        sub.addresses,
    };
  });

  // ======================================
  // Addresses
  // ======================================
  const {
    data: addresses,
    error: addressError,
  } = await supabaseAdmin
    .from("addresses")
    .select("*")
    .eq("customer_id", customerId);

  if (addressError) {
    return {
      error: addressError,
    };
  }

  // ======================================
  // Wallet
  // ======================================
  const wallet =
    await getCustomerWallet(
      customerId
    );

  // ======================================
  // Outstanding Billing
  // ======================================
  const billing =
    await getCustomerOutstanding(
      customerId
    );

  // ======================================
  // Summary
  // ======================================
  const totalSpent =
    (orders || []).reduce(
      (sum, order) =>
        sum +
        Number(
          order.total_amount || 0
        ),
      0
    );

  const activeSubscriptions =
    (subscriptions || []).filter(
      (sub) =>
        sub.status === "Active" &&
        !sub.is_paused
    );

  const pausedSubscriptions =
    (subscriptions || []).filter(
      (sub) =>
        sub.is_paused
    );

  // ======================================
  // Final Dashboard Response
  // ======================================
  return {
    data: {
      // ==================================
      // Customer
      // ==================================
      customer,

      // ==================================
      // Summary
      // ==================================
      summary: {
        totalOrders:
          orders?.length || 0,

        totalSpent,

        totalSubscriptions:
          subscriptions?.length || 0,

        activeSubscriptions:
          activeSubscriptions.length,

        status:
          activeSubscriptions.length > 0
            ? "Active"
            : pausedSubscriptions.length > 0
            ? "Paused"
            : "No Subscription",
      },

      // ==================================
      // Wallet
      // ==================================
      wallet: {
        balance:
          wallet.balance,

        type:
          wallet.type,

        status:
          wallet.status,
      },

      // ==================================
      // Billing
      // ==================================
      billing: {
        outstanding:
          Number(
            billing.outstanding || 0
          ),

        billCount:
          Number(
            billing.billCount || 0
          ),

        type:
          "Postpaid",

        // Full unpaid bills
        // required for payment page
        bills:
          billing.bills || [],
      },

      // ==================================
      // Recent Orders
      // ==================================
      recentOrders:
        formattedOrders.slice(0, 5),

      // ==================================
      // Subscriptions
      // ==================================
      subscriptions:
        formattedSubscriptions,

      // ==================================
      // Addresses
      // ==================================
      addresses,
    },
  };
};