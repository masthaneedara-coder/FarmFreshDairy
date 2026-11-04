import { supabaseAdmin } from "../config/supabase.js";

// Monthly delivery report.
// ID filters are batched to keep Supabase request URLs below HTTP limits.
const ID_BATCH_SIZE = 100;

async function fetchInBatches(ids, fetchBatch) {
  const results = [];
  for (let index = 0; index < ids.length; index += ID_BATCH_SIZE) {
    const batch = ids.slice(index, index + ID_BATCH_SIZE);
    const rows = await fetchBatch(batch);
    results.push(...(rows || []));
  }
  return results;
}

const asNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const dateOnly = (value) => String(value || "").slice(0, 10);

export async function getMonthlyDeliveryReportService(month, year) {
  const numericMonth = Number(month);
  const numericYear = Number(year);

  if (
    !Number.isInteger(numericMonth) ||
    numericMonth < 1 ||
    numericMonth > 12 ||
    !Number.isInteger(numericYear) ||
    numericYear < 2000
  ) {
    throw new Error("Invalid month or year.");
  }

  const firstDay = `${numericYear}-${String(numericMonth).padStart(2, "0")}-01`;
  const lastDate = new Date(numericYear, numericMonth, 0);
  const lastDay = `${numericYear}-${String(numericMonth).padStart(2, "0")}-${String(
    lastDate.getDate()
  ).padStart(2, "0")}`;

  if (!supabaseAdmin) {
    throw new Error("Supabase admin client is not configured.");
  }

  // 1. All registered customers.
  const { data: customers, error: customerError } = await supabaseAdmin
    .from("customers")
    .select("id, full_name, phone, role, is_active")
    .eq("role", "customer");

  if (customerError) throw customerError;

  // 2. All subscriptions. Delivery rows themselves are restricted to the
  // selected month below; retaining older subscriptions allows historical
  // deliveries to be reported even if a subscription is now inactive/expired.
  const { data: subscriptions, error: subscriptionError } = await supabaseAdmin
    .from("subscriptions")
    .select(`
      id,
      customer_id,
      start_date,
      end_date,
      status,
      customers(id, full_name, phone),
      addresses(house_no, street, area, city),
      subscription_items(
        quantity,
        size,
        unit_price,
        products(id, name, size, image)
      )
    `);

  if (subscriptionError) throw subscriptionError;

  const allSubscriptions = subscriptions || [];
  const subscriptionIds = allSubscriptions.map((subscription) => subscription.id);

  // 3. Deliveries in the selected calendar month.
  let allDeliveries = [];
  if (subscriptionIds.length) {
    allDeliveries = await fetchInBatches(subscriptionIds, async (batch) => {
      const { data, error } = await supabaseAdmin
        .from("subscription_deliveries")
        .select("id, delivery_date, status, subscription_id")
        .in("subscription_id", batch)
        .gte("delivery_date", firstDay)
        .lte("delivery_date", lastDay)
        .order("delivery_date", { ascending: true });

      if (error) throw error;
      return data || [];
    });
  }

  // 4. Items belonging to those deliveries.
  const deliveryIds = allDeliveries.map((delivery) => delivery.id);
  let allDeliveryItems = [];
  if (deliveryIds.length) {
    allDeliveryItems = await fetchInBatches(deliveryIds, async (batch) => {
      const { data, error } = await supabaseAdmin
        .from("subscription_delivery_items")
        .select("delivery_id, quantity, total_price, is_extra")
        .in("delivery_id", batch);

      if (error) throw error;
      return data || [];
    });
  }

  // 5. Monthly bills, fetched in batches too.
  let monthlyBills = [];
  if (subscriptionIds.length) {
    monthlyBills = await fetchInBatches(subscriptionIds, async (batch) => {
      const { data, error } = await supabaseAdmin
        .from("monthly_bills")
        .select(`
          id, subscription_id, month, year, delivered_days, missed_days,
          subtotal, discount, gst_amount, total_amount, payment_status, paid_at
        `)
        .in("subscription_id", batch)
        .eq("month", numericMonth)
        .eq("year", numericYear);

      if (error) throw error;
      return data || [];
    });
  }

  // 6. Customer-wise pause history for the selected month.
  // This table is populated by recordPauseHistoryService when a paused
  // subscription is renewed/closed, with one row per calendar-month segment.
  const { data: pauseHistoryRows, error: pauseHistoryError } = await supabaseAdmin
    .from("subscription_pause_history")
    .select("customer_id, subscription_id, pause_from, pause_to, paused_days")
    .eq("pause_month", numericMonth)
    .eq("pause_year", numericYear)
    .order("pause_from", { ascending: true });

  if (pauseHistoryError) throw pauseHistoryError;

  const pauseHistoryByCustomer = new Map();
  for (const pauseRow of pauseHistoryRows || []) {
    if (!pauseRow.customer_id) continue;
    const list = pauseHistoryByCustomer.get(pauseRow.customer_id) || [];
    list.push({
      subscriptionId: pauseRow.subscription_id,
      pauseFrom: pauseRow.pause_from,
      pauseTo: pauseRow.pause_to,
      pausedDays: asNumber(pauseRow.paused_days),
    });
    pauseHistoryByCustomer.set(pauseRow.customer_id, list);
  }

  const deliveriesBySubscription = new Map();
  for (const delivery of allDeliveries) {
    const list = deliveriesBySubscription.get(delivery.subscription_id) || [];
    list.push(delivery);
    deliveriesBySubscription.set(delivery.subscription_id, list);
  }

  const itemsByDelivery = new Map();
  for (const item of allDeliveryItems) {
    const list = itemsByDelivery.get(item.delivery_id) || [];
    list.push(item);
    itemsByDelivery.set(item.delivery_id, list);
  }

  const billsBySubscription = new Map();
  for (const bill of monthlyBills) {
    const list = billsBySubscription.get(bill.subscription_id) || [];
    list.push(bill);
    billsBySubscription.set(bill.subscription_id, list);
  }

  // Aggregate by CUSTOMER, not by subscription. This is important when a
  // customer has more than one subscription: a calendar date must count once.
  const customerReports = new Map();

  const ensureCustomer = (customerId, customerData = {}) => {
    if (!customerReports.has(customerId)) {
      customerReports.set(customerId, {
        customerId,
        customerName: customerData.full_name || "Unknown Customer",
        phone: customerData.phone || "",
        area: "",
        address: "",
        product: "",
        quantity: 0,
        size: null,
        deliveredDateSet: new Set(),
        missedDateSet: new Set(),
        normalQuantity: 0,
        normalAmount: 0,
        extraQuantity: 0,
        extraAmount: 0,
        dailyRate: 0,
        billDiscount: 0,
        gstAmount: 0,
        monthlyBillTotal: 0,
        hasMonthlyBill: false,
        paymentStatuses: [],
        monthlyBillIds: [],
        paidAtValues: [],
        subscriptionStatuses: [],
        subscriptionIds: [],
      });
    }
    return customerReports.get(customerId);
  };

  for (const subscription of allSubscriptions) {
    if (!subscription.customer_id) continue;

    const customer = ensureCustomer(subscription.customer_id, {
      full_name: subscription.customers?.full_name,
      phone: subscription.customers?.phone,
    });

    customer.subscriptionIds.push(subscription.id);
    if (!customer.area) customer.area = subscription.addresses?.area || "";
    if (!customer.address) {
      customer.address = [
        subscription.addresses?.house_no,
        subscription.addresses?.street,
        subscription.addresses?.city,
      ].filter(Boolean).join("\n");
    }
    if (!customer.product) {
      customer.product =
        subscription.subscription_items?.[0]?.products?.name || "";
    }
    if (!customer.size) {
      customer.size = subscription.subscription_items?.[0]?.size || null;
    }
    if (subscription.status) customer.subscriptionStatuses.push(subscription.status);

    const subscriptionItem = subscription.subscription_items?.[0];
    const fallbackQuantity = asNumber(subscriptionItem?.quantity) || 1;
    const fallbackDailyRate = asNumber(subscriptionItem?.unit_price);
    if (!customer.dailyRate) customer.dailyRate = fallbackDailyRate;

    const deliveries = deliveriesBySubscription.get(subscription.id) || [];
    for (const delivery of deliveries) {
      const deliveryDate = dateOnly(delivery.delivery_date);
      if (!deliveryDate || deliveryDate < firstDay || deliveryDate > lastDay) continue;

      const status = String(delivery.status || "").trim().toLowerCase();

      if (status === "delivered") {
        customer.deliveredDateSet.add(deliveryDate);
      } else if (status === "missed") {
        customer.missedDateSet.add(deliveryDate);
      }

      if (status !== "delivered") continue;

      const deliveryItems = itemsByDelivery.get(delivery.id) || [];
      if (deliveryItems.length) {
        for (const deliveryItem of deliveryItems) {
          const quantity = asNumber(deliveryItem.quantity);
          const amount = asNumber(deliveryItem.total_price);
          if (deliveryItem.is_extra === true) {
            customer.extraQuantity += quantity;
            customer.extraAmount += amount;
          } else {
            customer.normalQuantity += quantity;
            customer.normalAmount += amount;
          }
        }
      } else {
        // Legacy delivery without item rows: use the subscription's normal item.
        customer.normalQuantity += fallbackQuantity;
        customer.normalAmount += fallbackDailyRate;
      }
    }

    for (const bill of billsBySubscription.get(subscription.id) || []) {
      customer.hasMonthlyBill = true;
      customer.monthlyBillTotal += asNumber(bill.total_amount);
      customer.billDiscount += asNumber(bill.discount);
      customer.gstAmount += asNumber(bill.gst_amount);
      if (bill.payment_status) customer.paymentStatuses.push(bill.payment_status);
      if (bill.id) customer.monthlyBillIds.push(bill.id);
      if (bill.paid_at) customer.paidAtValues.push(bill.paid_at);
    }
  }

  // Include customers with no subscription for the selected month.
  for (const customer of customers || []) {
    ensureCustomer(customer.id, {
      full_name: customer.full_name,
      phone: customer.phone,
    });
  }

  const report = [];
  for (const customer of customerReports.values()) {
    const deliveredDays = customer.deliveredDateSet.size;
    const missedDays = customer.missedDateSet.size;
    const deliveryAmount = customer.normalAmount;
    const totalAmount = deliveryAmount + customer.extraAmount;
    const totalQuantity = customer.normalQuantity + customer.extraQuantity;
    const customerPauseHistory = pauseHistoryByCustomer.get(customer.customerId) || [];
    const pausedDays = customerPauseHistory.reduce(
      (sum, pause) => sum + asNumber(pause.pausedDays),
      0
    );

    report.push({
      customerId: customer.customerId,
      customerName: customer.customerName,
      phone: customer.phone,
      area: customer.area,
      address: customer.address,
      product: customer.product || "No Subscription",
      quantity: totalQuantity,
      size: customer.size,
      deliveredDays,
      missedDays,
      pausedDays,
      pauseHistory: customerPauseHistory,
      dailyRate: customer.dailyRate,
      normalQuantity: customer.normalQuantity,
      normalAmount: deliveryAmount,
      deliveryAmount,
      extraQuantity: customer.extraQuantity,
      extraAmount: customer.extraAmount,
      billAmount: totalAmount,
      monthlyAmount: customer.hasMonthlyBill
        ? customer.monthlyBillTotal
        : totalAmount,
      subtotal: totalAmount,
      discount: customer.billDiscount,
      gstAmount: customer.gstAmount,
      paymentStatus: customer.paymentStatuses.length
        ? customer.paymentStatuses.join(", ")
        : customer.subscriptionIds.length
          ? "Not Generated"
          : "No Invoice",
      monthlyBillId: customer.monthlyBillIds.join(", ") || null,
      paidAt: customer.paidAtValues[0] || null,
      subscriptionStatus: customer.subscriptionStatuses.join(", ") ||
        (customer.subscriptionIds.length ? "Unknown" : "No Active Subscription"),
      subscriptionIds: customer.subscriptionIds,
      // Explicit snake_case aliases for consumers expecting database-style keys.
      customer_id: customer.customerId,
      customer_name: customer.customerName,
      delivered_days: deliveredDays,
      missed_days: missedDays,
      paused_days: pausedDays,
      normal_quantity: customer.normalQuantity,
      extra_quantity: customer.extraQuantity,
      delivery_amount: deliveryAmount,
      extra_amount: customer.extraAmount,
    });
  }

  report.sort((a, b) =>
    String(a.customerName || "").localeCompare(String(b.customerName || ""))
  );

  return report;
}
