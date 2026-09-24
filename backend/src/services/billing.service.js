import { supabaseAdmin } from "../config/supabase.js";

// ======================================
// Generate Invoice Number
// ======================================Load Subscription
export async function generateInvoiceNumber() {
  const { count, error } = await supabaseAdmin
    .from("billing")
    .select("*", {
      count: "exact",
      head: true,
    });

  if (error) throw error;

  const next = (count || 0) + 1;

  return `INV${String(next).padStart(6, "0")}`;
}

// ======================================
// Get All Bills
// ======================================
export async function getAllBillsService() {
  const { data, error } = await supabaseAdmin
  .from("billing")
  .select(`
    *,
    customers(
      full_name,
      phone
    ),
    orders(
      customer_name,
      phone,
      area,
      address,
      total_amount
    ),
    subscriptions(
      status,
      start_date,
      end_date,
      delivery_time,
      total_amount,
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
        products(
          name
        )
      )
    )
  `)
  .order("created_at", {
    ascending: false,
  });

  if (error) throw error;

 return data.map((bill) => ({
  id: bill.id,

  invoiceNumber: bill.invoice_number,
  billingDate: bill.invoice_date,

  customerName:
    bill.orders?.customer_name ||
    bill.customers?.full_name ||
    "-",

  phone:
    bill.orders?.phone ||
    bill.customers?.phone ||
    "-",

  area:
    bill.orders?.area ||
    bill.subscriptions?.addresses?.area ||
    "-",

  address:
    bill.orders?.address ||
    (
      bill.subscriptions?.addresses
        ? `${bill.subscriptions.addresses.house_no},
           ${bill.subscriptions.addresses.street},
           ${bill.subscriptions.addresses.area},
           ${bill.subscriptions.addresses.city}`
        : "-"
    ),

  deliveryType:
    bill.subscriptions?.delivery_time || "-",

  subscriptionStatus:
    bill.subscriptions?.status || "-",

  startDate:
    bill.subscriptions?.start_date,

  expireDate:
    bill.subscriptions?.end_date,

  billingStatus:
    bill.payment_status || "Pending",

  amount:
    Number(
      bill.total_amount ||
      bill.orders?.total_amount ||
      0
    ),

  discount:
    Number(bill.discount || 0),

  gst:
    Number(bill.gst_amount || 0),

  product:
    bill.subscriptions?.subscription_items?.[0]
      ?.products?.name || "-",

  qty:
    bill.subscriptions?.subscription_items?.[0]
      ?.quantity || "-",

  billingMonth:
    bill.billing_month,

  billingYear:
    bill.billing_year,

  deliveredDays:
    bill.delivered_days,

  dailyRate:
    bill.daily_rate,
}));
}

// ======================================
// Get Bill By ID
// ======================================
export async function getBillByIdService(id) {
  const {
    data,
    error,
  } = await supabaseAdmin
    .from("billing")
    .select(`
      *,
      customers(*),
      orders(*),
      subscriptions(*)
    `)
    .eq("id", id)
    .single();

  if (error) throw error;

  return data;
}

