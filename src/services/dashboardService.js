import { getDashboard } from "../config/api";

export async function fetchDashboard(customerId) {
  try {
    if (!customerId) {
      throw new Error("Customer ID is required");
    }

    const res = await getDashboard(customerId);

    if (!res?.success) {
      throw new Error(
        res?.message || "Unable to load dashboard"
      );
    }

    return res.dashboard || null;
  } catch (err) {
    console.error("Dashboard fetch error:", err);
    throw err;
  }
}
// ======================================
// Get Customer Outstanding Billing
// ======================================
export async function getCustomerOutstanding(customerId) {
  const { data, error } = await supabaseAdmin
    .from("billing")
    .select(`
      id,
      invoice_number,
      invoice_type,
      subscription_id,
      order_id,
      customer_id,
      subtotal,
      total_amount,
      discount,
      gst_percent,
      gst_amount,
      payment_status,
      payment_method,
      invoice_date,
      billing_month,
      billing_year,
      delivered_days,
      daily_rate,

      customers(
        id,
        full_name,
        phone,
        email
      ),

      subscriptions(
        id,
        status,
        start_date,
        end_date,
        delivery_time,
        frequency,

        addresses(
          house_no,
          street,
          area,
          city,
          state,
          pincode
        ),

        subscription_items(
          quantity,
          size,
          unit_price,

          products(
            id,
            name,
            image
          )
        )
      )
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

  const formattedBills = unpaidBills.map((bill) => {
    const subscription =
      bill.subscriptions || {};

    const item =
      subscription.subscription_items?.[0];

    const product =
      item?.products || {};

    const address =
      subscription.addresses || {};

    return {
      // ==============================
      // BILL
      // ==============================
      id: bill.id,

      invoice_number:
        bill.invoice_number,

      invoice_type:
        bill.invoice_type,

      customer_id:
        bill.customer_id,

      subscription_id:
        bill.subscription_id,

      order_id:
        bill.order_id,

      invoice_date:
        bill.invoice_date,

      billing_month:
        bill.billing_month,

      billing_year:
        bill.billing_year,

      subtotal:
        Number(bill.subtotal || 0),

      discount:
        Number(bill.discount || 0),

      gst_percent:
        Number(bill.gst_percent || 0),

      gst_amount:
        Number(bill.gst_amount || 0),

      total_amount:
        Number(bill.total_amount || 0),

      payment_status:
        bill.payment_status || "Pending",

      payment_method:
        bill.payment_method || "COD",

      delivered_days:
        Number(bill.delivered_days || 0),

      daily_rate:
        Number(
          bill.daily_rate ??
          item?.unit_price ??
          0
        ),

      // ==============================
      // CUSTOMER
      // ==============================
      customer_name:
        bill.customers?.full_name || "-",

      customer_phone:
        bill.customers?.phone || "-",

      customer_email:
        bill.customers?.email || "-",

      // ==============================
      // PRODUCT
      // ==============================
      product_id:
        product.id || null,

      product_name:
        product.name || "-",

      product_image:
        product.image || "",

      quantity:
        Number(item?.quantity || 0),

      size:
        item?.size || "-",

      // ==============================
      // SUBSCRIPTION
      // ==============================
      subscription_status:
        subscription.status || "-",

      start_date:
        subscription.start_date || null,

      end_date:
        subscription.end_date || null,

      delivery_time:
        subscription.delivery_time || "-",

      frequency:
        subscription.frequency || "-",

      // ==============================
      // ADDRESS
      // ==============================
      address: {
        house_no:
          address.house_no || "",

        street:
          address.street || "",

        area:
          address.area || "",

        city:
          address.city || "",

        state:
          address.state || "",

        pincode:
          address.pincode || "",
      },
    };
  });

  const outstanding =
    formattedBills.reduce(
      (sum, bill) =>
        sum + Number(bill.total_amount || 0),
      0
    );

  return {
    outstanding,
    billCount: formattedBills.length,
    bills: formattedBills,
  };
}