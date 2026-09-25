import { supabaseAdmin } from "../config/supabase.js";

export async function validateCouponService({ code, amount }) {
  try {
    const normalizedCode = String(code || "")
      .trim()
      .toUpperCase();

    const originalAmount = Number(amount);

    if (!normalizedCode) {
      return {
        data: null,
        error: { message: "Please enter a coupon code." },
      };
    }

    if (
      !Number.isFinite(originalAmount) ||
      originalAmount <= 0
    ) {
      return {
        data: null,
        error: { message: "Invalid subscription amount." },
      };
    }

    // Find active coupon
    const { data: coupon, error } = await supabaseAdmin
      .from("coupons")
      .select("*")
      .eq("code", normalizedCode)
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      console.error("Coupon lookup error:", error);

      return {
        data: null,
        error: { message: "Unable to validate coupon." },
      };
    }

    if (!coupon) {
      return {
        data: null,
        error: {
          message: "Invalid or inactive coupon code.",
        },
      };
    }

    // Check coupon dates
    const today = new Date()
      .toISOString()
      .split("T")[0];

    if (
      coupon.start_date &&
      today < coupon.start_date
    ) {
      return {
        data: null,
        error: {
          message: "This coupon is not active yet.",
        },
      };
    }

    if (
      coupon.end_date &&
      today > coupon.end_date
    ) {
      return {
        data: null,
        error: {
          message: "This coupon has expired.",
        },
      };
    }

    // Check usage limit
    if (
      coupon.usage_limit !== null &&
      Number(coupon.used_count || 0) >=
        Number(coupon.usage_limit)
    ) {
      return {
        data: null,
        error: {
          message: "Coupon usage limit reached.",
        },
      };
    }

    // Check minimum subscription amount
    const minimumAmount = Number(
      coupon.minimum_amount || 0
    );

    if (originalAmount < minimumAmount) {
      return {
        data: null,
        error: {
          message: `Minimum subscription amount is ₹${minimumAmount}.`,
        },
      };
    }

    // Calculate discount
    let discount = 0;

    if (coupon.discount_type === "FIXED") {
      discount = Number(coupon.discount_value);
    } else if (
      coupon.discount_type === "PERCENTAGE"
    ) {
      discount =
        (originalAmount *
          Number(coupon.discount_value)) /
        100;
    }

    // Apply maximum discount if configured
    if (
      coupon.maximum_discount !== null &&
      coupon.maximum_discount !== undefined
    ) {
      discount = Math.min(
        discount,
        Number(coupon.maximum_discount)
      );
    }

    // Discount cannot exceed subscription amount
    discount = Math.min(
      Math.max(discount, 0),
      originalAmount
    );

    discount = Number(discount.toFixed(2));

    const finalAmount = Number(
      (originalAmount - discount).toFixed(2)
    );

    return {
      data: {
        id: coupon.id,
        code: coupon.code,
        discount_type: coupon.discount_type,
        original_amount: originalAmount,
        discount,
        final_amount: finalAmount,
      },
      error: null,
    };
  } catch (error) {
    console.error("Validate Coupon Service Error:", error);

    return {
      data: null,
      error: {
        message: "Something went wrong validating coupon.",
      },
    };
  }
}