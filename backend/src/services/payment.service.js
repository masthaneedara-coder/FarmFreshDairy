
import crypto from "crypto";
import razorpay from "../config/razorpay.js";
import { supabaseAdmin } from "../config/supabase.js";
import { creditWallet } from "./wallet.service.js";

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
  // Never credit a payment associated with another customer/subscription.
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

  // Ensure the saved record matches the verified Razorpay payment.
  if (
    existingPayment.payment_status !== "Paid" ||
    Math.round(Number(existingPayment.amount) * 100) !==
      Math.round(paymentAmount * 100)
  ) {
    return {
      data: null,
      error: {
        message: "Saved payment details do not match the verified payment.",
      },
    };
  }

  // Safe to retry: wallet_credit checks the PaymentRecord reference.
  await creditVerifiedPaymentToWallet({
    customerId: customer_id,
    paymentRecordId: existingPayment.id,
    amount: Number(existingPayment.amount),
    razorpayPaymentId: existingPayment.transaction_id,
  });

  // Repair subscription payment details if a previous attempt failed.
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
          "Payment is saved and wallet credit was checked, but subscription status needs reconciliation. Retry verification; do not pay again.",
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
      message: "Payment verified, wallet credit checked, and subscription status confirmed.",
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
    await creditVerifiedPaymentToWallet({
  customerId: customer_id,
  paymentRecordId: payment.id,
  amount: paymentAmount,
  razorpayPaymentId: razorpay_payment_id,
});

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
