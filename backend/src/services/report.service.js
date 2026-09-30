import { supabaseAdmin } from "../config/supabase.js";

export async function getMonthlyDeliveryReportService(month, year) {
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
            id,
            name,
            size,
            image
          )
        )
      `)
      .lte("start_date", lastDay)
      .or(`end_date.is.null,end_date.gte.${firstDay}`);

  if (error) throw error;

  const report = [];

  for (const subscription of subscriptions) {

    // =====================================================
    // SUBSCRIPTION PERIOD
    // =====================================================

    const subscriptionStartDate =
      subscription.start_date
        ? String(subscription.start_date).slice(0, 10)
        : null;

    const subscriptionEndDate =
      subscription.end_date
        ? String(subscription.end_date).slice(0, 10)
        : null;

    // =====================================================
    // EFFECTIVE DELIVERY DATE RANGE
    // =====================================================
    // Use the later of:
    //   - first day of selected month
    //   - subscription start date
    //
    // And the earlier of:
    //   - last day of selected month
    //   - subscription end date
    // =====================================================

    const effectiveStartDate =
      subscriptionStartDate &&
      subscriptionStartDate > firstDay
        ? subscriptionStartDate
        : firstDay;

    const effectiveEndDate =
      subscriptionEndDate &&
      subscriptionEndDate < lastDay
        ? subscriptionEndDate
        : lastDay;

    // If there is no valid overlap, there are no deliveries
    // belonging to this subscription for this month.
    let deliveredDays = 0;
    let missedDays = 0;

    if (effectiveStartDate <= effectiveEndDate) {

      const { count: deliveredCount, error: deliveredError } =
        await supabaseAdmin
          .from("subscription_deliveries")
          .select("*", {
            count: "exact",
            head: true,
          })
          .eq("subscription_id", subscription.id)
          .eq("status", "Delivered")
          .gte("delivery_date", effectiveStartDate)
          .lte("delivery_date", effectiveEndDate);

      if (deliveredError) {
        throw deliveredError;
      }

      deliveredDays = deliveredCount || 0;

      const { count: missedCount, error: missedError } =
        await supabaseAdmin
          .from("subscription_deliveries")
          .select("*", {
            count: "exact",
            head: true,
          })
          .eq("subscription_id", subscription.id)
          .eq("status", "Missed")
          .gte("delivery_date", effectiveStartDate)
          .lte("delivery_date", effectiveEndDate);

      if (missedError) {
        throw missedError;
      }

      missedDays = missedCount || 0;
    }

    // =====================================================
    // PRODUCT / RATE
    // =====================================================

    const item = subscription.subscription_items?.[0];

    const quantity =
      Number(item?.quantity || 1);

    const dailyRate =
      Number(item?.unit_price || 0);

    const billAmount =
      Number(deliveredDays) * dailyRate;

    // =====================================================
    // REPORT
    // =====================================================

    report.push({
      customerId:
        subscription.customer_id,

      subscriptionId:
        subscription.id,

      customerName:
        subscription.customers?.full_name,

      phone:
        subscription.customers?.phone,

      area:
        subscription.addresses?.area,

      address: `${subscription.addresses?.house_no || ""}
${subscription.addresses?.street || ""}
${subscription.addresses?.city || ""}`,

      product:
        item?.products?.name,

      quantity,

      size:
        item?.size,

      deliveredDays,

      missedDays,

      dailyRate,

      monthlyAmount:
        subscription.total_amount,

      billAmount,

      paymentStatus:
        subscription.payment_status,

      status:
        subscription.status,
    });
  }

  return report;
}