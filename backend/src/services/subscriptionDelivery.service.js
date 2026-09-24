import { supabaseAdmin } from "../config/supabase.js";
import { debitWalletForDelivery } from "./wallet.service.js";

export async function getTodayDeliveriesService() {
  const today = new Date().toISOString().split("T")[0];

  return await supabaseAdmin
    .from("subscription_deliveries")
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
        city,
        state,
        pincode
      ),
      delivery_boys(
        id,
        full_name,
        phone
      ),
      subscription_delivery_items(
        *,
        products(
          id,
          name,
          image
        )
      )
    `)
    .eq("delivery_date", today)
    .order("created_at", { ascending: false });
}
export async function getDeliveryByIdService(id) {
  return await supabaseAdmin
    .from("subscription_deliveries")
    .select(`
      *,
      customers(*),
      addresses(*),
      delivery_boys(*),
      subscription_delivery_items(
        *,
        products(*)
      )
    `)
    .eq("id", id)
    .single();
}
export async function assignDeliveryBoyService(
  deliveryId,
  deliveryBoyId
) {
  return await supabaseAdmin
    .from("subscription_deliveries")
    .update({
      delivery_boy_id: deliveryBoyId,
  status: "Assigned",
  assigned_at: new Date().toISOString(),
    })
    .eq("id", deliveryId)
    .select()
    .single();
}
export async function updateDeliveryStatusService(
  deliveryId,
  status,
  type
) {
  const now = new Date().toISOString();

  // ==========================================================
  // ORDER DELIVERY
  // ==========================================================

  if (type === "Order") {
    const update = {
      status,
      updated_at: now,
    };

    if (status === "Out for Delivery") {
      update.out_for_delivery_at = now;
    }

    if (status === "Delivered") {
      update.delivery_completed_at = now;
    }

    const { data, error } = await supabaseAdmin
      .from("orders")
      .update(update)
      .eq("id", deliveryId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return {
      data,
      wallet: null,
    };
  }

  // ==========================================================
  // SUBSCRIPTION DELIVERY
  // ==========================================================

  if (type === "Subscription") {
    // --------------------------------------------------------
    // 1. GET DELIVERY + SUBSCRIPTION + ITEMS
    // --------------------------------------------------------

   const { data: delivery, error: deliveryError } =
  await supabaseAdmin
    .from("subscription_deliveries")
    .select(`
      id,
      delivery_number,
      customer_id,
      subscription_id,
      status,
      wallet_debited_amount,
      wallet_balance_after,
      subscriptions(
        id,
        customer_id,
        payment_method,
        payment_status
      ),
      subscription_delivery_items(
        id,
        quantity,
        unit_price,
        total_price
      )
    `)
        .eq("id", deliveryId)
        .single();

    if (deliveryError) {
      throw deliveryError;
    }

    if (!delivery) {
      throw new Error("Subscription delivery not found");
    }

    // --------------------------------------------------------
    // 2. PREVENT DUPLICATE DELIVERY
    // --------------------------------------------------------

    if (
      status === "Delivered" &&
      String(delivery.status || "").toLowerCase() === "delivered"
    ) {
      return {
        data: delivery,
        wallet: {
          debited: Number(delivery.wallet_debited_amount || 0),
          balanceAfter:
            delivery.wallet_balance_after !== null &&
            delivery.wallet_balance_after !== undefined
              ? Number(delivery.wallet_balance_after)
              : null,
          alreadyProcessed: true,
        },
      };
    }

    // --------------------------------------------------------
    // 3. CALCULATE DELIVERY TOTAL
    // --------------------------------------------------------

    const deliveryItems =
      delivery.subscription_delivery_items || [];

    const deliveryTotal = deliveryItems.reduce(
      (total, item) => {
        const itemTotal = Number(
          item.total_price ??
            Number(item.quantity || 0) *
              Number(item.unit_price || 0)
        );

        return total + (Number.isFinite(itemTotal) ? itemTotal : 0);
      },
      0
    );

    if (deliveryTotal < 0) {
      throw new Error("Invalid delivery amount");
    }

    // --------------------------------------------------------
    // 4. DETERMINE PAYMENT TYPE
    // --------------------------------------------------------

    const subscription = delivery.subscriptions;

    if (!subscription) {
      throw new Error("Subscription not found for delivery");
    }

    const paymentMethod = String(
      subscription.payment_method || ""
    )
      .trim()
      .toLowerCase();

    const paymentStatus = String(
      subscription.payment_status || ""
    )
      .trim()
      .toLowerCase();

    /*
     * IMPORTANT:
     *
     * Only ONLINE / PREPAID subscriptions use wallet.
     *
     * We do NOT use:
     *
     * paymentStatus === "paid"
     *
     * to identify prepaid because a COD/Postpaid subscription
     * could also become Paid later.
     */

    const isPrepaid =
      paymentMethod === "online" ||
      paymentMethod === "prepaid";

    const isPostpaid =
      paymentMethod === "cod" ||
      paymentMethod === "postpaid";

    // --------------------------------------------------------
    // 5. PREPAID WALLET PROCESSING
    // --------------------------------------------------------

    let walletResult = null;

    if (status === "Delivered" && isPrepaid) {
      if (deliveryTotal <= 0) {
        throw new Error(
          "Cannot debit wallet because delivery amount is zero"
        );
      }

      walletResult = await debitWalletForDelivery({
        customerId: delivery.customer_id,
        amount: deliveryTotal,
        deliveryId: delivery.id,
        deliveryNumber: delivery.delivery_number,
      });

      if (!walletResult.success) {
        throw new Error(
          walletResult.message ||
            "Insufficient wallet balance"
        );
      }
    }

    // --------------------------------------------------------
    // 6. BUILD DELIVERY UPDATE
    // --------------------------------------------------------

    const update = {
      status,
      updated_at: now,
    };

    if (status === "Out for Delivery") {
      update.out_for_delivery_at = now;
    }

    if (status === "Delivered") {
      update.delivery_completed_at = now;
    }

    // --------------------------------------------------------
    // 7. SAVE WALLET INFORMATION
    // --------------------------------------------------------

    if (status === "Delivered" && isPrepaid) {
      update.wallet_debited_amount = deliveryTotal;
      update.wallet_balance_after =
        walletResult.newBalance;

      update.payment_status = "Paid";
    }

    // --------------------------------------------------------
    // 8. POSTPAID / COD
    // --------------------------------------------------------

    if (status === "Delivered" && isPostpaid) {
      /*
       * No wallet deduction.
       *
       * The delivery amount remains part of the customer's
       * outstanding/monthly bill.
       */
    }

    // --------------------------------------------------------
    // 9. UPDATE DELIVERY
    // --------------------------------------------------------

    const { data: updatedDelivery, error: updateError } =
      await supabaseAdmin
        .from("subscription_deliveries")
        .update(update)
        .eq("id", deliveryId)
        .select()
        .single();

    if (updateError) {
      throw updateError;
    }

    // --------------------------------------------------------
    // 10. RETURN RESULT
    // --------------------------------------------------------

    return {
      data: updatedDelivery,

      wallet: walletResult
        ? {
            debited: walletResult.debitedAmount,
            previousBalance:
              walletResult.previousBalance,
            balanceAfter:
              walletResult.newBalance,
            message: walletResult.message,
            alreadyProcessed: false,
          }
        : null,

      billing: {
        deliveryAmount: deliveryTotal,
        paymentType: isPrepaid
          ? "Prepaid"
          : isPostpaid
          ? "Postpaid"
          : paymentMethod || "Unknown",
      },
    };
  }

  // ==========================================================
  // INVALID DELIVERY TYPE
  // ==========================================================

  throw new Error(
    `Invalid delivery type: ${type}`
  );
}
export async function deleteDeliveryService(id) {
  return await supabaseAdmin
    .from("subscription_deliveries")
    .delete()
    .eq("id", id);
}
// ==========================================
// SIZE-SPECIFIC PRODUCT PRICING
// ==========================================

function normalizeSizeVolume(value) {
  if (value === null || value === undefined) {
    return null;
  }

  const text = String(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");

  if (!text) return null;

  // Convert litres to ml
  const litreMatch = text.match(/^(\d+(?:\.\d+)?)l$/);
  if (litreMatch) {
    return Number(litreMatch[1]) * 1000;
  }

  // Keep ml as ml
  const mlMatch = text.match(/^(\d+(?:\.\d+)?)ml$/);
  if (mlMatch) {
    return Number(mlMatch[1]);
  }

  return null;
}

async function getProductSizePrice(productId, size) {
  if (!productId || !size) {
    throw new Error(
      `Product ID and size are required for pricing. productId=${productId}, size=${size}`
    );
  }

  const { data: sizes, error } = await supabaseAdmin
    .from("product_sizes")
    .select(`
      id,
      product_id,
      label,
      price,
      is_active
    `)
    .eq("product_id", productId)
    .eq("is_active", true);

  if (error) {
    throw error;
  }

 const requestedVolume = normalizeSizeVolume(size);

const matchingSize = (sizes || []).find(
  (item) => {
    const itemVolume = normalizeSizeVolume(item.label);

    return (
      requestedVolume !== null &&
      itemVolume !== null &&
      itemVolume === requestedVolume
    );
  }
);

  if (!matchingSize) {
    throw new Error(
      `No active price found for product ${productId}, size "${size}".`
    );
  }

  const price = Number(matchingSize.price);

  if (!Number.isFinite(price) || price < 0) {
    throw new Error(
      `Invalid price for product ${productId}, size "${size}".`
    );
  }

  return price;
}
export async function generateTodayDeliveriesService() {
  const today = new Date().toISOString().split("T")[0];

  // ==========================================================
  // GET ACTIVE SUBSCRIPTIONS
  // ==========================================================

  const {
    data: subscriptions,
    error,
  } = await supabaseAdmin
    .from("subscriptions")
    .select(`
      *,
      subscription_items(
        *,
        products(*)
      )
    `)
    .eq("status", "Active");

  if (error) throw error;

  const created = [];
  const updated = [];
  let skipped = 0;

  // ==========================================================
  // PROCESS EACH SUBSCRIPTION
  // ==========================================================

  for (const subscription of subscriptions || []) {

    console.log("=================================");
    console.log("CHECKING SUBSCRIPTION:", subscription.id);
    console.log("Customer:", subscription.customer_id);
    console.log("Start:", subscription.start_date);
    console.log("End:", subscription.end_date);
    console.log("Frequency:", subscription.frequency);
    console.log("Paused:", subscription.is_paused);
    console.log("Pause From:", subscription.pause_from);
    console.log("Pause To:", subscription.pause_to);
    console.log("Today:", today);

    // ========================================================
    // 1. NORMAL DELIVERY ELIGIBILITY
    // ========================================================

    const normalEligible = shouldGenerateDelivery(
      subscription,
      today
    );

    console.log(
      "NORMAL DELIVERY ELIGIBLE:",
      subscription.id,
      normalEligible
    );

    // ========================================================
    // 2. CHECK APPROVED EXTRA MILK FOR TODAY
    // ========================================================

    const {
      data: extraMilkRequests,
      error: extraError,
    } = await supabaseAdmin
      .from("extra_milk_requests")
      .select(`
        *,
        products(
          id,
          name,
          price,
          is_available
        )
      `)
      .eq("subscription_id", subscription.id)
      .eq("status", "Approved")
      .lte("from_date", today)
      .gte("to_date", today);

    if (extraError) {
      console.error(
        "Extra Milk Query Error:",
        extraError
      );

      throw extraError;
    }

    console.log(
      "APPROVED EXTRA MILK:",
      extraMilkRequests || []
    );

    // ========================================================
    // 3. IF NORMAL DELIVERY IS NOT ELIGIBLE
    //    BUT EXTRA MILK EXISTS
    //    WE STILL NEED A DELIVERY RECORD
    // ========================================================

    if (
      !normalEligible &&
      (!extraMilkRequests ||
        extraMilkRequests.length === 0)
    ) {
      console.log(
        "SKIPPED: No normal delivery and no extra milk."
      );

      skipped++;
      continue;
    }

    // ========================================================
    // 4. CHECK WHETHER TODAY'S DELIVERY ALREADY EXISTS
    // ========================================================

    const {
      data: existingDelivery,
      error: existingError,
    } = await supabaseAdmin
      .from("subscription_deliveries")
      .select(
        "id, delivery_number, status"
      )
      .eq(
        "subscription_id",
        subscription.id
      )
      .eq(
        "delivery_date",
        today
      )
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    let delivery;

    // ========================================================
    // 5. EXISTING DELIVERY
    // ========================================================

    if (existingDelivery) {

      console.log(
        "TODAY'S DELIVERY ALREADY EXISTS:",
        existingDelivery
      );

      delivery = existingDelivery;

      updated.push(delivery);

    } else {

      // ======================================================
      // 6. CREATE TODAY'S DELIVERY
      // ======================================================

      const deliveryNumber =
        await generateDeliveryNumber();

      const {
        data: newDelivery,
        error: deliveryError,
      } = await supabaseAdmin
        .from("subscription_deliveries")
        .insert({
          delivery_number:
            deliveryNumber,

          subscription_id:
            subscription.id,

          customer_id:
            subscription.customer_id,

          address_id:
            subscription.address_id,

          delivery_date:
            today,

          delivery_type:
            subscription.delivery_type,

          status:
            "Pending",
        })
        .select()
        .single();

      if (deliveryError) {

        console.error(
          "Delivery Insert Error:",
          deliveryError
        );

        throw deliveryError;
      }

      delivery = newDelivery;

      console.log(
        "NEW DELIVERY CREATED:",
        delivery.id
      );

      created.push(delivery);

      // ======================================================
      // 7. ADD NORMAL SUBSCRIPTION ITEMS
      //    ONLY WHEN NORMAL DELIVERY IS ELIGIBLE
      // ======================================================

      if (normalEligible) {

        const normalItems = [];

        for (
          const item
          of subscription.subscription_items || []
        ) {

          const quantity =
            Number(item.quantity || 0);

          if (quantity <= 0) {

            console.log(
              "Skipping subscription item - invalid quantity:",
              item
            );

            continue;
          }

          // ----------------------------------------------
          // Get actual size-specific price
          // ----------------------------------------------

          const unitPrice =
            await getProductSizePrice(
              item.product_id,
              item.size
            );

          console.log(
            "NORMAL SIZE PRICE:",
            item.size,
            "₹",
            unitPrice
          );

          normalItems.push({

            delivery_id:
              delivery.id,

            product_id:
              item.product_id,

            quantity,

            size:
              item.size,

            unit_price:
              unitPrice,

            total_price:
              quantity * unitPrice,

            is_extra:
              false,

          });
        }

        if (normalItems.length > 0) {

          const {
            error: itemError,
          } = await supabaseAdmin
            .from(
              "subscription_delivery_items"
            )
            .insert(normalItems);

          if (itemError) {
            throw itemError;
          }
        }

      } else {

        console.log(
          "SUBSCRIPTION PAUSED → NORMAL MILK NOT ADDED"
        );
      }
    }

    // ========================================================
    // 8. ADD APPROVED EXTRA MILK
    // ========================================================

    for (
      const request
      of extraMilkRequests || []
    ) {

      console.log("--------------------------------");
      console.log(
        "PROCESSING EXTRA MILK REQUEST"
      );

      console.log(
        "Request ID:",
        request.id
      );

      console.log(
        "Product:",
        request.products?.name
      );

      console.log(
        "Size:",
        request.size
      );

      console.log(
        "Quantity:",
        request.quantity
      );

      // ======================================================
      // 9. PREVENT DUPLICATE EXTRA MILK
      // ======================================================

      const {
        data: existingExtraItem,
        error: existingExtraError,
      } = await supabaseAdmin
        .from(
          "subscription_delivery_items"
        )
        .select("id")
        .eq(
          "delivery_id",
          delivery.id
        )
        .eq(
          "extra_milk_request_id",
          request.id
        )
        .maybeSingle();

      if (existingExtraError) {

        console.error(
          "Existing Extra Item Check Error:",
          existingExtraError
        );

        throw existingExtraError;
      }

      if (existingExtraItem) {

        console.log(
          "EXTRA MILK ALREADY ADDED:",
          request.id
        );

        continue;
      }

      // ======================================================
      // 10. VALIDATE QUANTITY
      // ======================================================

      const quantity =
        Number(request.quantity || 0);

      if (quantity <= 0) {

        console.log(
          "Skipping Extra Milk - invalid quantity"
        );

        continue;
      }

      // ======================================================
      // 11. GET ACTUAL SIZE PRICE
      //    FROM product_sizes
      // ======================================================

      const unitPrice =
        await getProductSizePrice(
          request.product_id,
          request.size
        );

      console.log(
        "EXTRA MILK SIZE PRICE:",
        request.size,
        "₹",
        unitPrice
      );

      // ======================================================
      // 12. CREATE EXTRA MILK ITEM
      // ======================================================

      const extraItem = {

        delivery_id:
          delivery.id,

        product_id:
          request.product_id,

        quantity,

        size:
          request.size,

        unit_price:
          unitPrice,

        total_price:
          quantity * unitPrice,

        is_extra:
          true,

        extra_milk_request_id:
          request.id,
      };

      console.log(
        "INSERTING EXTRA MILK ITEM:",
        extraItem
      );

      // ======================================================
      // 13. INSERT EXTRA MILK
      // ======================================================

      const {
        error: insertExtraError,
      } = await supabaseAdmin
        .from(
          "subscription_delivery_items"
        )
        .insert(extraItem);

      if (insertExtraError) {

        console.error(
          "Extra Milk Insert Error:",
          insertExtraError
        );

        throw insertExtraError;
      }

      console.log(
        "✅ EXTRA MILK ADDED:",
        request.id
      );
    }

    // ========================================================
    // 14. LOG RESULT
    // ========================================================

    console.log(
      "✅ DELIVERY PROCESSING COMPLETE:",
      delivery.id
    );
  }

  // ==========================================================
  // RETURN
  // ==========================================================

  return {
    created,
    updated,
    skipped,
  };
}

function shouldGenerateDelivery(subscription, today) {

  console.log("----- ELIGIBILITY CHECK -----");

  const todayDate = new Date(today);
  const startDate = new Date(subscription.start_date);

  console.log("todayDate:", todayDate);
  console.log("startDate:", startDate);

  // Before subscription starts
  if (todayDate < startDate) {
    console.log("❌ Before start date");
    return false;
  }

  // Subscription ended
  if (
    subscription.end_date &&
    todayDate > new Date(subscription.end_date)
  ) {
    console.log("❌ Subscription ended");
    return false;
  }

  // Paused
  if (
    subscription.is_paused &&
    subscription.pause_from &&
    subscription.pause_to
  ) {

    const pauseFrom =
      new Date(subscription.pause_from);

    const pauseTo =
      new Date(subscription.pause_to);

    console.log("Pause from:", pauseFrom);
    console.log("Pause to:", pauseTo);

    if (
      todayDate >= pauseFrom &&
      todayDate <= pauseTo
    ) {
      console.log("❌ Subscription paused");
      return false;
    }
  }

  const frequency =
    (subscription.frequency || "")
      .trim()
      .toLowerCase();

  console.log("Frequency:", frequency);

  switch (frequency) {

    case "daily":

      console.log("✅ DAILY → ELIGIBLE");

      return true;

    case "alternate":
    case "alternate day":
    case "alternate days": {

      const diffDays = Math.floor(
        (
          todayDate.getTime() -
          startDate.getTime()
        ) /
        (1000 * 60 * 60 * 24)
      );

      console.log(
        "Alternate diffDays:",
        diffDays
      );

      return diffDays % 2 === 0;
    }

    case "weekly":

      return (
        todayDate.getDay() ===
        startDate.getDay()
      );

    default:

      console.log(
        "⚠️ Unknown frequency, allowing delivery"
      );

      return true;
  }
}
async function generateDeliveryNumber() {

  const { count } = await supabaseAdmin
    .from("subscription_deliveries")
    .select("*", {
      count: "exact",
      head: true,
    });

  return `SDL${String((count || 0) + 1).padStart(6, "0")}`;
}
export async function assignSubscriptionDeliveryService(
  id,
  deliveryBoyId
) {

  const { data, error } =
    await supabaseAdmin
      .from("subscription_deliveries")
      .update({
        delivery_boy_id: deliveryBoyId,
        status: "Assigned",
      })
      .eq("id", id)
      .select()
      .single();

  if (error) throw error;

  return data;
}
export async function getCustomerDeliverySummaryService(customerId) {
  const { data, error } = await supabaseAdmin
    .from("subscription_deliveries")
    .select("status")
    .eq("customer_id", customerId);

  if (error) throw error;

  const summary = {
    total: data.length,
    delivered: 0,
    outForDelivery: 0,
    assigned: 0,
    pending: 0,
    skipped: 0,
    cancelled: 0,
  };

  data.forEach((item) => {
    switch ((item.status || "").toLowerCase()) {
      case "delivered":
        summary.delivered++;
        break;

      case "out for delivery":
        summary.outForDelivery++;
        break;

      case "assigned":
        summary.assigned++;
        break;

      case "pending":
        summary.pending++;
        break;

      case "skipped":
        summary.skipped++;
        break;

      case "cancelled":
        summary.cancelled++;
        break;
    }
  });

  summary.remaining =
    summary.pending +
    summary.assigned +
    summary.outForDelivery;

  return summary;
}
export async function bulkAssignSubscriptionDeliveriesService(
  deliveryIds,
  deliveryBoyId
) {

  const {
    data,
    error,
  } = await supabaseAdmin
    .from("subscription_deliveries")
    .update({
      delivery_boy_id: deliveryBoyId,
      status: "Assigned",
      updated_at: new Date().toISOString(),
    })
    .in("id", deliveryIds)
    .select(`
      id,
      delivery_number,
      delivery_boy_id,
      status,
      customers(
        id,
        full_name,
        phone
      ),
      delivery_boys(
        id,
        full_name,
        phone
      )
    `);

  if (error) {
    throw error;
  }

  return data;
}
/* ==========================================================
   AUTO EXPIRE SUBSCRIPTIONS
   ========================================================== */

export async function expireSubscriptionsService() {
  const today = new Date().toISOString().split("T")[0];

  const {
    data,
    error,
  } = await supabaseAdmin
    .from("subscriptions")
    .update({
      status: "Expired",
      updated_at: new Date().toISOString(),
    })
    .eq("status", "Active")
    .lt("end_date", today)
    .select("id, customer_id, start_date, end_date, status");

  if (error) {
    console.error(
      "Expire Subscriptions Error:",
      error
    );

    throw error;
  }

  console.log(
    `AUTO EXPIRY: ${data?.length || 0} subscription(s) expired.`
  );

  return data || [];
}