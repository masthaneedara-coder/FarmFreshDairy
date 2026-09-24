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
      invoice_date,
      total_amount,
      payment_status,
      payment_method,
      billing_month,
      billing_year,
      delivered_days,
      daily_rate
    `)
    .eq("customer_id", customerId)
    .order("invoice_date", {
      ascending: false,
    });

  if (error) {
    console.error(
      "Get customer outstanding error:",
      error
    );

    throw error;
  }

  const unpaidBills = (data || []).filter((bill) => {
    const paymentStatus = String(
      bill.payment_status || ""
    )
      .trim()
      .toLowerCase();

    const paymentMethod = String(
      bill.payment_method || ""
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