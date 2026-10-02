import { supabaseAdmin } from "../config/supabase.js";

// =====================================================
// MONTHLY DELIVERY REPORT - OPTIMIZED
// =====================================================
// Important performance change:
// The old implementation performed:
//   1 subscription query
//   + 1 delivery query per subscription
//   + 1 delivery-item query per delivered delivery.
//
// This version performs only three database reads:
//   1) subscriptions
//   2) all deliveries for those subscriptions
//   3) all delivery items for those deliveries
//
// The report calculations remain the same.
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

  const lastDay = new Date(
    numericYear,
    numericMonth,
    0
  )
    .toISOString()
    .split("T")[0];

  // =====================================================
  // 1. GET SUBSCRIPTIONS
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
    .lte("start_date", lastDay)
    .or(`end_date.is.null,end_date.gte.${firstDay}`);

  if (subscriptionError) {
    throw subscriptionError;
  }

  const activeSubscriptions = subscriptions || [];

  if (activeSubscriptions.length === 0) {
    return [];
  }

  const subscriptionIds = activeSubscriptions.map(
    (subscription) => subscription.id
  );

  // =====================================================
  // 2. GET ALL DELIVERIES IN ONE QUERY
  // =====================================================

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

  const allDeliveries = deliveries || [];

  // =====================================================
  // 3. GET ALL DELIVERY ITEMS IN ONE QUERY
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
        id,
        delivery_id,
        product_id,
        size,
        quantity,
        unit_price,
        total_price,
        is_extra,
        extra_request_id,
        extra_milk_request_id
      `)
      .in("delivery_id", deliveryIds);

    if (deliveryItemError) {
      throw deliveryItemError;
    }

    allDeliveryItems = deliveryItems || [];
  }

  // =====================================================
  // GROUP DATA IN MEMORY
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
  // BUILD REPORT
  // =====================================================

  const report = [];

  for (const subscription of activeSubscriptions) {
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
    let deliveredQuantity = 0;
    let billAmount = 0;
    let extraAmount = 0;
    let extraQuantity = 0;

    const item =
      subscription.subscription_items?.[0];

    const normalQuantity = Number(
      item?.quantity || 1
    );

    const dailyRate = Number(
      item?.unit_price || 0
    );

    const subscriptionDeliveries =
      deliveriesBySubscription.get(subscription.id) || [];

    for (const delivery of subscriptionDeliveries) {
      const deliveryDate = String(
        delivery.delivery_date || ""
      ).slice(0, 10);

      // Keep the same effective date-range behavior.
      if (
        deliveryDate < effectiveStartDate ||
        deliveryDate > effectiveEndDate
      ) {
        continue;
      }

      if (delivery.status === "Delivered") {
        deliveredDays++;
      }

      if (delivery.status === "Missed") {
        missedDays++;
      }

      if (delivery.status !== "Delivered") {
        continue;
      }

      const deliveryItems =
        itemsByDelivery.get(delivery.id) || [];

      if (deliveryItems.length > 0) {
        for (const deliveryItem of deliveryItems) {
          const itemQuantity = Number(
            deliveryItem.quantity || 0
          );

          const itemTotal = Number(
            deliveryItem.total_price || 0
          );

          deliveredQuantity += itemQuantity;
          billAmount += itemTotal;

          if (deliveryItem.is_extra === true) {
            extraQuantity += itemQuantity;
            extraAmount += itemTotal;
          }
        }
      } else {
        // Preserve the old-record fallback.
        deliveredQuantity += normalQuantity;
        billAmount += dailyRate;
      }
    }

    if (
      deliveredDays > 0 &&
      billAmount === 0 &&
      dailyRate > 0
    ) {
      billAmount =
        deliveredDays * dailyRate;
    }

    const finalQuantity =
      deliveredQuantity > 0
        ? deliveredQuantity
        : normalQuantity;

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
        item?.products?.name,

      quantity:
        finalQuantity,

      size:
        item?.size,

      deliveredDays,

      missedDays,

      dailyRate,

      extraQuantity,

      extraAmount,

      billAmount,

      monthlyAmount:
        subscription.total_amount,

      paymentStatus:
        subscription.payment_status,

      status:
        subscription.status,
    });
  }

  return report;
}
