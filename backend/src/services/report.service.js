import { supabaseAdmin } from "../config/supabase.js";

// =====================================================
// MONTHLY DELIVERY REPORT
// =====================================================

export async function getMonthlyDeliveryReportService(
  month,
  year
) {
  const numericMonth = Number(month);
  const numericYear = Number(year);

  const firstDay =
    `${numericYear}-${String(numericMonth).padStart(2, "0")}-01`;

  const lastDay =
    new Date(
      numericYear,
      numericMonth,
      0
    )
      .toISOString()
      .split("T")[0];

  // =====================================================
  // GET SUBSCRIPTIONS
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
    .lte(
      "start_date",
      lastDay
    )
    .or(
      `end_date.is.null,end_date.gte.${firstDay}`
    );

  if (subscriptionError) {
    throw subscriptionError;
  }

  const report = [];

  // =====================================================
  // PROCESS EACH SUBSCRIPTION
  // =====================================================

  for (const subscription of subscriptions || []) {

    // ===================================================
    // SUBSCRIPTION PERIOD
    // ===================================================

    const subscriptionStartDate =
      subscription.start_date
        ? String(
            subscription.start_date
          ).slice(0, 10)
        : null;

    const subscriptionEndDate =
      subscription.end_date
        ? String(
            subscription.end_date
          ).slice(0, 10)
        : null;

    // ===================================================
    // EFFECTIVE DELIVERY DATE RANGE
    // ===================================================

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

    // ===================================================
    // PRODUCT / SUBSCRIPTION RATE
    // ===================================================

    const item =
      subscription.subscription_items?.[0];

    const normalQuantity =
      Number(
        item?.quantity || 1
      );

    const dailyRate =
      Number(
        item?.unit_price || 0
      );

    // ===================================================
    // DELIVERY TOTALS
    // ===================================================

    let deliveredQuantity = 0;

    let billAmount = 0;

    let extraAmount = 0;

    let extraQuantity = 0;

    // ===================================================
    // GET DELIVERIES
    // ===================================================

    if (
      effectiveStartDate <=
      effectiveEndDate
    ) {

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
        .eq(
          "subscription_id",
          subscription.id
        )
        .gte(
          "delivery_date",
          effectiveStartDate
        )
        .lte(
          "delivery_date",
          effectiveEndDate
        )
        .order(
          "delivery_date",
          {
            ascending: true,
          }
        );

      if (deliveryError) {
        throw deliveryError;
      }

      // =================================================
      // PROCESS EACH DELIVERY
      // =================================================

      for (const delivery of deliveries || []) {

        // ===============================================
        // DELIVERED DAYS
        // ===============================================

        if (
          delivery.status ===
          "Delivered"
        ) {
          deliveredDays++;
        }

        // ===============================================
        // MISSED DAYS
        // ===============================================

        if (
          delivery.status ===
          "Missed"
        ) {
          missedDays++;
        }

        // ===============================================
        // ONLY DELIVERED ITEMS ARE BILLED
        // ===============================================

        if (
          delivery.status !==
          "Delivered"
        ) {
          continue;
        }

        // ===============================================
        // GET DELIVERY ITEMS DIRECTLY
        // ===============================================

        const {
          data: deliveryItems,
          error: itemError,
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
          .eq(
            "delivery_id",
            delivery.id
          );

        if (itemError) {
          throw itemError;
        }

        // ===============================================
        // DELIVERY HAS ITEMS
        // ===============================================

        if (
          deliveryItems &&
          deliveryItems.length > 0
        ) {

          for (
            const deliveryItem
            of deliveryItems
          ) {

            const itemQuantity =
              Number(
                deliveryItem.quantity || 0
              );

            const itemTotal =
              Number(
                deliveryItem.total_price || 0
              );

            // =========================================
            // TOTAL DELIVERED QUANTITY
            // REGULAR + EXTRA
            // =========================================

            deliveredQuantity +=
              itemQuantity;

            // =========================================
            // BILL AMOUNT
            // REGULAR + EXTRA
            // =========================================

            billAmount +=
              itemTotal;

            // =========================================
            // EXTRA MILK
            // =========================================

            if (
              deliveryItem.is_extra === true
            ) {

              extraQuantity +=
                itemQuantity;

              extraAmount +=
                itemTotal;
            }
          }

        } else {

          // =========================================
          // FALLBACK FOR OLD DELIVERY RECORDS
          // =========================================

          deliveredQuantity +=
            normalQuantity;

          billAmount +=
            dailyRate;
        }
      }
    }

    // ===================================================
    // FINAL FALLBACK
    // ===================================================

    if (
      deliveredDays > 0 &&
      billAmount === 0 &&
      dailyRate > 0
    ) {

      billAmount =
        deliveredDays *
        dailyRate;
    }

    // ===================================================
    // QUANTITY FALLBACK
    // ===================================================

    const finalQuantity =
      deliveredQuantity > 0
        ? deliveredQuantity
        : normalQuantity;

    // ===================================================
    // DEBUG LOG
    // ===================================================

    console.log(
      "MONTHLY DELIVERY REPORT:",
      {
        customer:
          subscription.customers?.full_name,

        subscriptionId:
          subscription.id,

        deliveredDays,

        normalQuantity,

        deliveredQuantity,

        extraQuantity,

        dailyRate,

        extraAmount,

        billAmount,
      }
    );

    // ===================================================
    // REPORT OBJECT
    // ===================================================

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

      // ================================================
      // TOTAL DELIVERED QUANTITY
      // REGULAR + EXTRA
      // ================================================

      quantity:
        finalQuantity,

      size:
        item?.size,

      deliveredDays,

      missedDays,

      dailyRate,

      // ================================================
      // EXTRA MILK
      // ================================================

      extraQuantity,

      extraAmount,

      // ================================================
      // FINAL BILL
      // ================================================

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