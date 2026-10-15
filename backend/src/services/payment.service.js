
import crypto from "crypto";
import razorpay from "../config/razorpay.js";
import { supabaseAdmin } from "../config/supabase.js";

/* ==========================================================
   Create Razorpay Order
========================================================== */

export async function createOrderService({
  amount,
  customer_id,
  subscription_id,
}) {
  try {
    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return {
        data: null,
        error: { message: "Valid amount is required." },
      };
    }

    if (!customer_id || !subscription_id) {
      return {
        data: null,
        error: {
          message: "Customer ID and Subscription ID are required.",
        },
      };
    }

    // Validate that this subscription belongs to this customer.
    const { data: subscription, error: subscriptionError } =
      await supabaseAdmin
        .from("subscriptions")
        .select("id, customer_id, total_amount, payment_status")
        .eq("id", subscription_id)
        .eq("customer_id", customer_id)
        .maybeSingle();

    if (subscriptionError) throw subscriptionError;

    if (!subscription) {
      return {
        data: null,
        error: {
          message: "Subscription not found for this customer.",
        },
      };
    }

    // Do not allow a client to request a different payment amount.
    if (
      Math.round(Number(subscription.total_amount) * 100) !==
      Math.round(numericAmount * 100)
    ) {
      return {
        data: null,
        error: {
          message: "Payment amount does not match the subscription amount.",
        },
      };
    }

    const order = await razorpay.orders.create({
      amount: Math.round(numericAmount * 100),
      currency: "INR",
      receipt: `SUB_${String(subscription_id).slice(0, 20)}_${Date.now()}`,
      notes: {
        customer_id: String(customer_id),
        subscription_id: String(subscription_id),
      },
    });

    return { data: order, error: null };
  } catch (error) {
    console.error("Razorpay Create Order Error:", error);

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
  subscription_id,
}) {
  try {
    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return {
        data: null,
        error: {
          message: "Razorpay payment verification details are required.",
        },
      };
    }

    if (!customer_id || !subscription_id) {
      return {
        data: null,
        error: {
          message: "Customer ID and Subscription ID are required.",
        },
      };
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;

    if (!secret) {
      throw new Error("Razorpay secret key is not configured.");
    }

    // 1. Validate subscription ownership.
    const { data: subscription, error: subscriptionError } =
      await supabaseAdmin
        .from("subscriptions")
        .select("id, customer_id, total_amount")
        .eq("id", subscription_id)
        .eq("customer_id", customer_id)
        .maybeSingle();

    if (subscriptionError) throw subscriptionError;

    if (!subscription) {
      return {
        data: null,
        error: {
          message: "Subscription not found for this customer.",
        },
      };
    }

    // 2. Fetch and validate the Razorpay order.
    const order = await razorpay.orders.fetch(razorpay_order_id);

    if (!order) {
      return {
        data: null,
        error: { message: "Razorpay order not found." },
      };
    }

    if (
      String(order.notes?.customer_id) !== String(customer_id) ||
      String(order.notes?.subscription_id) !== String(subscription_id)
    ) {
      return {
        data: null,
        error: {
          message: "Razorpay order does not match this customer and subscription.",
        },
      };
    }

    if (
      Number(order.amount) !==
      Math.round(Number(subscription.total_amount) * 100)
    ) {
      return {
        data: null,
        error: {
          message: "Razorpay order amount does not match the subscription.",
        },
      };
    }

    // 3. Verify Razorpay signature using constant-time comparison.
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest();

    let receivedSignature;

    try {
      receivedSignature = Buffer.from(razorpay_signature, "hex");
    } catch {
      receivedSignature = Buffer.alloc(0);
    }

    if (
      receivedSignature.length !== expectedSignature.length ||
      !crypto.timingSafeEqual(expectedSignature, receivedSignature)
    ) {
      return {
        data: null,
        error: { message: "Invalid payment signature." },
      };
    }

    // 4. Fetch payment and confirm it belongs to this order.
    const razorpayPayment =
      await razorpay.payments.fetch(razorpay_payment_id);

    if (razorpayPayment.order_id !== razorpay_order_id) {
      return {
        data: null,
        error: {
          message: "Payment does not belong to this Razorpay order.",
        },
      };
    }

    if (
      Number(razorpayPayment.amount) !== Number(order.amount) ||
      razorpayPayment.currency !== order.currency
    ) {
      return {
        data: null,
        error: { message: "Payment amount or currency does not match." },
      };
    }

    if (razorpayPayment.status !== "captured") {
      return {
        data: null,
        error: {
          message: `Payment is not captured. Current status: ${razorpayPayment.status}`,
        },
      };
    }

    const paymentAmount = Number(razorpayPayment.amount) / 100;

    // 5. Idempotency check: do not insert the same payment twice.
    const { data: existingPayment, error: lookupError } =
      await supabaseAdmin
        .from("payments")
        .select("*")
        .eq("transaction_id", razorpay_payment_id)
        .maybeSingle();

    if (lookupError) throw lookupError;

if (existingPayment) {
  if (
    String(existingPayment.customer_id) !== String(customer_id) ||
    String(existingPayment.subscription_id) !== String(subscription_id)
  ) {
    return {
      data: null,
      error: {
        message: "This payment is already associated with another record.",
      },
    };
  }

  // Repair subscription payment details if a previous attempt
  // saved the payment but failed to update the subscription.
  
const { data: updatedSubscription, error: updateError } =
  await supabaseAdmin
    .from("subscriptions")
    .update({
      payment_status: "Paid",
      payment_reference: razorpay_payment_id,
      payment_amount: paymentAmount,
      payment_date: new Date().toISOString(),
    })
    .eq("id", subscription_id)
    .eq("customer_id", customer_id)
    .select("id")
    .maybeSingle();

if (updateError || !updatedSubscription) {
  console.error(
    "Payment saved but subscription update failed:",
    updateError || "No matching subscription row"
  );

  return {
    data: null,
    error: {
      message:
        "Payment was saved, but subscription status needs reconciliation. Retry verification to repair it.",
    },
  };
}


  return {
    data: {
      verified: true,
      alreadyProcessed: true,
      payment: {
        id: existingPayment.id,
        payment_id: existingPayment.transaction_id,
        order_id: razorpay_order_id,
        amount: Number(existingPayment.amount),
        status: existingPayment.payment_status,
      },
      message: "Payment verified and subscription status confirmed.",
    },
    error: null,
  };
}


    // 6. Save verified payment linked to the real subscription.
    const { data: payment, error: paymentError } =
      await createPaymentService({
        subscription_id,
        customer_id,
        amount: paymentAmount,
        payment_method: "ONLINE",
        transaction_id: razorpay_payment_id,
        payment_status: "Paid",
        paid_at: new Date().toISOString(),
      });

    if (paymentError || !payment) {
      console.error("Payment insert error:", paymentError);
      return {
        data: null,
        error: { message: "Unable to save verified payment." },
      };
    }

    // 7. Update payment details on the subscription.
    const { error: updateError } = await supabaseAdmin
      .from("subscriptions")
      .update({
        payment_status: "Paid",
        payment_reference: razorpay_payment_id,
        payment_amount: paymentAmount,
        payment_date: new Date().toISOString(),
      })
      .eq("id", subscription_id)
      .eq("customer_id", customer_id);

    if (updateError) {
      // Payment was saved, so do not pretend the entire operation failed
      // without logging the partial result for reconciliation.
      console.error(
        "Payment saved but subscription payment status update failed:",
        updateError
      );

      return {
        data: null,
        error: {
          message:
            "Payment was verified and saved, but subscription status update failed. Reconcile this payment before retrying.",
        },
      };
    }

    return {
      data: {
        verified: true,
        alreadyProcessed: false,
        payment: {
          id: payment.id,
          payment_id: razorpay_payment_id,
          order_id: razorpay_order_id,
          amount: paymentAmount,
          status: "Paid",
        },
        message: "Payment verified successfully.",
      },
      error: null,
    };
  } catch (error) {
    console.error("Verify Payment Service Error:", error);

    return {
      data: null,
      error: {
        message: error.message || "Payment verification failed.",
      },
    };
  }
}
