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
    let deliveredQuantity = 0;


    // ===================================================
    // PRODUCT / SUBSCRIPTION RATE
    // ===================================================

    const item =
      subscription.subscription_items?.[0];


    const quantity =
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

    let billAmount = 0;

    let extraAmount = 0;

    let extraQuantity = 0;


    // ===================================================
    // GET ACTUAL DELIVERIES
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
          subscription_id,
          subscription_delivery_items(
            id,
            product_id,
            size,
            quantity,
            unit_price,
            total_price,
            is_extra,
            extra_request_id,
            extra_milk_request_id
          )
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
      // COUNT DELIVERED / MISSED DAYS
      // =================================================

      for (const delivery of deliveries || []) {

        if (
          delivery.status ===
          "Delivered"
        ) {
          deliveredDays++;
        }

        if (
          delivery.status ===
          "Missed"
        ) {
          missedDays++;
        }


        // Only delivered deliveries
        // should contribute to billing.
        if (
          delivery.status !==
          "Delivered"
        ) {
          continue;
        }


        const deliveryItems =
          delivery.subscription_delivery_items ||
          [];


        // ===============================================
        // If delivery has items
        // ===============================================

        if (
          deliveryItems.length > 0
        ) {

          for (
            const deliveryItem
            of deliveryItems
          ) {

            const itemQuantity =
             Number(deliveryItem.quantity || 0);
            const itemTotal =
              Number(
                deliveryItem.total_price ||
                0
              );


            // =========================================
            // EXTRA MILK
            // =========================================

            if (
              deliveryItem.is_extra ===
              true
            ) {

              extraAmount +=
                itemTotal;

              extraQuantity +=
                Number(
                  deliveryItem.quantity ||
                  0
                );

            }


            // =========================================
            // REGULAR + EXTRA
            // =========================================

            billAmount +=
              itemTotal;
          }

        } else {

          // ===========================================
          // FALLBACK
          // ===========================================
          // Older delivery records may not have
          // subscription_delivery_items.
          //
          // In that case use the normal subscription
          // daily rate.
          // ===========================================

          billAmount +=
            dailyRate;
        }
      }

    }


    // ===================================================
    // IMPORTANT FALLBACK
    // ===================================================
    //
    // If there are delivered days but no delivery item
    // amount was found, calculate using daily rate.
    //
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

      // Normal subscription quantity
      quantity:
    deliveredQuantity > 0
      ? deliveredQuantity
      : quantity,

      size:
        item?.size,

      deliveredDays,

      missedDays,

      dailyRate,

      // ================================================
      // NEW: EXTRA MILK INFORMATION
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