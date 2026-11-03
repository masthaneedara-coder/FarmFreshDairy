
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
      throw new Error("Payment details and customer ID are required.");
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;

    if (!secret) {
      throw new Error("Razorpay secret key is not configured.");
    }

    // 1. Find the payment intent.
    let query = supabaseAdmin
      .from("payment_intents")
      .select("*")
      .eq("razorpay_order_id", razorpay_order_id)
      .eq("customer_id", customer_id);

    if (intent_id) {
      query = query.eq("id", intent_id);
    }

    const { data: intent, error: intentError } =
      await query.maybeSingle();

    if (intentError) throw intentError;
    if (!intent) throw new Error("Payment intent not found.");

    const isRenewal =
      intent.checkout_payload?.flow === "SUBSCRIPTION_RENEWAL";

    // 2. Verify Razorpay order and customer.
    const order = await razorpay.orders.fetch(razorpay_order_id);

    if (
      String(order.notes?.customer_id) !== String(customer_id) ||
      String(order.notes?.payment_intent_id) !== String(intent.id)
    ) {
      throw new Error("Razorpay order does not match this payment.");
    }

    if (
      Number(order.amount) !== Math.round(Number(intent.amount) * 100) ||
      order.currency !== intent.currency
    ) {
      throw new Error("Razorpay order amount or currency mismatch.");
    }

    // 3. Verify signature.
    if (!/^[a-fA-F0-9]{64}$/.test(razorpay_signature)) {
      throw new Error("Invalid payment signature format.");
    }

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

    // 4. Confirm captured payment.
    const rpPayment = await razorpay.payments.fetch(razorpay_payment_id);

    if (
      rpPayment.order_id !== razorpay_order_id ||
      Number(rpPayment.amount) !== Number(order.amount) ||
      rpPayment.currency !== order.currency ||
      rpPayment.status !== "captured"
    ) {
      throw new Error("Payment is not captured or details do not match.");
    }

    const amount = Number(rpPayment.amount) / 100;

    if (
      Math.round(amount * 100) !==
      Math.round(Number(intent.amount) * 100)
    ) {
      throw new Error("Captured payment amount does not match intent.");
    }

    // 5. Find or create payment record.
    let { data: paymentRecord, error: lookupError } =
      await supabaseAdmin
        .from("payments")
        .select("*")
        .eq("transaction_id", razorpay_payment_id)
        .maybeSingle();

    if (lookupError) throw lookupError;

    if (paymentRecord) {
      if (
        String(paymentRecord.customer_id) !== String(customer_id) ||
        Math.round(Number(paymentRecord.amount) * 100) !==
          Math.round(amount * 100) ||
        paymentRecord.payment_status !== "Paid"
      ) {
        throw new Error("Existing payment record does not match payment.");
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
        const { data: retryRecord, error: retryError } =
          await supabaseAdmin
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

      if (
        String(paymentRecord.customer_id) !== String(customer_id) ||
        Math.round(Number(paymentRecord.amount) * 100) !==
          Math.round(amount * 100) ||
        paymentRecord.payment_status !== "Paid"
      ) {
        throw new Error("Payment record validation failed.");
      }
    }

    if (!paymentRecord?.id) {
      throw new Error("Payment record ID is missing.");
    }

    // 6. Renewal flow.
    if (isRenewal) {
      const renewalKey = intent.renewal_key;
      const linkId = intent.checkout_payload?.renewal_link_id;

      if (!renewalKey || !linkId) {
        throw new Error(
          "Renewal details are missing. Please contact support. Do not pay again."
        );
      }

      const { data: renewal, error: renewalError } =
        await supabaseAdmin.rpc("finalize_subscription_renewal", {
          p_link_id: linkId,
          p_renewal_key: renewalKey,
          p_payment_method: "ONLINE",
          p_payment_reference: razorpay_payment_id,
          p_payment_intent_id: intent.id,
        });

      if (renewalError) {
        console.error("Renewal finalization error:", renewalError);
        throw new Error(
          "Payment verified, but renewal needs reconciliation. Do not pay again."
        );
      }
      if (renewal?.success !== true) {
        throw new Error(
          "Payment verified, but renewal was not confirmed. Do not pay again."
        );
      }

      // 7. Credit wallet after renewal is finalized.
      // const wallet = await creditVerifiedPaymentToWallet({
      //   customerId: customer_id,
      //   paymentRecordId: paymentRecord.id,
      //   amount,
      //   razorpayPaymentId: razorpay_payment_id,
      // });

     return {
        data: {
          verified: true,
          alreadyProcessed: Boolean(renewal?.alreadyFinalized),
          payment: paymentRecord,
          renewal,
          message: "Payment verified, renewal finalized and wallet credited.",
        },
        error: null,
      };
    }

    // 8. New subscription flow.
    let subscription = null;

    // Reuse subscription if this payment was already associated.
    const existingSubscriptionId =
      intent.subscription_id || paymentRecord.subscription_id;

    if (existingSubscriptionId) {
      const { data, error } = await supabaseAdmin
        .from("subscriptions")
        .select("*")
        .eq("id", existingSubscriptionId)
        .eq("customer_id", customer_id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        throw new Error(
          "Payment is recorded, but its subscription needs reconciliation. Do not pay again."
        );
      }

      subscription = data;
    } else {
      // Create subscription from trusted server-side checkout details.
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
        console.error("Subscription creation error:", result?.error);

        throw new Error(
          "Payment verified, but subscription creation needs reconciliation. Do not pay again."
        );
      }

      subscription = result.data;
    }
    // 8.1 Finalize subscription and billing after Razorpay payment is verified.
