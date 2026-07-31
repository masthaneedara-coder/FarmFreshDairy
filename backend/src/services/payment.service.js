import crypto from "crypto";
import razorpay from "../config/razorpay.js";
import { supabaseAdmin } from "../config/supabase.js";

/* ==========================================================
   Create Razorpay Order
========================================================== */

export async function createOrderService(amount) {
  try {
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `SUB_${Date.now()}`,
    });

    return {
      data: order,
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error,
    };
  }
}

/* ==========================================================
   Save Payment
========================================================== */

export async function createPaymentService(payment) {
  return await supabaseAdmin
    .from("payments")
    .insert(payment)
    .select()
    .single();
}

/* ==========================================================
   Verify Razorpay Payment
========================================================== */

export async function verifyPaymentService({
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
}) {
  try {
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return {
        data: null,
        error: {
          message: "Invalid payment signature",
        },
      };
    }

    return {
      data: {
        verified: true,
        payment_id: razorpay_payment_id,
        order_id: razorpay_order_id,
      },
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error,
    };
  }
}