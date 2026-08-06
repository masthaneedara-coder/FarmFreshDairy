import { supabaseAdmin } from "../config/supabase.js";

export async function getMonthlyDeliveryReportService(
  month,
  year
) {
  const firstDay =
    `${year}-${String(month).padStart(2, "0")}-01`;

  const lastDay =
    new Date(year, month, 0)
      .toISOString()
      .split("T")[0];

 const { data: subscriptions, error } =
  await supabaseAdmin
    .from("subscriptions")
    .select(`
      *,
      customers(
      id,
        full_name,
        phone
      ),
      addresses(
        house_no,
        street,
        area,
        city
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
    .lte("start_date", lastDay)
    .or(`end_date.is.null,end_date.gte.${firstDay}`);

  if (error) throw error;

  const report = [];

  for (const subscription of subscriptions) {

    // Count Delivered Days
    const { count: deliveredDays } =
      await supabaseAdmin
        .from("subscription_deliveries")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("subscription_id", subscription.id)
        .eq("status", "Delivered")
        .gte("delivery_date", firstDay)
        .lte("delivery_date", lastDay);

    // Count Missed Days
    const { count: missedDays } =
      await supabaseAdmin
        .from("subscription_deliveries")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("subscription_id", subscription.id)
        .eq("status", "Missed")
        .gte("delivery_date", firstDay)
        .lte("delivery_date", lastDay);

   const item = subscription.subscription_items?.[0];

const quantity = Number(item?.quantity || 1);

// unit_price is already the DAILY PRICE
const dailyRate = Number(item?.unit_price || 0);

const billAmount = deliveredDays * dailyRate;

report.push({
  customerId: subscription.customer_id,   // <-- ADD THIS
  subscriptionId: subscription.id,

  customerName: subscription.customers?.full_name,
  phone: subscription.customers?.phone,

  area: subscription.addresses?.area,

  address: `${subscription.addresses?.house_no || ""}
${subscription.addresses?.street || ""}
${subscription.addresses?.city || ""}`,

  product: item?.products?.name,
  quantity,
  size: item?.size,

  deliveredDays,
  missedDays,

  dailyRate,

  monthlyAmount: subscription.total_amount,

  billAmount,

  paymentStatus: subscription.payment_status,

  status: subscription.status,
});
}

return report;
}
  