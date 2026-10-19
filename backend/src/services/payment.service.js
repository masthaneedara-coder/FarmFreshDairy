
import crypto from "crypto";
import razorpay from "../config/razorpay.js";
import { supabaseAdmin } from "../config/supabase.js";
import { creditWallet } from "./wallet.service.js";
import { createSubscriptionService } from "./subscription.service.js";


async function creditVerifiedPaymentToWallet({
  customerId,
  paymentRecordId,
  amount,
  razorpayPaymentId,
}) {
  try {
    const result = await creditWallet({
      customerId,
      amount,
      referenceId: paymentRecordId,
      referenceType: "PaymentRecord",
      remarks: `Razorpay payment ${razorpayPaymentId}`,
    });

    console.info("Verified payment wallet credit:", {
      paymentRecordId,
      razorpayPaymentId,
      customerId,
      amount,
      message: result.message,
      newBalance: result.newBalance,
    });

    return result;
  } catch (error) {
    console.error("Verified payment wallet credit failed:", {
      paymentRecordId,
      razorpayPaymentId,
      customerId,
      message: error.message,
    });

    throw new Error(
      "Payment is verified, but wallet credit could not be confirmed. Please retry verification; do not pay again."
    );
  }
}

/* ==========================================================
   Create Razorpay Order — No subscription before payment
========================================================== */

