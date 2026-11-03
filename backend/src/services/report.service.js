
import { supabaseAdmin } from "../config/supabase.js";

// =====================================================
// MONTHLY DELIVERY REPORT - OPTIMIZED
// Includes ALL registered customers
// =====================================================

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

  const firstDay =
    `${numericYear}-${String(numericMonth).padStart(2, "0")}-01`;

  const lastDate = new Date(
  numericYear,
  numericMonth,
  0
);

const lastDay =
  `${numericYear}-${String(numericMonth).padStart(2, "0")}-${String(lastDate.getDate()).padStart(2, "0")}`;

  // =====================================================
  // 1. GET ALL REGISTERED CUSTOMERS
  // Includes active and inactive customers
  // =====================================================

  const {
    data: customers,
    error: customerError,
  } = await supabaseAdmin
    .from("customers")
    .select(`
      id,
      full_name,
      phone,
      role,
      is_active
    `)
    .eq("role", "customer");

  if (customerError) {
    throw customerError;
  }

  const allCustomers = customers || [];

  // =====================================================
  // 2. GET SUBSCRIPTIONS OVERLAPPING SELECTED MONTH
  // =====================================================

  const {
    data: subscriptions,
    error: subscriptionError,
  } = await supabaseAdmin
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
   
    

  if (subscriptionError) {
    throw subscriptionError;
  }

  const activeSubscriptions = subscriptions || [];

  const subscriptionIds = activeSubscriptions.map(
    (subscription) => subscription.id
  );

  // =====================================================
  // 3. GET ALL DELIVERIES IN ONE QUERY
  // =====================================================

  let allDeliveries = [];

  if (subscriptionIds.length > 0) {
    const {
      data: deliveries,
      error: deliveryError,
    } = await supabaseAdmin
      .from("subscription_deliveries")
      .select(`
        id,
        delivery_date,
        status,
        subscription_id
      `)
      .in("subscription_id", subscriptionIds)
      .gte("delivery_date", firstDay)
      .lte("delivery_date", lastDay)
      .order("delivery_date", {
        ascending: true,
      });

    if (deliveryError) {
      throw deliveryError;
    }

    allDeliveries = deliveries || [];
  }

  // =====================================================
  // 4. GET ALL DELIVERY ITEMS IN ONE QUERY
  // =====================================================

  const deliveryIds = allDeliveries.map(
    (delivery) => delivery.id
  );

  let allDeliveryItems = [];

  if (deliveryIds.length > 0) {
    const {
      data: deliveryItems,
      error: deliveryItemError,
    } = await supabaseAdmin
      .from("subscription_delivery_items")
      .select(`
        delivery_id,
        quantity,
        total_price,
        is_extra
      `)
      .in("delivery_id", deliveryIds);

    if (deliveryItemError) {
      throw deliveryItemError;
    }

    allDeliveryItems = deliveryItems || [];
  }

  // =====================================================
  // 5. GET MONTHLY BILLS
  // =====================================================

  let monthlyBills = [];

  if (subscriptionIds.length > 0) {
    const {
      data: bills,
      error: monthlyBillError,
    } = await supabaseAdmin
      .from("monthly_bills")
      .select(`
        id,
        subscription_id,
        month,
        year,
        delivered_days,
        missed_days,
        subtotal,
        discount,
        gst_amount,
        total_amount,
        payment_status,
        paid_at
      `)
      .in("subscription_id", subscriptionIds)
      .eq("month", numericMonth)
      .eq("year", numericYear);

    if (monthlyBillError) {
      throw monthlyBillError;
    }

    monthlyBills = bills || [];
  }

  const monthlyBillsBySubscription = new Map(
    monthlyBills.map((bill) => [
      bill.subscription_id,
      bill,
    ])
  );

  // =====================================================
  // 6. GROUP DATA IN MEMORY
  // =====================================================

  const deliveriesBySubscription = new Map();

  for (const delivery of allDeliveries) {
    if (!deliveriesBySubscription.has(delivery.subscription_id)) {
      deliveriesBySubscription.set(
        delivery.subscription_id,
        []
      );
    }

    deliveriesBySubscription
      .get(delivery.subscription_id)
      .push(delivery);
  }

  const itemsByDelivery = new Map();

  for (const deliveryItem of allDeliveryItems) {
    if (!itemsByDelivery.has(deliveryItem.delivery_id)) {
      itemsByDelivery.set(
        deliveryItem.delivery_id,
        []
      );
    }

    itemsByDelivery
      .get(deliveryItem.delivery_id)
      .push(deliveryItem);
  }

  // =====================================================
  // 7. BUILD SUBSCRIPTION REPORT
  // =====================================================

  const report = [];

  const customersWithSubscriptions = new Set();

  for (const subscription of activeSubscriptions) {
    if (subscription.customer_id) {
      customersWithSubscriptions.add(subscription.customer_id);
    }

    const monthlyBill =
      monthlyBillsBySubscription.get(subscription.id);

    const subscriptionStartDate =
      subscription.start_date
        ? String(subscription.start_date).slice(0, 10)
        : null;

    const subscriptionEndDate =
      subscription.end_date
        ? String(subscription.end_date).slice(0, 10)
        : null;

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

    let deliveredDays = 0;
    let missedDays = 0;
    let normalQuantity = 0;
    let normalAmount = 0;
    let extraQuantity = 0;
    let extraAmount = 0;

    const item = subscription.subscription_items?.[0];

    const subscriptionItemQuantity = Number(item?.quantity || 1);
    const dailyRate = Number(item?.unit_price || 0);

    const subscriptionDeliveries =
      deliveriesBySubscription.get(subscription.id) || [];

    for (const delivery of subscriptionDeliveries) {
      const deliveryDate = String(delivery.delivery_date || "").slice(0, 10);

      if (
        deliveryDate < effectiveStartDate ||
        deliveryDate > effectiveEndDate
      ) {
        continue;
      }

      const status = String(delivery.status || "")
        .trim()
        .toLowerCase();

      if (status === "delivered") {
        deliveredDays++;
      } else if (status === "missed") {
        missedDays++;
      }

      if (status !== "delivered") {
        continue;
      }

      const deliveryItems = itemsByDelivery.get(delivery.id) || [];

      if (deliveryItems.length > 0) {
        for (const deliveryItem of deliveryItems) {
          const itemQuantity = Number(deliveryItem.quantity || 0);
          const itemTotal = Number(deliveryItem.total_price || 0);

          if (deliveryItem.is_extra === true) {
            extraQuantity += itemQuantity;
            extraAmount += itemTotal;
          } else {
            normalQuantity += itemQuantity;
            normalAmount += itemTotal;
          }
        }
      } else {
        // Fallback for older delivery records without delivery-item rows.
        normalQuantity += subscriptionItemQuantity;
        normalAmount += dailyRate;
      }
    }

    // Fallback for older records where quantities/prices were not stored
    // in subscription_delivery_items.
    if (deliveredDays > 0 && normalAmount === 0 && dailyRate > 0) {
      normalQuantity = deliveredDays * subscriptionItemQuantity;
      normalAmount = deliveredDays * dailyRate;
    }

    const finalQuantity = normalQuantity + extraQuantity;
    const billAmount = normalAmount + extraAmount;

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

      address:
        `${subscription.addresses?.house_no || ""}
${subscription.addresses?.street || ""}
${subscription.addresses?.city || ""}`,

      product:
        item?.products?.name || "Product Not Available",

      quantity:
        finalQuantity,

      size:
        item?.size || null,

      deliveredDays,

      missedDays,

      dailyRate,

      extraQuantity,

      extraAmount,

      billAmount,

      monthlyAmount: Number(
        monthlyBill?.total_amount ?? billAmount
      ),

      subtotal: billAmount,

      discount: Number(
        monthlyBill?.discount ?? 0
      ),

      gstAmount: Number(
        monthlyBill?.gst_amount ?? 0
      ),

      paymentStatus:
        monthlyBill?.payment_status || "Not Generated",

      monthlyBillId:
        monthlyBill?.id || null,

      paidAt:
        monthlyBill?.paid_at || null,

      subscriptionStatus:
        subscription.status || "Unknown",
        normalQuantity,
        normalAmount,

totalExtraQuantity: extraQuantity,

totalExtraAmount: extraAmount,

totalBill: Number(
  monthlyBill?.total_amount ?? billAmount
),
    });
  }

  // =====================================================
  // 8. ADD CUSTOMERS WITHOUT SUBSCRIPTIONS
  // =====================================================

  for (const customer of allCustomers) {
    if (customersWithSubscriptions.has(customer.id)) {
      continue;
    }

    report.push({
      customerId: customer.id,

      subscriptionId: null,

      customerName: customer.full_name,

      phone: customer.phone,

      area: "",

      address: "",

      product: "No Subscription",

      quantity: 0,

      size: null,

      deliveredDays: 0,

      missedDays: 0,

      dailyRate: 0,

      extraQuantity: 0,

      extraAmount: 0,

      billAmount: 0,

      monthlyAmount: 0,

      subtotal: 0,

      discount: 0,

      gstAmount: 0,

      paymentStatus: "No Invoice",

      monthlyBillId: null,

      paidAt: null,

      subscriptionStatus: "No Active Subscription",
    });
  }

  // =====================================================
  // 9. SORT BY CUSTOMER NAME
  // =====================================================

  report.sort((a, b) =>
    String(a.customerName || "").localeCompare(
      String(b.customerName || "")
    )
  );

  return report;
}
