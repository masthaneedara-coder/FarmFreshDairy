import { supabaseAdmin } from "../config/supabase.js";

export async function generateMonthlyBills(month, year) {
  try {

    // ===============================
    // Month Date Range
    // ===============================
    const fromDate = `${year}-${String(month).padStart(2, "0")}-01`;

    const lastDay = new Date(year, month, 0).getDate();

    const toDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

    // ===============================
    // Active Subscriptions
    // ===============================
    const {
      data: subscriptions,
      error: subscriptionError,
    } = await supabaseAdmin
      .from("subscriptions")
      .select(`
        id,
        customer_id,
        customers(
          id,
          full_name,
          phone
        )
      `)
      .eq("status", "Active");

    if (subscriptionError) throw subscriptionError;

    let generated = 0;
    let updated = 0;
    let totalRevenue = 0;

    // ===============================
    // Generate Bill
    // ===============================
    for (const subscription of subscriptions) {

      const {
        data: deliveries,
        error: deliveryError,
      } = await supabaseAdmin
        .from("subscription_deliveries")
        .select(`
          id,
          status,
          delivery_date,
          subscription_delivery_items(
            quantity,
            unit_price,
            total_price
          )
        `)
        .eq("subscription_id", subscription.id)
        .gte("delivery_date", fromDate)
        .lte("delivery_date", toDate);

      if (deliveryError) throw deliveryError;

      let deliveredDays = 0;
      let missedDays = 0;
      let subtotal = 0;

      (deliveries || []).forEach(delivery => {

        if (delivery.status === "Delivered") {

          deliveredDays++;

          (delivery.subscription_delivery_items || []).forEach(item => {

            subtotal += Number(item.total_price || 0);

          });

        }

        if (delivery.status === "Missed") {

          missedDays++;

        }

      });

      const discount = 0;

      const totalAmount = subtotal - discount;

      totalRevenue += totalAmount;

      // ===============================
      // Check Existing Bill
      // ===============================
      const {
        data: existingBill,
      } = await supabaseAdmin
        .from("monthly_bills")
        .select("id")
        .eq("customer_id", subscription.customer_id)
        .eq("subscription_id", subscription.id)
        .eq("month", month)
        .eq("year", year)
        .maybeSingle();

      // ===============================
      // Update Existing
      // ===============================
      if (existingBill) {

        const { error } = await supabaseAdmin
          .from("monthly_bills")
          .update({
            delivered_days: deliveredDays,
            missed_days: missedDays,
            subtotal: subtotal,
            discount: discount,
            total_amount: totalAmount,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingBill.id);

        if (error) throw error;

        updated++;

      }

      // ===============================
      // Create New Bill
      // ===============================
      else {

        const { error } = await supabaseAdmin
          .from("monthly_bills")
          .insert({
            customer_id: subscription.customer_id,
            subscription_id: subscription.id,

            month,
            year,

            delivered_days: deliveredDays,
            missed_days: missedDays,

            subtotal: subtotal,
            discount: discount,
            total_amount: totalAmount,

            payment_status: "Pending",
          });

        if (error) throw error;

        generated++;

      }

    }

    // ===============================
    // Summary
    // ===============================
    return {

      success: true,

      generated,

      updated,

      totalRevenue,

      totalCustomers: subscriptions.length,

    };

  } catch (err) {

    throw err;

  }
}
export async function getMonthlyBills(month, year) {

  const { data, error } = await supabaseAdmin
    .from("monthly_bills")
    .select(`
      *,
      customers(
        id,
        full_name,
        phone
      ),
      subscriptions(
        id
      )
    `)
    .eq("month", month)
    .eq("year", year)
    .order("generated_at", {
      ascending: false,
    });

  if (error) throw error;

  return data;
}
export async function getCustomerMonthlyBill(
  customerId,
  month,
  year
) {

  const { data, error } = await supabaseAdmin
    .from("monthly_bills")
    .select(`
      *,
      customers(*),
      subscriptions(*)
    `)
    .eq("customer_id", customerId)
    .eq("month", month)
    .eq("year", year)
    .maybeSingle();

  if (error) throw error;

  return data;
}
export async function markMonthlyBillPaid(
  billId
) {

  const { data, error } = await supabaseAdmin
    .from("monthly_bills")
    .update({
      payment_status: "Paid",
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", billId)
    .select()
    .single();

  if (error) throw error;

  return data;
}
export async function getMonthlyBillDetails(
  customerId,
  month,
  year
) {

  // Monthly Bill
  const { data: bill, error: billError } =
    await supabaseAdmin
      .from("monthly_bills")
      .select(`
        *,
        customers(*),
        subscriptions(*)
      `)
      .eq("customer_id", customerId)
      .eq("month", month)
      .eq("year", year)
      .single();

  if (billError) throw billError;

  // Daily Deliveries
  const fromDate =
    `${year}-${String(month).padStart(2,"0")}-01`;

  const lastDay =
    new Date(year, month, 0).getDate();

  const toDate =
    `${year}-${String(month).padStart(2,"0")}-${String(lastDay).padStart(2,"0")}`;

  const {
    data: deliveries,
    error: deliveryError,
  } = await supabaseAdmin
    .from("subscription_deliveries")
    .select(`
      *,
      subscription_delivery_items(
        *,
        products(
          id,
          name,
          image
        )
      ),
      addresses(*)
    `)
    .eq("subscription_id", bill.subscription_id)
    .gte("delivery_date", fromDate)
    .lte("delivery_date", toDate)
    .order("delivery_date");

  if (deliveryError) throw deliveryError;

  return {

    bill,

    customer: bill.customers,

    subscription: bill.subscriptions,

    deliveries,

  };

}