export async function createOrderService({
  customer_id,
  checkout_payload,
}) {
  let intentId = null;

  try {
    if (!customer_id || !checkout_payload) {
      return {
        data: null,
        error: { message: "Customer and checkout details are required." },
      };
    }

    const {
      product_id,
      address_id,
      quantity,
      size,
      frequency,
      delivery_time,
      start_date,
      coupon_code = null,
    } = checkout_payload;

    if (
      !product_id ||
      !address_id ||
      !start_date ||
      !size ||
      !Number.isFinite(Number(quantity)) ||
      Number(quantity) <= 0
    ) {
      return {
        data: null,
        error: { message: "Required subscription details are missing or invalid." },
      };
    }

    // Confirm the customer exists.
    const { data: customer, error: customerError } =
      await supabaseAdmin
        .from("customers")
        .select("id")
        .eq("id", customer_id)
        .maybeSingle();

    if (customerError) throw customerError;

    if (!customer) {
      return {
        data: null,
        error: { message: "Customer not found." },
      };
    }

    // Server-side base price: ₹90 per litre per day for 30 days.
    const sizeMultipliers = {
      "250ml": 0.25,
      "500ml": 0.5,
      "1L": 1,
      "2L": 2,
      "3L": 3,
      "5L": 5,
    };

    const multiplier = sizeMultipliers[size];

    if (!multiplier) {
      return {
        data: null,
        error: { message: "Unsupported subscription size." },
      };
    }

    const subtotal = Number(
      (90 * multiplier * Number(quantity) * 30).toFixed(2)
    );

    let appliedCouponCode = null;
    let couponDiscount = 0;
    let finalAmount = subtotal;

    if (coupon_code) {
      const { validateCouponService } = await import("./coupon.service.js");

      const { data: coupon, error: couponError } =
        await validateCouponService({
          code: coupon_code,
          amount: subtotal,
        });

      if (couponError || !coupon) {
        return {
          data: null,
          error: {
            message: couponError?.message || "Invalid coupon.",
          },
        };
      }

      appliedCouponCode = coupon.code;
      couponDiscount = Number(coupon.discount || 0);
      finalAmount = Number(coupon.final_amount);
    }

    if (!Number.isFinite(finalAmount) || finalAmount <= 0) {
      return {
        data: null,
        error: { message: "Calculated payment amount is invalid." },
      };
    }

    // Save the trusted checkout details before creating the Razorpay order.
    const payload = {
      customer_id,
      product_id,
      address_id,
      quantity: Number(quantity),
      size,
      frequency,
      delivery_time,
      start_date,
      coupon_code: appliedCouponCode,
      subtotal,
      discount: couponDiscount,
      total_amount: finalAmount,
      payment_method: "ONLINE",
    };

    const { data: intent, error: intentError } =
      await supabaseAdmin
        .from("payment_intents")
        .insert({
          customer_id,
          amount: finalAmount,
          currency: "INR",
          checkout_payload: payload,
          status: "CREATED",
        })
        .select()
        .single();

    if (intentError) throw intentError;

    intentId = intent.id;

    const order = await razorpay.orders.create({
      amount: Math.round(finalAmount * 100),
      currency: "INR",
      receipt: `INT_${String(intent.id).replace(/-/g, "").slice(0, 20)}`,
      notes: {
        customer_id: String(customer_id),
        payment_intent_id: String(intent.id),
      },
    });

    const { error: updateError } = await supabaseAdmin
      .from("payment_intents")
      .update({
        razorpay_order_id: order.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", intent.id);

    if (updateError) throw updateError;

    return {
      data: {
        order,
        intent_id: intent.id,
        amount: finalAmount,
        currency: "INR",
      },
      error: null,
    };
  } catch (error) {
    console.error("Razorpay Create Order Error:", error);

    // Mark failed intent rather than leaving it looking payable.
    if (intentId) {
      await supabaseAdmin
        .from("payment_intents")
        .update({
          status: "FAILED",
          updated_at: new Date().toISOString(),
        })
        .eq("id", intentId);
    }

    return {
      data: null,
      error: {
        message: error.message || "Unable to create Razorpay order.",
      },
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
  customer_id,
  intent_id,
}) {
  try {
    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !customer_id
    ) {
      return {
        data: null,
        error: { message: "Payment details and customer ID are required." },
      };
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      throw new Error("Razorpay secret key is not configured.");
    }

    // 1. Find the payment intent. A subscription does not exist yet.
    let query = supabaseAdmin
      .from("payment_intents")
      .select("*")
      .eq("razorpay_order_id", razorpay_order_id)
      .eq("customer_id", customer_id);

    if (intent_id) query = query.eq("id", intent_id);

    const { data: intent, error: intentError } =
      await query.maybeSingle();

    if (intentError) throw intentError;

    if (!intent) {
      return {
        data: null,
        error: { message: "Payment intent not found." },
      };
    }

    // If already finalized, return the existing subscription.
    if (intent.status === "COMPLETED" && intent.subscription_id) {
      const { data: subscription, error } = await supabaseAdmin
        .from("subscriptions")
        .select("*")
        .eq("id", intent.subscription_id)
        .eq("customer_id", customer_id)
        .maybeSingle();

      if (error) throw error;
      if (!subscription) {
        throw new Error("Completed payment needs subscription reconciliation.");
      }

      return {
        data: {
          verified: true,
          alreadyProcessed: true,
          subscription,
          payment: { payment_id: razorpay_payment_id, status: "Paid" },
        },
        error: null,
      };
    }

    // 2. Verify the Razorpay order matches the intent.
    const order = await razorpay.orders.fetch(razorpay_order_id);

    if (
      String(order.notes?.customer_id) !== String(customer_id) ||
      String(order.notes?.payment_intent_id) !== String(intent.id)
    ) {
      throw new Error("Razorpay order does not match this payment intent.");
    }

    if (
      Number(order.amount) !== Math.round(Number(intent.amount) * 100) ||
      order.currency !== intent.currency
    ) {
      throw new Error("Razorpay order amount or currency mismatch.");
    }

    // 3. Verify the Razorpay signature.
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest();

    const receivedSignature = Buffer.from(razorpay_signature, "hex");

    if (
      receivedSignature.length !== expectedSignature.length ||
      !crypto.timingSafeEqual(expectedSignature, receivedSignature)
    ) {
      throw new Error("Invalid payment signature.");
    }

    // 4. Confirm Razorpay reports this payment as captured.
    const rpPayment = await razorpay.payments.fetch(razorpay_payment_id);

    if (
      rpPayment.order_id !== razorpay_order_id ||
      Number(rpPayment.amount) !== Number(order.amount) ||
      rpPayment.currency !== order.currency ||
      rpPayment.status !== "captured"
    ) {
      throw new Error("Payment is not captured or payment details do not match.");
    }

    const amount = Number(rpPayment.amount) / 100;

    if (Math.round(amount * 100) !== Math.round(Number(intent.amount) * 100)) {
      throw new Error("Captured payment amount does not match the intent.");
    }

    // 5. Reuse an existing payment record on retries.
    let { data: paymentRecord, error: lookupError } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("transaction_id", razorpay_payment_id)
      .maybeSingle();

    if (lookupError) throw lookupError;

    if (paymentRecord) {
      if (
        String(paymentRecord.customer_id) !== String(customer_id) ||
        Math.round(Number(paymentRecord.amount) * 100) !== Math.round(amount * 100) ||
        paymentRecord.payment_status !== "Paid"
      ) {
        throw new Error("Existing payment record does not match this payment.");
      }

      if (paymentRecord.subscription_id) {
        const { data: subscription, error } = await supabaseAdmin
          .from("subscriptions")
          .select("*")
          .eq("id", paymentRecord.subscription_id)
          .eq("customer_id", customer_id)
          .maybeSingle();

        if (error) throw error;
        if (!subscription) throw new Error("Payment needs reconciliation.");

        return {
          data: {
            verified: true,
            alreadyProcessed: true,
            payment: paymentRecord,
            subscription,
          },
          error: null,
        };
      }
    } else {
      const { data, error } = await createPaymentService({
        order_id: null,
        subscription_id: null,
        customer_id,
        amount,
        payment_method: "ONLINE",
        transaction_id: razorpay_payment_id,
        payment_status: "Paid",
        paid_at: new Date().toISOString(),
      });

      if (error) {
        // A concurrent request may have inserted this transaction.
        const { data: retryRecord, error: retryError } = await supabaseAdmin
          .from("payments")
          .select("*")
          .eq("transaction_id", razorpay_payment_id)
          .maybeSingle();

        if (retryError) throw retryError;
        if (!retryRecord) throw error;

        paymentRecord = retryRecord;
      } else {
        paymentRecord = data;
      }
    }

    // 6. Create the subscription only after successful payment verification.
    // Pass the stored server-side payload, not the browser's amount.
    const payload = {
      ...intent.checkout_payload,
      customer_id,
      total_amount: amount,
      payment_method: "ONLINE",
      payment_status: "PAID",
      payment_reference: razorpay_payment_id,
      payment_amount: amount,
      payment_date: new Date().toISOString(),
    };

    const result = await createSubscriptionService(payload);

    if (result?.error || !result?.data?.id) {
      console.error("Subscription finalization failed:", result?.error);

      return {
        data: null,
        error: {
          message:
            "Payment was verified, but subscription creation needs attention. Do not pay again.",
        },
      };
    }

    // 7. Mark the intent complete.
    const { error: updateError } = await supabaseAdmin
      .from("payment_intents")
      .update({
        status: "COMPLETED",
        razorpay_payment_id,
        subscription_id: result.data.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", intent.id);

    if (updateError) {
      console.error("Payment succeeded but intent update failed:", updateError);
    }

    return {
      data: {
        verified: true,
        alreadyProcessed: false,
        payment: result.payment || {
          id: paymentRecord.id,
          payment_id: razorpay_payment_id,
          amount,
          status: "Paid",
        },
        subscription: result.data,
        billing: result.billing || null,
        message: "Payment verified and subscription created.",
      },
      error: null,
    };
  } catch (error) {
    console.error("Verify Payment Service Error:", error);

    return {
      data: null,
      error: { message: error.message || "Payment verification failed." },
    };
  }
}