const paidAt = new Date().toISOString();

const { data: finalizedSubscription, error: finalizeError } =
  await supabaseAdmin
    .from("subscriptions")
    .update({
      status: "Active",
      payment_status: "Paid",
      payment_method: "ONLINE",
      payment_date: paidAt,
      payment_reference: razorpay_payment_id,
      payment_amount: amount,
      is_paused: false,
      pause_from: null,
      pause_to: null,
      paused_days: 0,
      updated_at: paidAt,
    })
    .eq("id", subscription.id)
    .eq("customer_id", customer_id)
    .select()
    .single();

if (finalizeError || !finalizedSubscription) {
  console.error("Subscription finalization error:", finalizeError);
  throw new Error(
    "Payment verified, but subscription finalization needs reconciliation. Do not pay again."
  );
}

subscription = finalizedSubscription;

// Update the associated billing invoice.
const { data: finalizedBilling, error: billingError } =
  await supabaseAdmin
    .from("billing")
    .update({
      payment_status: "Paid",
      payment_method: "ONLINE",
      payment_reference: razorpay_payment_id,
    })
    .eq("subscription_id", subscription.id)
    .eq("customer_id", customer_id)
    .select("id, invoice_number, payment_status, payment_reference");

if (billingError || !finalizedBilling?.length) {
  console.error("Billing finalization error:", billingError);
  throw new Error(
    "Payment verified, but invoice finalization needs reconciliation. Do not pay again."
  );
}

    // 9. Persist subscription association before wallet credit.
    const { error: intentUpdateError } = await supabaseAdmin
      .from("payment_intents")
      .update({
        status: "PAID",
        razorpay_payment_id,
        subscription_id: subscription.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", intent.id);

    if (intentUpdateError) {
      console.error("Payment intent update error:", intentUpdateError);
      throw new Error(
        "Subscription exists, but payment association needs reconciliation. Do not pay again."
      );
    }

    const { data: updatedPayment, error: paymentUpdateError } =
      await supabaseAdmin
        .from("payments")
        .update({
          subscription_id: subscription.id,
        })
        .eq("id", paymentRecord.id)
        .select()
        .single();

    if (paymentUpdateError) {
      console.error("Payment association error:", paymentUpdateError);
      throw new Error(
        "Subscription exists, but payment association needs reconciliation. Do not pay again."
      );
    }

    // 10. Credit wallet only after subscription is confirmed.
    const wallet = await creditVerifiedPaymentToWallet({
      customerId: customer_id,
      paymentRecordId: paymentRecord.id,
      amount,
      razorpayPaymentId: razorpay_payment_id,
    });

    return {
      data: {
        verified: true,
        alreadyProcessed: Boolean(existingSubscriptionId),
        payment: updatedPayment,
        subscription,
        wallet,
        message: "Payment verified, subscription created and wallet credited.",
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


