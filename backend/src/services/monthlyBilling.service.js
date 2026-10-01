
import { supabaseAdmin } from "../config/supabase.js";

// ======================================================
// COMMON HELPERS
// ======================================================

function getMonthDateRange(month, year) {
  const numericMonth = Number(month);
  const numericYear = Number(year);

  if (
    !Number.isInteger(numericMonth) ||
    numericMonth < 1 ||
    numericMonth > 12 ||
    !Number.isInteger(numericYear) ||
    numericYear < 2000
  ) {
    throw new Error("Invalid month or year");
  }

  const fromDate =
    `${numericYear}-${String(numericMonth).padStart(2, "0")}-01`;

  const lastDay = new Date(
    numericYear,
    numericMonth,
    0
  ).getDate();

  const toDate =
    `${numericYear}-${String(numericMonth).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  return {
    month: numericMonth,
    year: numericYear,
    fromDate,
    toDate,
  };
}

// Currency rounding
function roundAmount(value) {
  return Math.round(
    (Number(value) + Number.EPSILON) * 100
  ) / 100;
}

// ======================================================
// GST-INCLUSIVE PRICE CALCULATION
// ======================================================

function calculateInclusiveGST(grossAmount, gstRate) {
  const gross = Number(grossAmount || 0);
  const rate = Number(gstRate || 0);

  if (
    !Number.isFinite(gross) ||
    gross < 0 ||
    !Number.isFinite(rate) ||
    rate < 0
  ) {
    throw new Error("Invalid amount or GST rate");
  }

  if (rate === 0 || gross === 0) {
    return {
      taxableAmount: roundAmount(gross),
      gstAmount: 0,
      grossAmount: roundAmount(gross),
      gstRate: rate,
    };
  }

  // GST is already included in the selling price.
  const taxableAmount = roundAmount(
    gross / (1 + rate / 100)
  );

  const gstAmount = roundAmount(
    gross - taxableAmount
  );

  return {
    taxableAmount,
    gstAmount,
    grossAmount: roundAmount(gross),
    gstRate: rate,
  };
}

// ======================================================
// CALCULATE MONTHLY BILL FROM DELIVERED ITEMS
// ======================================================

function calculateDeliveredBill(deliveries = []) {
  let deliveredDays = 0;
  let missedDays = 0;

  let subtotal = 0;
  let taxableSubtotal = 0;
  let totalGST = 0;

  const gstBreakdown = {};

  for (const delivery of deliveries) {
    if (delivery.status === "Delivered") {
      deliveredDays++;

      const items =
        delivery.subscription_delivery_items || [];

      for (const item of items) {
        const quantity = Number(item.quantity || 0);

        const unitPrice = Number(
          item.unit_price || 0
        );

        // Prefer the actual historical delivered amount.
        // Fall back to quantity * historical unit price.
        const grossAmount =
          item.total_price !== null &&
          item.total_price !== undefined
            ? Number(item.total_price)
            : quantity * unitPrice;

        if (
          !Number.isFinite(grossAmount) ||
          grossAmount < 0
        ) {
          throw new Error(
            `Invalid item amount for delivery ${delivery.id}`
          );
        }

        // Use the GST rate on the related product.
        // If no product GST is available, default to 0.
        const gstRate = Number(
          item.products?.gst ?? 0
        );

        if (
          !Number.isFinite(gstRate) ||
          gstRate < 0
        ) {
          throw new Error(
            `Invalid GST rate for delivery ${delivery.id}`
          );
        }

        const gst = calculateInclusiveGST(
          grossAmount,
          gstRate
        );

        subtotal += gst.grossAmount;
        taxableSubtotal += gst.taxableAmount;
        totalGST += gst.gstAmount;

        // Group GST by rate for invoice display.
        const rateKey = String(gstRate);

        if (!gstBreakdown[rateKey]) {
          gstBreakdown[rateKey] = {
            gstRate,
            taxableAmount: 0,
            gstAmount: 0,
            grossAmount: 0,
          };
        }

        gstBreakdown[rateKey].taxableAmount +=
          gst.taxableAmount;

        gstBreakdown[rateKey].gstAmount +=
          gst.gstAmount;

        gstBreakdown[rateKey].grossAmount +=
          gst.grossAmount;
      }
    } else if (delivery.status === "Missed") {
      missedDays++;
    }
  }

  subtotal = roundAmount(subtotal);
  taxableSubtotal = roundAmount(taxableSubtotal);
  totalGST = roundAmount(totalGST);

  // Discount is zero until coupon/discount rules
  // are confirmed and implemented.
  const discount = 0;

  // Since the product price includes GST, do not add
  // GST again to the customer's payable amount.
  const totalAmount = roundAmount(
    subtotal - discount
  );

  // Round the GST summary for display.
  for (const rateKey of Object.keys(gstBreakdown)) {
    gstBreakdown[rateKey].taxableAmount =
      roundAmount(
        gstBreakdown[rateKey].taxableAmount
      );

    gstBreakdown[rateKey].gstAmount =
      roundAmount(
        gstBreakdown[rateKey].gstAmount
      );

    gstBreakdown[rateKey].grossAmount =
      roundAmount(
        gstBreakdown[rateKey].grossAmount
      );
  }

  return {
    deliveredDays,
    missedDays,

    // Gross amount, including GST.
    subtotal,

    // Informational GST breakdown.
    taxableSubtotal,
    gstAmount: totalGST,
    gstBreakdown,

    discount,
    totalAmount,
  };
}

// ======================================================
// FETCH SUBSCRIPTION DELIVERIES
// ======================================================

async function getSubscriptionDeliveries(
  subscriptionId,
  fromDate,
  toDate
) {
  const {
    data,
    error,
  } = await supabaseAdmin
    .from("subscription_deliveries")
    .select(`
      id,
      customer_id,
      subscription_id,
      status,
      delivery_date,
      subscription_delivery_items(
        id,
        product_id,
        size,
        quantity,
        unit_price,
        total_price,
        products(
          id,
          size,
          name,
          gst
        )
      )
    `)
    .eq("subscription_id", subscriptionId)
    .gte("delivery_date", fromDate)
    .lte("delivery_date", toDate)
    .order("delivery_date", {
      ascending: true,
    });

  if (error) throw error;

  return data || [];
}

// ======================================================
// GENERATE MONTHLY BILLS
// ======================================================

export async function generateMonthlyBills(
  month,
  year
) {
  const {
    month: numericMonth,
    year: numericYear,
    fromDate,
    toDate,
  } = getMonthDateRange(month, year);

  // --------------------------------------------------
  // ACTIVE SUBSCRIPTIONS
  // --------------------------------------------------

  const {
    data: subscriptions,
    error: subscriptionError,
  } = await supabaseAdmin
    .from("subscriptions")
    .select(`
      id,
      customer_id,
      status,
      customers(
        id,
        full_name,
        phone
      )
    `)
    .eq("status", "Active");

  if (subscriptionError) {
    throw subscriptionError;
  }

  let generated = 0;
  let updated = 0;
  let skippedPaid = 0;
  let skippedNoDeliveries = 0;

  let totalRevenue = 0;
  let totalGST = 0;

  // --------------------------------------------------
  // PROCESS EACH SUBSCRIPTION
  // --------------------------------------------------

  for (const subscription of subscriptions || []) {
    const deliveries = await getSubscriptionDeliveries(
      subscription.id,
      fromDate,
      toDate
    );

    const calculated =
      calculateDeliveredBill(deliveries);

    // No completed delivery means no invoice.
    if (calculated.deliveredDays === 0) {
      skippedNoDeliveries++;
      continue;
    }

    const {
      deliveredDays,
      missedDays,
      subtotal,
      discount,
      totalAmount,
      gstAmount,
    } = calculated;

    // ------------------------------------------------
    // CHECK EXISTING BILL
    // ------------------------------------------------

    const {
      data: existingBill,
      error: existingBillError,
    } = await supabaseAdmin
      .from("monthly_bills")
      .select(`
        id,
        payment_status,
        total_amount
      `)
      .eq("customer_id", subscription.customer_id)
      .eq("subscription_id", subscription.id)
      .eq("month", numericMonth)
      .eq("year", numericYear)
      .maybeSingle();

    if (existingBillError) {
      throw existingBillError;
    }

    // ------------------------------------------------
    // PROTECT PAID BILLS
    // ------------------------------------------------

    if (
      existingBill &&
      String(existingBill.payment_status)
        .toLowerCase() === "paid"
    ) {
      skippedPaid++;

      totalRevenue += Number(
        existingBill.total_amount || 0
      );

      totalGST += gstAmount;

      continue;
    }

    // ------------------------------------------------
    // BILL DATA
    // ------------------------------------------------

    const billData = {
      customer_id: subscription.customer_id,
      subscription_id: subscription.id,

      month: numericMonth,
      year: numericYear,

      delivered_days: deliveredDays,
      missed_days: missedDays,

      // Gross amount including GST.
      subtotal,

      discount,

      // GST is already included in subtotal.
      total_amount: totalAmount,

      updated_at: new Date().toISOString(),
    };

    // ------------------------------------------------
    // UPDATE EXISTING UNPAID BILL
    // ------------------------------------------------

    if (existingBill) {
      const {
        error,
      } = await supabaseAdmin
        .from("monthly_bills")
        .update(billData)
        .eq("id", existingBill.id);

      if (error) throw error;

      updated++;
    }

    // ------------------------------------------------
    // CREATE NEW BILL
    // ------------------------------------------------

    else {
      const {
        error,
      } = await supabaseAdmin
        .from("monthly_bills")
        .insert({
          ...billData,
          payment_status: "Pending",
        });

      if (error) throw error;

      generated++;
    }

    totalRevenue += totalAmount;
    totalGST += gstAmount;
  }

  // --------------------------------------------------
  // SUMMARY
  // --------------------------------------------------

  return {
    success: true,

    month: numericMonth,
    year: numericYear,

    generated,
    updated,

    skippedPaid,
    skippedNoDeliveries,

    totalRevenue: roundAmount(totalRevenue),
    totalGST: roundAmount(totalGST),

    totalCustomers: subscriptions?.length || 0,
  };
}

// ======================================================
// GET ALL MONTHLY BILLS
// ======================================================
// IMPORTANT:
// Refresh unpaid bills from actual delivery items
// so approved Extra Milk is included immediately.
// ======================================================

export async function getMonthlyBills(
  month,
  year
) {
  const {
    month: numericMonth,
    year: numericYear,
    fromDate,
    toDate,
  } = getMonthDateRange(month, year);


  // ======================================
  // 1. Get existing monthly bills
  // ======================================
  const {
    data: bills,
    error: billsError,
  } = await supabaseAdmin
    .from("monthly_bills")
    .select(`
      *,
      customers(
        id,
        full_name,
        phone
      ),
      subscriptions(
        id,
        customer_id,
        status
      )
    `)
    .eq("month", numericMonth)
    .eq("year", numericYear)
    .order("generated_at", {
      ascending: false,
    });

  if (billsError) {
    throw billsError;
  }


  // ======================================
  // 2. Refresh unpaid bills
  // ======================================
  for (const bill of bills || []) {

    // Never modify a paid bill automatically
    if (
      String(bill.payment_status || "")
        .toLowerCase() === "paid"
    ) {
      continue;
    }


    if (!bill.subscription_id) {
      continue;
    }


    // ======================================
    // Get actual deliveries
    // ======================================
    const deliveries =
      await getSubscriptionDeliveries(
        bill.subscription_id,
        fromDate,
        toDate
      );


    // ======================================
    // Recalculate from delivery items
    // ======================================
    const calculated =
      calculateDeliveredBill(deliveries);


    // No delivered days
    if (calculated.deliveredDays === 0) {
      continue;
    }


    // ======================================
    // Update monthly bill
    // ======================================
    const {
      data: updatedBill,
      error: updateError,
    } = await supabaseAdmin
      .from("monthly_bills")
      .update({
        delivered_days:
          calculated.deliveredDays,

        missed_days:
          calculated.missedDays,

        subtotal:
          calculated.subtotal,

        discount:
          calculated.discount,

        total_amount:
          calculated.totalAmount,

        updated_at:
          new Date().toISOString(),
      })
      .eq("id", bill.id)
      .neq("payment_status", "Paid")
      .select(`
        *,
        customers(
          id,
          full_name,
          phone
        ),
        subscriptions(
          id,
          customer_id,
          status
        )
      `)
      .maybeSingle();


    if (updateError) {
      console.error(
        "Monthly Bill Refresh Error:",
        updateError
      );

      throw updateError;
    }


    // Replace old bill with refreshed bill
    if (updatedBill) {
      Object.assign(bill, updatedBill);
    }
  }


  return bills || [];
}
// ======================================================
// GET CUSTOMER MONTHLY BILL
// ======================================================

export async function getCustomerMonthlyBill(
  subscriptionId,
  month,
  year
) {
  const {
    month: numericMonth,
    year: numericYear,
  } = getMonthDateRange(month, year);

  const {
    data,
    error,
  } = await supabaseAdmin
    .from("monthly_bills")
    .select(`
      *,
      customers(*),
      subscriptions(*)
    `)
    .eq("subscription_id", subscriptionId)
    .eq("month", numericMonth)
    .eq("year", numericYear)
    .maybeSingle();

  if (error) throw error;

  return data;
}

// ======================================================
// MARK MONTHLY BILL AS PAID
// ======================================================

export async function markMonthlyBillPaid(
  billId
) {
  if (!billId) {
    throw new Error("Bill ID is required");
  }

  const now = new Date().toISOString();

  const {
    data,
    error,
  } = await supabaseAdmin
    .from("monthly_bills")
    .update({
      payment_status: "Paid",
      paid_at: now,
      updated_at: now,
    })
    .eq("id", billId)
    .select()
    .single();

  if (error) throw error;

  return data;
}

// ======================================================
// GET MONTHLY BILL DETAILS
// ======================================================

export async function getMonthlyBillDetails(
  subscriptionId,
  month,
  year
) {
  if (!subscriptionId) {
    throw new Error("Subscription ID is required");
  }

  const {
    month: numericMonth,
    year: numericYear,
    fromDate,
    toDate,
  } = getMonthDateRange(month, year);

  // --------------------------------------------------
  // GET EXISTING BILL
  // --------------------------------------------------

  const {
    data: existingBill,
    error: billError,
  } = await supabaseAdmin
    .from("monthly_bills")
    .select(`
      *,
      customers(*),
      subscriptions(*)
    `)
    .eq("subscription_id", subscriptionId)
    .eq("month", numericMonth)
    .eq("year", numericYear)
    .maybeSingle();

  if (billError) throw billError;

  // --------------------------------------------------
  // GET DELIVERY DETAILS
  // --------------------------------------------------

  const deliveries = await getSubscriptionDeliveries(
    subscriptionId,
    fromDate,
    toDate
  );

  const calculated =
    calculateDeliveredBill(deliveries);

  let bill = existingBill;

  // --------------------------------------------------
  // CREATE MISSING BILL
  // --------------------------------------------------

  if (!bill) {
    if (calculated.deliveredDays === 0) {
      throw new Error(
        `No invoice available for subscription ${subscriptionId}. ` +
        `No completed deliveries for ${numericMonth}/${numericYear}.`
      );
    }

    const customerId = deliveries.find(
      (delivery) => delivery.customer_id
    )?.customer_id;

    if (!customerId) {
      throw new Error(
        "Customer ID not found for this subscription."
      );
    }

    const {
      data: newBill,
      error: createBillError,
    } = await supabaseAdmin
      .from("monthly_bills")
      .insert({
        customer_id: customerId,
        subscription_id: subscriptionId,

        month: numericMonth,
        year: numericYear,

        delivered_days: calculated.deliveredDays,
        missed_days: calculated.missedDays,

        subtotal: calculated.subtotal,
        discount: calculated.discount,
        total_amount: calculated.totalAmount,

        payment_status: "Pending",
      })
      .select(`
        *,
        customers(*),
        subscriptions(*)
      `)
      .single();

    if (createBillError) {
      throw createBillError;
    }

    bill = newBill;
  }

  // --------------------------------------------------
  // RETURN DETAILS WITH GST BREAKDOWN
  // --------------------------------------------------

  return {
    bill,

    customer: bill.customers,

    subscription: bill.subscriptions,

    deliveries,

    // GST breakdown is returned for invoice display.
    // It is not stored in monthly_bills because the
    // confirmed table has no GST columns.
    calculation: {
      subtotal: calculated.subtotal,
      taxableSubtotal: calculated.taxableSubtotal,
      gstAmount: calculated.gstAmount,
      gstBreakdown: calculated.gstBreakdown,
      discount: calculated.discount,
      totalAmount: calculated.totalAmount,
      deliveredDays: calculated.deliveredDays,
      missedDays: calculated.missedDays,
    },
  };
}
// ======================================================
// APPLY COUPON TO MONTHLY BILL
// ======================================================

export async function applyMonthlyBillCoupon({
  billId,
  customerId,
  code,
}) {
  try {
    const normalizedCode = String(code || "")
      .trim()
      .toUpperCase();

    if (!billId || !customerId || !normalizedCode) {
      throw new Error(
        "Bill ID, customer ID and coupon code are required."
      );
    }

    // 1. Fetch the customer's monthly bill
    const {
      data: bill,
      error: billError,
    } = await supabaseAdmin
      .from("monthly_bills")
      .select("*")
      .eq("id", billId)
      .eq("customer_id", customerId)
      .maybeSingle();

    if (billError) throw billError;

    if (!bill) {
      throw new Error(
        "Monthly bill not found or access denied."
      );
    }

    if (
      String(bill.payment_status || "").toLowerCase() ===
      "paid"
    ) {
      throw new Error(
        "This bill is already paid. Coupons cannot be applied."
      );
    }

    if (Number(bill.total_amount) <= 0) {
      throw new Error("This bill has no payable amount.");
    }

    if (bill.coupon_id) {
      throw new Error(
        "A coupon has already been applied to this bill."
      );
    }

    // 2. Find active coupon
    const {
      data: coupon,
      error: couponError,
    } = await supabaseAdmin
      .from("coupons")
      .select("*")
      .ilike("code", normalizedCode)
      .eq("is_active", true)
      .maybeSingle();

    if (couponError) throw couponError;

    if (!coupon) {
      throw new Error("Invalid or inactive coupon code.");
    }

    // 3. Validate coupon dates
    const today = new Date()
      .toISOString()
      .slice(0, 10);

    const startDate = coupon.start_date || null;
    const endDate =
      coupon.end_date || coupon.expiry_date || null;

    if (startDate && today < startDate) {
      throw new Error("This coupon is not active yet.");
    }

    if (endDate && today > endDate) {
      throw new Error("This coupon has expired.");
    }

    // 4. Validate overall usage limit
    if (
      coupon.usage_limit !== null &&
      Number(coupon.used_count || 0) >=
        Number(coupon.usage_limit)
    ) {
      throw new Error("Coupon usage limit reached.");
    }

    // 5. Validate customer restrictions
    const {
      data: restrictions,
      error: restrictionError,
    } = await supabaseAdmin
      .from("coupon_customers")
      .select("customer_id")
      .eq("coupon_id", coupon.id);

    if (restrictionError) throw restrictionError;

    if (
      restrictions?.length > 0 &&
      !restrictions.some(
        (row) => row.customer_id === customerId
      )
    ) {
      throw new Error(
        "This coupon is not available for your account."
      );
    }

    // 6. Check minimum bill amount
    const originalAmount = roundAmount(
      bill.total_amount
    );

    const minimumAmount = Number(
      coupon.minimum_amount ??
      coupon.minimum_order ??
      0
    );

    if (originalAmount < minimumAmount) {
      throw new Error(
        `Minimum bill amount is ₹${minimumAmount.toFixed(2)}.`
      );
    }

    // 7. Calculate discount
    const discountType = String(
      coupon.discount_type || ""
    ).toUpperCase();

    const discountValue = Number(
      coupon.discount_value
    );

    if (
      !Number.isFinite(discountValue) ||
      discountValue <= 0
    ) {
      throw new Error(
        "Invalid coupon discount configuration."
      );
    }

    let discount = 0;

    if (
      discountType === "FIXED" ||
      discountType === "FLAT"
    ) {
      discount = discountValue;
    } else if (
      discountType === "PERCENTAGE" ||
      discountType === "PERCENT"
    ) {
      discount =
        (originalAmount * discountValue) / 100;
    } else {
      throw new Error(
        "Unsupported coupon discount type."
      );
    }

    if (
      coupon.maximum_discount !== null &&
      coupon.maximum_discount !== undefined
    ) {
      discount = Math.min(
        discount,
        Number(coupon.maximum_discount)
      );
    }

    discount = roundAmount(
      Math.min(
        Math.max(discount, 0),
        originalAmount
      )
    );

    const finalAmount = roundAmount(
      originalAmount - discount
    );

    // 8. Update the monthly bill
    const now = new Date().toISOString();

    const {
      data: updatedBill,
      error: updateError,
    } = await supabaseAdmin
      .from("monthly_bills")
      .update({
        coupon_id: coupon.id,
        coupon_code: coupon.code,
        discount,
        total_amount: finalAmount,
        updated_at: now,
      })
      .eq("id", billId)
      .eq("customer_id", customerId)
      .neq("payment_status", "Paid")
      .is("coupon_id", null)
      .select()
      .maybeSingle();

    if (updateError) throw updateError;

    if (!updatedBill) {
      throw new Error(
        "Bill changed or coupon was already applied. Refresh and try again."
      );
    }

    // 9. Record coupon redemption
    const {
      error: redemptionError,
    } = await supabaseAdmin
      .from("coupon_redemptions")
      .insert({
        coupon_id: coupon.id,
        customer_id: customerId,
        monthly_bill_id: billId,
        discount_amount: discount,
        status: "Applied",
        applied_at: now,
      });

    if (redemptionError) {
      console.error(
        "Coupon redemption insert error:",
        redemptionError
      );

      // Restore the bill if redemption tracking failed.
      await supabaseAdmin
        .from("monthly_bills")
        .update({
          coupon_id: null,
          coupon_code: null,
          discount: bill.discount || 0,
          total_amount: bill.total_amount,
          updated_at: new Date().toISOString(),
        })
        .eq("id", billId)
        .eq("coupon_id", coupon.id);

      throw new Error(
        "Unable to record coupon redemption. Please try again."
      );
    }

    return {
      success: true,
      message: "Coupon applied successfully.",
      bill: updatedBill,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discount,
        original_amount: originalAmount,
        final_amount: finalAmount,
      },
    };
  } catch (error) {
    console.error(
      "Apply Monthly Bill Coupon Error:",
      error
    );

    throw error;
  }
}