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

  const fromDate = `${numericYear}-${String(numericMonth).padStart(2, "0")}-01`;
  const lastDay = new Date(numericYear, numericMonth, 0).getDate();
  const toDate = `${numericYear}-${String(numericMonth).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  return { month: numericMonth, year: numericYear, fromDate, toDate };
}

function roundAmount(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function isPaidBill(bill) {
  return String(bill?.payment_status || "").toLowerCase() === "paid";
}

// Preserve a coupon's existing fixed discount when the delivery subtotal is refreshed.
// Coupon metadata is never overwritten by these refresh operations.
function applyExistingBillDiscount(calculated, existingBill = null) {
  const rawDiscount = Number(existingBill?.discount || 0);
  const safeDiscount = Number.isFinite(rawDiscount) ? Math.max(rawDiscount, 0) : 0;
  const discount = roundAmount(Math.min(safeDiscount, calculated.subtotal));

  return {
    ...calculated,
    discount,
    totalAmount: roundAmount(calculated.subtotal - discount),
  };
}

// ======================================================
// GST-INCLUSIVE PRICE CALCULATION
// ======================================================

function calculateInclusiveGST(grossAmount, gstRate) {
  const gross = Number(grossAmount || 0);
  const rate = Number(gstRate || 0);

  if (!Number.isFinite(gross) || gross < 0 || !Number.isFinite(rate) || rate < 0) {
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

  const taxableAmount = roundAmount(gross / (1 + rate / 100));
  const gstAmount = roundAmount(gross - taxableAmount);

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

      for (const item of delivery.subscription_delivery_items || []) {
        const quantity = Number(item.quantity || 0);
        const unitPrice = Number(item.unit_price || 0);
        const grossAmount =
          item.total_price !== null && item.total_price !== undefined
            ? Number(item.total_price)
            : quantity * unitPrice;

        if (!Number.isFinite(grossAmount) || grossAmount < 0) {
          throw new Error(`Invalid item amount for delivery ${delivery.id}`);
        }

        const gstRate = Number(item.products?.gst ?? 0);
        if (!Number.isFinite(gstRate) || gstRate < 0) {
          throw new Error(`Invalid GST rate for delivery ${delivery.id}`);
        }

        const gst = calculateInclusiveGST(grossAmount, gstRate);
        subtotal += gst.grossAmount;
        taxableSubtotal += gst.taxableAmount;
        totalGST += gst.gstAmount;

        const rateKey = String(gstRate);
        if (!gstBreakdown[rateKey]) {
          gstBreakdown[rateKey] = {
            gstRate,
            taxableAmount: 0,
            gstAmount: 0,
            grossAmount: 0,
          };
        }

        gstBreakdown[rateKey].taxableAmount += gst.taxableAmount;
        gstBreakdown[rateKey].gstAmount += gst.gstAmount;
        gstBreakdown[rateKey].grossAmount += gst.grossAmount;
      }
    } else if (delivery.status === "Missed") {
      missedDays++;
    }
  }

  subtotal = roundAmount(subtotal);
  taxableSubtotal = roundAmount(taxableSubtotal);
  totalGST = roundAmount(totalGST);

  for (const rateKey of Object.keys(gstBreakdown)) {
    gstBreakdown[rateKey].taxableAmount = roundAmount(gstBreakdown[rateKey].taxableAmount);
    gstBreakdown[rateKey].gstAmount = roundAmount(gstBreakdown[rateKey].gstAmount);
    gstBreakdown[rateKey].grossAmount = roundAmount(gstBreakdown[rateKey].grossAmount);
  }

  return {
    deliveredDays,
    missedDays,
    subtotal,
    taxableSubtotal,
    gstAmount: totalGST,
    gstBreakdown,
    discount: 0,
    totalAmount: subtotal,
  };
}

// ======================================================
// PRICE SIZE NORMALIZATION AND CURRENT PRICE LOOKUP
// ======================================================

function normalizeBillingSize(value) {
  if (value === null || value === undefined) return null;

  const text = String(value)
    .trim()
    .toLowerCase()
    .replace(/,/g, ".")
    .replace(/\s+/g, "");

  const match = text.match(
    /^(\d+(?:\.\d+)?)(ml|millilitres?|milliliters?|ltr|litres?|liters?|l)$/
  );

  if (!match) return null;

  const amount = Number(match[1]);
  const unit = match[2];
  if (!Number.isFinite(amount)) return null;

  return ["ml", "millilitre", "millilitres", "milliliter", "milliliters"].includes(unit)
    ? amount
    : amount * 1000;
}

async function applyCurrentBillingPrices(deliveries = []) {
  const productIds = [
    ...new Set(
      deliveries.flatMap((delivery) =>
        (delivery.subscription_delivery_items || [])
          .map((item) => item.product_id)
          .filter(Boolean)
      )
    ),
  ];

  if (!productIds.length) return deliveries;

  const { data: sizeRows, error } = await supabaseAdmin
    .from("product_sizes")
    .select("product_id, label, price, is_active")
    .in("product_id", productIds)
    .eq("is_active", true);

  if (error) throw error;

  const priceMap = new Map();

  for (const row of sizeRows || []) {
    const volume = normalizeBillingSize(row.label);
    const price = Number(row.price);

    if (volume === null || !Number.isFinite(price) || price < 0) continue;

    const key = `${row.product_id}::${volume}`;
    if (priceMap.has(key) && priceMap.get(key) !== price) {
      throw new Error(
        `Conflicting active prices found for product ${row.product_id}, size ${row.label}`
      );
    }

    priceMap.set(key, price);
  }

  return deliveries.map((delivery) => ({
    ...delivery,
    subscription_delivery_items: (delivery.subscription_delivery_items || []).map((item) => {
      const volume = normalizeBillingSize(item.size);
      const key = volume === null ? null : `${item.product_id}::${volume}`;
      const currentPrice = key ? priceMap.get(key) : undefined;

      // If no current product-size match exists, retain the saved delivery price.
      if (currentPrice === undefined) return item;

      const quantity = Number(item.quantity || 0);
      if (!Number.isFinite(quantity) || quantity < 0) {
        throw new Error(`Invalid quantity for delivery item ${item.id}`);
      }

      return {
        ...item,
        unit_price: currentPrice,
        total_price: roundAmount(quantity * currentPrice),
      };
    }),
  }));
}

// ======================================================
// FETCH SUBSCRIPTION DELIVERIES
// ======================================================

async function getSubscriptionDeliveries(
  subscriptionId,
  fromDate,
  toDate,
  useCurrentBillingPrices = true
) {
  const { data, error } = await supabaseAdmin
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
    .order("delivery_date", { ascending: true });

  if (error) throw error;
  if (!useCurrentBillingPrices) return data || [];

  return applyCurrentBillingPrices(data || []);
}

// ======================================================
// MONTHLY BILL UPDATE HELPER
// ======================================================

async function refreshPendingBill(bill, calculated, relationsSelect = "*") {
  if (!bill || isPaidBill(bill) || calculated.deliveredDays === 0) {
    return bill;
  }

  const finalCalculation = applyExistingBillDiscount(calculated, bill);

  const { data, error } = await supabaseAdmin
    .from("monthly_bills")
    .update({
      delivered_days: finalCalculation.deliveredDays,
      missed_days: finalCalculation.missedDays,
      subtotal: finalCalculation.subtotal,
      discount: finalCalculation.discount,
      total_amount: finalCalculation.totalAmount,
      updated_at: new Date().toISOString(),
    })
    .eq("id", bill.id)
    .neq("payment_status", "Paid")
    .select(relationsSelect)
    .maybeSingle();

  if (error) throw error;
  return data || bill;
}

// ======================================================
// GENERATE MONTHLY BILLS
// ======================================================

export async function generateMonthlyBills(month, year) {
  const { month: numericMonth, year: numericYear, fromDate, toDate } =
    getMonthDateRange(month, year);

  const { data: subscriptions, error: subscriptionError } = await supabaseAdmin
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

  if (subscriptionError) throw subscriptionError;

  let generated = 0;
  let updated = 0;
  let skippedPaid = 0;
  let skippedNoDeliveries = 0;
  let totalRevenue = 0;
  let totalGST = 0;

  for (const subscription of subscriptions || []) {
    const { data: existingBill, error: existingBillError } = await supabaseAdmin
      .from("monthly_bills")
      .select("id, payment_status, total_amount, subtotal, discount, coupon_id, coupon_code")
      .eq("customer_id", subscription.customer_id)
      .eq("subscription_id", subscription.id)
      .eq("month", numericMonth)
      .eq("year", numericYear)
      .maybeSingle();

    if (existingBillError) throw existingBillError;

    if (isPaidBill(existingBill)) {
      skippedPaid++;
      totalRevenue += Number(existingBill.total_amount || 0);
      continue;
    }

    // New and Pending bills use the current configured product-size prices.
    const deliveries = await getSubscriptionDeliveries(
      subscription.id,
      fromDate,
      toDate,
      true
    );

    const calculated = calculateDeliveredBill(deliveries);
    if (calculated.deliveredDays === 0) {
      skippedNoDeliveries++;
      continue;
    }

    const finalCalculation = applyExistingBillDiscount(calculated, existingBill);

    const billData = {
      customer_id: subscription.customer_id,
      subscription_id: subscription.id,
      month: numericMonth,
      year: numericYear,
      delivered_days: finalCalculation.deliveredDays,
      missed_days: finalCalculation.missedDays,
      subtotal: finalCalculation.subtotal,
      discount: finalCalculation.discount,
      total_amount: finalCalculation.totalAmount,
      updated_at: new Date().toISOString(),
    };

    if (existingBill) {
      const { error } = await supabaseAdmin
        .from("monthly_bills")
        .update(billData)
        .eq("id", existingBill.id)
        .neq("payment_status", "Paid");

      if (error) throw error;
      updated++;
    } else {
      const { error } = await supabaseAdmin
        .from("monthly_bills")
        .insert({ ...billData, payment_status: "Pending" });

      if (error) throw error;
      generated++;
    }

    totalRevenue += finalCalculation.totalAmount;
    totalGST += calculated.gstAmount;
  }

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
// Refresh only Pending bills; never modify Paid bills.
// ======================================================

export async function getMonthlyBills(month, year) {
  const { month: numericMonth, year: numericYear, fromDate, toDate } =
    getMonthDateRange(month, year);

  const { data: bills, error: billsError } = await supabaseAdmin
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
    .order("generated_at", { ascending: false });

  if (billsError) throw billsError;

  for (const bill of bills || []) {
    if (isPaidBill(bill) || !bill.subscription_id) continue;

    const deliveries = await getSubscriptionDeliveries(
      bill.subscription_id,
      fromDate,
      toDate,
      true
    );
    const calculated = calculateDeliveredBill(deliveries);
    if (calculated.deliveredDays === 0) continue;

    const updatedBill = await refreshPendingBill(
      bill,
      calculated,
      `*,
       customers(id, full_name, phone),
       subscriptions(id, customer_id, status)`
    );

    if (updatedBill) Object.assign(bill, updatedBill);
  }

  return bills || [];
}

// ======================================================
// GET CUSTOMER MONTHLY BILL
// ======================================================

export async function getCustomerMonthlyBill(subscriptionId, month, year) {
  const { month: numericMonth, year: numericYear } = getMonthDateRange(month, year);

  const { data, error } = await supabaseAdmin
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

export async function markMonthlyBillPaid(billId) {
  if (!billId) throw new Error("Bill ID is required");

  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin
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

export async function getMonthlyBillDetails(subscriptionId, month, year) {
  if (!subscriptionId) throw new Error("Subscription ID is required");

  const { month: numericMonth, year: numericYear, fromDate, toDate } =
    getMonthDateRange(month, year);

  const { data: existingBill, error: billError } = await supabaseAdmin
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

  const paid = isPaidBill(existingBill);
  const deliveries = await getSubscriptionDeliveries(
    subscriptionId,
    fromDate,
    toDate,
    !paid
  );

  const rawCalculation = calculateDeliveredBill(deliveries);
  let calculated = applyExistingBillDiscount(rawCalculation, existingBill);
  let bill = existingBill;

  if (!bill) {
    if (calculated.deliveredDays === 0) {
      throw new Error(
        `No invoice available for subscription ${subscriptionId}. No completed deliveries for ${numericMonth}/${numericYear}.`
      );
    }

    const customerId = deliveries.find((delivery) => delivery.customer_id)?.customer_id;
    if (!customerId) throw new Error("Customer ID not found for this subscription.");

    const { data: newBill, error: createBillError } = await supabaseAdmin
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

    if (createBillError) throw createBillError;
    bill = newBill;
  } else if (!paid && calculated.deliveredDays > 0) {
    bill = await refreshPendingBill(
      bill,
      rawCalculation,
      `*,
       customers(*),
       subscriptions(*)`
    );
    calculated = applyExistingBillDiscount(rawCalculation, bill);
  } else if (paid) {
    // A paid invoice is historical: return its stored amounts and historical delivery prices.
    calculated = {
      ...rawCalculation,
      subtotal: Number(bill.subtotal ?? rawCalculation.subtotal),
      discount: Number(bill.discount || 0),
      totalAmount: Number(bill.total_amount ?? 0),
    };
  }

  return {
    bill,
    customer: bill.customers,
    subscription: bill.subscriptions,
    deliveries,
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
// GET COMBINED CUSTOMER MONTHLY BILL DETAILS
// One invoice for all subscriptions of one customer
// ======================================================

export async function getCustomerCombinedMonthlyBillDetails(customerId, month, year) {
  if (!customerId) throw new Error("Customer ID is required");

  const { month: numericMonth, year: numericYear, fromDate, toDate } =
    getMonthDateRange(month, year);

  const { data: customer, error: customerError } = await supabaseAdmin
    .from("customers")
    .select("*")
    .eq("id", customerId)
    .maybeSingle();

  if (customerError) throw customerError;
  if (!customer) throw new Error("Customer not found");

  const { data: subscriptions, error: subscriptionError } = await supabaseAdmin
    .from("subscriptions")
    .select("*")
    .eq("customer_id", customerId);

  if (subscriptionError) throw subscriptionError;

  const { data: existingBills, error: billsError } = await supabaseAdmin
    .from("monthly_bills")
    .select("*")
    .eq("customer_id", customerId)
    .eq("month", numericMonth)
    .eq("year", numericYear);

  if (billsError) throw billsError;

  const billDetails = [];
  const allDeliveries = [];

  for (const subscription of subscriptions || []) {
    let bill = (existingBills || []).find(
      (item) => item.subscription_id === subscription.id
    ) || null;

    const paid = isPaidBill(bill);
    const deliveries = await getSubscriptionDeliveries(
      subscription.id,
      fromDate,
      toDate,
      !paid
    );

    const rawCalculation = calculateDeliveredBill(deliveries);
    let calculated = applyExistingBillDiscount(rawCalculation, bill);

    if (!bill && calculated.deliveredDays === 0) continue;

    if (!bill && calculated.deliveredDays > 0) {
      const { data: newBill, error: createError } = await supabaseAdmin
        .from("monthly_bills")
        .insert({
          customer_id: customerId,
          subscription_id: subscription.id,
          month: numericMonth,
          year: numericYear,
          delivered_days: calculated.deliveredDays,
          missed_days: calculated.missedDays,
          subtotal: calculated.subtotal,
          discount: calculated.discount,
          total_amount: calculated.totalAmount,
          payment_status: "Pending",
        })
        .select("*")
        .single();

      if (createError) throw createError;
      bill = newBill;
    } else if (bill && !paid && calculated.deliveredDays > 0) {
      bill = await refreshPendingBill(bill, rawCalculation, "*");
      calculated = applyExistingBillDiscount(rawCalculation, bill);
    } else if (bill && paid) {
      calculated = {
        ...rawCalculation,
        subtotal: Number(bill.subtotal ?? rawCalculation.subtotal),
        discount: Number(bill.discount || 0),
        totalAmount: Number(bill.total_amount ?? 0),
      };
    }

    if (!bill) continue;

    allDeliveries.push(...deliveries);
    billDetails.push({ bill, subscription, deliveries, calculation: calculated });
  }

  const combinedCalculation = calculateDeliveredBill(allDeliveries);
  const totalAmount = roundAmount(
    billDetails.reduce((sum, item) => sum + Number(item.bill.total_amount || 0), 0)
  );
  const totalDiscount = roundAmount(
    billDetails.reduce((sum, item) => sum + Number(item.bill.discount || 0), 0)
  );
  const totalSubtotal = roundAmount(
    billDetails.reduce(
      (sum, item) => sum + Number(item.bill.subtotal ?? item.calculation.subtotal ?? 0),
      0
    )
  );

  const allPaid =
    billDetails.length > 0 &&
    billDetails.every((item) => isPaidBill(item.bill));

  return {
    customer,
    month: numericMonth,
    year: numericYear,
    subscriptions: billDetails.map((item) => item.subscription),
    bills: billDetails.map((item) => item.bill),
    deliveries: allDeliveries,
    bill: {
      customer_id: customerId,
      month: numericMonth,
      year: numericYear,
      subtotal: totalSubtotal,
      total_amount: totalAmount,
      discount: totalDiscount,
      payment_status: allPaid ? "Paid" : "Pending",
    },
    calculation: {
      ...combinedCalculation,
      subtotal: totalSubtotal,
      discount: totalDiscount,
      totalAmount,
      billCount: billDetails.length,
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

// ======================================================
// NOTES
// ======================================================
// Current product_sizes prices are applied only to New/Pending bills.
// Paid bills use saved subscription_delivery_items prices and are not updated.
// No delivery-item, wallet-ledger, or historical records are modified.
