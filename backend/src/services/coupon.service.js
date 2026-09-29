import { supabaseAdmin } from "../config/supabase.js";

const roundMoney = (value) =>
  Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const fail = (message) => ({
  data: null,
  error: { message },
});

export async function validateCouponService({
  code,
  billing_id,
  customer_id,
}) {
  try {
    const normalizedCode = String(code || "")
      .trim()
      .toUpperCase();

    if (!normalizedCode) {
      return fail("Please enter a coupon code.");
    }

    if (!billing_id || !customer_id) {
      return fail("Invoice and customer details are required.");
    }

    // 1. Fetch the invoice from the database.
    // Never use an amount supplied by the frontend.
    const { data: bill, error: billError } =
      await supabaseAdmin
        .from("billing")
        .select(`
          id,
          customer_id,
          invoice_type,
          payment_method,
          payment_status,
          subtotal,
          gst_amount,
          gst,
          discount,
          total_amount,
          coupon_id,
          coupon_code
        `)
        .eq("id", billing_id)
        .eq("customer_id", customer_id)
        .maybeSingle();

    if (billError) {
      console.error("Invoice lookup error:", billError);
      return fail("Unable to verify invoice.");
    }

    if (!bill) {
      return fail("Invoice not found or access denied.");
    }

    const paymentStatus = String(
      bill.payment_status || ""
    ).trim().toLowerCase();

    if (
      ["paid", "completed", "success", "successful"].includes(
        paymentStatus
      )
    ) {
      return fail(
        "This invoice is already paid. Coupons cannot be applied."
      );
    }

    if (
      !["pending", "unpaid", "due", ""].includes(paymentStatus)
    ) {
      return fail(
        "Coupon cannot be applied to this invoice status."
      );
    }

    // Allow subscription invoices and postpaid/COD invoices.
    const invoiceType = String(
      bill.invoice_type || ""
    ).trim().toLowerCase();

    const paymentMethod = String(
      bill.payment_method || ""
    ).trim().toLowerCase();

    const isSubscriptionInvoice =
      invoiceType === "subscription";

    const isPostpaidInvoice =
      ["cod", "postpaid", "cash on delivery"].includes(
        paymentMethod
      );

    if (!isSubscriptionInvoice && !isPostpaidInvoice) {
      return fail(
        "Coupons are not available for this invoice type."
      );
    }

    // 2. Get the actual amount currently due.
    // Existing invoice discount is already included in total_amount.
    const originalAmount = roundMoney(bill.total_amount);

    if (
      !Number.isFinite(originalAmount) ||
      originalAmount <= 0
    ) {
      return fail("This invoice has no payable amount.");
    }

    // 3. Find the coupon.
    const { data: coupon, error: couponError } =
      await supabaseAdmin
        .from("coupons")
        .select("*")
        .ilike("code", normalizedCode)
        .eq("is_active", true)
        .maybeSingle();

    if (couponError) {
      console.error("Coupon lookup error:", couponError);
      return fail("Unable to validate coupon.");
    }

    if (!coupon) {
      return fail("Invalid or inactive coupon code.");
    }

    // 4. Validate coupon dates using date-only values.
    const today = new Date()
      .toISOString()
      .slice(0, 10);

    const startDate =
      coupon.start_date || null;

    const endDate =
      coupon.end_date ||
      coupon.expiry_date ||
      null;

    if (startDate && today < startDate) {
      return fail("This coupon is not active yet.");
    }

    if (endDate && today > endDate) {
      return fail("This coupon has expired.");
    }

    // 5. Validate the global usage limit.
    if (coupon.usage_limit !== null) {
      const usageLimit = Number(coupon.usage_limit);
      const usedCount = Number(coupon.used_count || 0);

      if (
        Number.isFinite(usageLimit) &&
        usedCount >= usageLimit
      ) {
        return fail("Coupon usage limit reached.");
      }
    }

    // 6. Check customer-specific restrictions.
    const {
      data: restrictedCustomers,
      error: restrictionError,
    } = await supabaseAdmin
      .from("coupon_customers")
      .select("customer_id")
      .eq("coupon_id", coupon.id);

    if (restrictionError) {
      console.error(
        "Coupon customer lookup error:",
        restrictionError
      );
      return fail(
        "Unable to verify coupon eligibility."
      );
    }

    // If customer rows exist, only listed customers qualify.
    if (
      restrictedCustomers?.length > 0 &&
      !restrictedCustomers.some(
        (item) => item.customer_id === customer_id
      )
    ) {
      return fail(
        "This coupon is not available for your account."
      );
    }

    // 7. Validate minimum bill amount.
    const minimumAmount = Number(
      coupon.minimum_amount ??
      coupon.minimum_order ??
      0
    );

    if (
      Number.isFinite(minimumAmount) &&
      originalAmount < minimumAmount
    ) {
      return fail(
        `Minimum bill amount is ₹${minimumAmount.toFixed(2)}.`
      );
    }

    // 8. Calculate discount.
    const discountType = String(
      coupon.discount_type || ""
    ).trim().toUpperCase();

    const discountValue = Number(
      coupon.discount_value
    );

    if (
      !Number.isFinite(discountValue) ||
      discountValue <= 0
    ) {
      return fail("Invalid coupon discount configuration.");
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
      return fail("Unsupported coupon discount type.");
    }

    // Apply maximum discount.
    const maximumDiscount =
      coupon.maximum_discount;

    if (
      maximumDiscount !== null &&
      maximumDiscount !== undefined &&
      Number.isFinite(Number(maximumDiscount))
    ) {
      discount = Math.min(
        discount,
        Number(maximumDiscount)
      );
    }

    // Discount cannot exceed invoice amount.
    discount = roundMoney(
      Math.min(
        Math.max(discount, 0),
        originalAmount
      )
    );

    const finalAmount = roundMoney(
      originalAmount - discount
    );

    return {
      data: {
        id: coupon.id,
        code: coupon.code,
        discount_type: coupon.discount_type,
        original_amount: originalAmount,
        discount,
        final_amount: finalAmount,
        billing_id: bill.id,
      },
      error: null,
    };
  } catch (error) {
    console.error(
      "Validate Coupon Service Error:",
      error
    );

    return fail(
      "Something went wrong validating coupon."
    );
  }
}