// ======================================
// Create Invoice From Order
// ======================================
export async function createOrderInvoiceService(orderId) {

  // Check if invoice already exists
  const { data: existing } = await supabaseAdmin
    .from("billing")
    .select("*")
    .eq("order_id", orderId)
    .maybeSingle();

  if (existing) {
    return existing;
  }

  // Load order
  const {
    data: order,
    error: orderError,
  } = await supabaseAdmin
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (orderError) throw orderError;

  const invoiceNumber =
    await generateInvoiceNumber();

  const subtotal =
    Number(order.subtotal || 0);

  const gstPercent = 5;

  const gstAmount =
    subtotal * gstPercent / 100;

  const total =
    subtotal +
    gstAmount -
    Number(order.discount || 0);

  const {
    data,
    error,
  } = await supabaseAdmin
    .from("billing")
    .insert({
      invoice_number: invoiceNumber,
      invoice_type: "Order",
      order_id: order.id,
      customer_id: order.customer_id,
      invoice_date: new Date().toISOString(),
      subtotal,
      gst_percent: gstPercent,
      gst_amount: gstAmount,
      discount: order.discount || 0,
      total_amount: total,
      payment_status: order.payment_status,
      payment_method: order.payment_method,
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}
export async function updateBillingStatusService(id, status) {
  const { data, error } = await supabaseAdmin
    .from("billing")
    .update({
      payment_status: status,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return data;
}
// ======================================
// Create Subscription Invoice
// ======================================
export async function createSubscriptionInvoiceService(
  subscriptionId,
  month,
  year
) {

  // Step 1: Load Subscription
  const { data: subscription, error } =
  await supabaseAdmin
    .from("subscriptions")
    .select(`
      *,
      customers(
        full_name,
        phone
      ),
      subscription_items(
        quantity,
        size,
        unit_price,
        products(
          name
        )
      )
    `)
    .eq("id", subscriptionId)
    .single();

  if (error) throw error;

  // Step 2: Calculate Billing Month
  const firstDay =
    `${year}-${String(month).padStart(2, "0")}-01`;

  const lastDay =
    new Date(year, month, 0)
      .toISOString()
      .split("T")[0];

  const totalDays =
    new Date(year, month, 0).getDate();

  console.log(firstDay);
  console.log(lastDay);
  console.log(totalDays);

  // Step 3: Count Delivered Days
  const {
  count: deliveredDays,
  error: deliveredError,
} = await supabaseAdmin
  .from("subscription_deliveries")
  .select("*", {
    count: "exact",
    head: true,
  })
  .eq("subscription_id", subscriptionId)
  .eq("status", "Delivered")
  .gte("delivery_date", firstDay)
  .lte("delivery_date", lastDay);
  const item = subscription.subscription_items?.[0];

const quantity = Number(item?.quantity || 1);

// unit_price now stores the DAILY PRICE
const dailyRate = Number(item?.unit_price || 0);

const finalAmount = deliveredDays * dailyRate;
const invoiceNumber =
  await generateInvoiceNumber();

const gstPercent = 5;

const gstAmount =
  finalAmount * gstPercent / 100;

const grandTotal =
  finalAmount + gstAmount;

if (deliveredError) {
  throw deliveredError;
}
const { data, error: billingError } =
  await supabaseAdmin
    .from("billing")
   .insert({
  invoice_number: invoiceNumber,
  invoice_type: "Subscription",

  subscription_id: subscription.id,
  customer_id: subscription.customer_id,

  invoice_date: new Date().toISOString(),

subtotal: finalAmount,

delivered_days: deliveredDays,

daily_rate: dailyRate,

  gst_percent: gstPercent,
  gst_amount: gstAmount,

  total_amount: grandTotal,

  payment_status: "Pending",
  payment_method: subscription.payment_method,

  billing_month: month,
  billing_year: year,

  delivered_days: deliveredDays,
  daily_rate: dailyRate,
})
    .select()
    .single();

if (billingError) throw billingError;

return data;
console.log("Delivered Days:", deliveredDays);
}
// ======================================
// Generate Monthly Subscription Invoices
// ======================================
export async function generateMonthlySubscriptionInvoicesService(
  month,
  year
) {
  const { data: subscriptions, error } =
    await supabaseAdmin
      .from("subscriptions")
      .select("id")
      .eq("status", "Active");

  if (error) throw error;

  console.log("--------------------------------");
  console.log("Active Subscriptions:", subscriptions.length);
  console.log(subscriptions);
  console.log("--------------------------------");

  const invoices = [];

  for (const subscription of subscriptions) {

    console.log("Processing:", subscription.id);

    const { data: existing } =
      await supabaseAdmin
        .from("billing")
        .select("id")
        .eq("subscription_id", subscription.id)
        .eq("billing_month", month)
        .eq("billing_year", year)
        .maybeSingle();

    console.log("Existing Invoice:", existing);

    if (existing) {
      console.log("Skipped");
      continue;
    }

    console.log("Generating invoice...");

    const invoice =
      await createSubscriptionInvoiceService(
        subscription.id,
        month,
        year
      );

    invoices.push(invoice);

    console.log("Generated:", invoice.invoice_number);
  }

  console.log("Generated Total:", invoices.length);

  return {
    generated: invoices.length,
    invoices,
  };
}
export async function getSubscriptionBillsService() {

    const { data, error } =
        await supabaseAdmin
            .from("billing")
            .select(`
                *,
                customers(
                    full_name,
                    phone
                ),
                subscriptions(
                    total_amount
                )
            `)
            .eq("invoice_type", "Subscription")
            .order("invoice_date", {
                ascending: false,
            });

    if (error) throw error;

    return data;
}
// ======================================
// Get Customer Outstanding Billing
// ======================================
export async function getCustomerOutstandingService(customerId) {
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
      total_amount,
      payment_status,
      payment_method,
      invoice_date,
      billing_month,
      billing_year
    `)
    .eq("customer_id", customerId)
    .in("payment_method", ["COD", "POSTPAID", "Postpaid", "cod", "postpaid"])
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
    const status = String(
      bill.payment_status || ""
    ).trim().toLowerCase();

    return ![
      "paid",
      "completed",
      "success",
      "successful"
    ].includes(status);
  });

  const outstanding = unpaidBills.reduce(
    (total, bill) =>
      total + Number(bill.total_amount || 0),
    0
  );

  return {
    outstanding,
    billCount: unpaidBills.length,
    bills: unpaidBills,
  };
}
// ======================================
// Mark Billing Paid After Razorpay Payment
// ======================================
export async function markBillingPaidService({
  billingId,
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
  customerId,
}) {
  if (!billingId) {
    throw new Error("Billing ID is required");
  }

  if (!razorpayOrderId) {
    throw new Error("Razorpay order ID is required");
  }

  if (!razorpayPaymentId) {
    throw new Error("Razorpay payment ID is required");
  }

  if (!razorpaySignature) {
    throw new Error("Razorpay signature is required");
  }

  if (!customerId) {
    throw new Error("Customer ID is required");
  }

  // Load billing record
  const { data: bill, error: billError } =
    await supabaseAdmin
      .from("billing")
      .select("*")
      .eq("id", billingId)
      .eq("customer_id", customerId)
      .single();

  if (billError) {
    throw billError;
  }

  if (!bill) {
    throw new Error("Billing record not found");
  }

  // Already paid
  const currentStatus = String(
    bill.payment_status || ""
  )
    .trim()
    .toLowerCase();

  if (
    ["paid", "completed", "success", "successful"].includes(
      currentStatus
    )
  ) {
    return {
      alreadyPaid: true,
      bill,
    };
  }

  // Load Razorpay payment
  const { default: razorpay } =
    await import("../config/razorpay.js");

  // Verify Razorpay signature
  const crypto = await import("crypto");

  const generatedSignature =
    crypto
      .createHmac(
        "sha256",
        process.env.RAZORPAY_KEY_SECRET
      )
      .update(
        `${razorpayOrderId}|${razorpayPaymentId}`
      )
      .digest("hex");

  if (
    generatedSignature !== razorpaySignature
  ) {
    throw new Error(
      "Invalid Razorpay payment signature"
    );
  }

  // Fetch Razorpay order
  const razorpayOrder =
    await razorpay.orders.fetch(
      razorpayOrderId
    );

  if (!razorpayOrder) {
    throw new Error(
      "Razorpay order not found"
    );
  }

  const billAmount = Number(
    bill.total_amount || 0
  );

  const razorpayAmount =
    Number(razorpayOrder.amount || 0) / 100;

  // IMPORTANT:
  // Razorpay amount must exactly match bill amount
  if (
    Math.round(razorpayAmount * 100) !==
    Math.round(billAmount * 100)
  ) {
    throw new Error(
      `Payment amount mismatch. Bill ₹${billAmount}, Razorpay ₹${razorpayAmount}`
    );
  }

  // Check Razorpay payment
  const razorpayPayment =
    await razorpay.payments.fetch(
      razorpayPaymentId
    );

  if (!razorpayPayment) {
    throw new Error(
      "Razorpay payment not found"
    );
  }

  if (
    razorpayPayment.order_id !==
    razorpayOrderId
  ) {
    throw new Error(
      "Razorpay payment does not belong to this order"
    );
  }

  if (
    razorpayPayment.status !== "captured"
  ) {
    throw new Error(
      `Payment is not captured. Current status: ${razorpayPayment.status}`
    );
  }

  // Check whether this payment was already recorded
  const { data: existingPayment } =
    await supabaseAdmin
      .from("payments")
      .select("*")
      .eq(
        "transaction_id",
        razorpayPaymentId
      )
      .maybeSingle();

  if (existingPayment) {
    // Make sure billing is paid
    const { data: updatedBill, error } =
      await supabaseAdmin
        .from("billing")
        .update({
          payment_status: "Paid",
          payment_method: "ONLINE",
        })
        .eq("id", billingId)
        .select()
        .single();

    if (error) throw error;

    return {
      alreadyPaid: true,
      bill: updatedBill,
      payment: existingPayment,
    };
  }

  // Insert payment record
  const { data: payment, error: paymentError } =
    await supabaseAdmin
      .from("payments")
      .insert({
        order_id: bill.order_id || null,
        subscription_id:
          bill.subscription_id || null,
        customer_id: customerId,
        amount: billAmount,
        payment_method: "ONLINE",
        transaction_id: razorpayPaymentId,
        payment_status: "Paid",
        paid_at: new Date().toISOString(),
      })
      .select()
      .single();

  if (paymentError) {
    throw paymentError;
  }

  // Mark bill paid
  const { data: updatedBill, error: billingError } =
    await supabaseAdmin
      .from("billing")
      .update({
        payment_status: "Paid",
        payment_method: "ONLINE",
      })
      .eq("id", billingId)
      .select()
      .single();

  if (billingError) {
    throw billingError;
  }

  return {
    alreadyPaid: false,
    bill: updatedBill,
    payment,
  };
}