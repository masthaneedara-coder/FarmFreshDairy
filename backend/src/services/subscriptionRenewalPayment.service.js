import crypto from "crypto";
import Razorpay from "razorpay";
import { supabaseAdmin } from "../config/supabase.js";
import {
  getSubscriptionRenewalLinkService,
  markSubscriptionRenewalLinkUsedService,
} from "./subscriptionRenewalLink.service.js";
import {
  renewSubscriptionService,
} from "./subscription.service.js";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

function hashToken(token) {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
}

async function getValidRenewal(token) {
  if (!token || typeof token !== "string") {
    throw new Error("Renewal link is invalid.");
  }

  const result =
    await getSubscriptionRenewalLinkService(token);

  const subscription = result.subscription;

  const status = String(subscription.status || "")
    .trim()
    .toLowerCase();

  if (["stopped", "cancelled", "canceled"].includes(status)) {
    throw new Error("This subscription cannot be renewed.");
  }

  const amount = Number(subscription.total_amount);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Invalid renewal amount.");
  }

  return {
    subscription,
    amount: Number(amount.toFixed(2)),
    renewalKey: hashToken(token),
  };
}

export async function createRenewalOrderService(token) {
  const {
    subscription,
    amount,
    renewalKey,
  } = await getValidRenewal(token);

  // Reuse an existing unpaid order for this renewal.
  const { data: existing, error: lookupError } =
    await supabaseAdmin
      .from("payment_intents")
      .select("*")
      .eq("renewal_key", renewalKey)
      .maybeSingle();

  if (lookupError) throw lookupError;

  if (existing?.status === "PAID") {
    throw new Error("This renewal has already been paid.");
  }

  if (existing?.razorpay_order_id) {
    const existingOrder =
      await razorpay.orders.fetch(existing.razorpay_order_id);

    if (existingOrder.status === "created") {
      return {
        order: existingOrder,
        amount,
        currency: "INR",
      };
    }
  }

  const order = await razorpay.orders.create({
    amount: Math.round(amount * 100),
    currency: "INR",
    receipt: `renew_${subscription.id.slice(0, 20)}`,
    notes: {
      purpose: "subscription_renewal",
      subscription_id: subscription.id,
      renewal_key: renewalKey,
    },
  });

  const payload = {
    purpose: "subscription_renewal",
    renewal_key: renewalKey,
  };

  let intent;

  if (existing) {
    const { data, error } = await supabaseAdmin
      .from("payment_intents")
      .update({
        razorpay_order_id: order.id,
        amount,
        currency: "INR",
        checkout_payload: payload,
        status: "CREATED",
        subscription_id: subscription.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select()
      .single();

    if (error) throw error;
    intent = data;
  } else {
    const { data, error } = await supabaseAdmin
      .from("payment_intents")
      .insert({
        customer_id: subscription.customer_id,
        subscription_id: subscription.id,
        razorpay_order_id: order.id,
        amount,
        currency: "INR",
        checkout_payload: payload,
        renewal_key: renewalKey,
        status: "CREATED",
      })
      .select()
      .single();

    if (error) {
      // The unique index can reject concurrent requests.
      // Do not leave an untracked order available for payment.
      console.error(
        "Renewal intent insert failed; order may be orphaned:",
        order.id,
        error.message
      );
      throw new Error(
        "Unable to initialize renewal payment. Please retry."
      );
    }

    intent = data;
  }

  return {
    order,
    amount,
    currency: "INR",
    intent_id: intent.id,
  };
}
export async function verifyRenewalPaymentService({
  token,
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
}) {
  const {
    subscription,
    amount,
    renewalKey,
  } = await getValidRenewal(token);

  const { data: intent, error } = await supabaseAdmin
    .from("payment_intents")
    .select("*")
    .eq("razorpay_order_id", razorpay_order_id)
    .eq("renewal_key", renewalKey)
    .eq("subscription_id", subscription.id)
    .maybeSingle();

  if (error) throw error;
  if (!intent) throw new Error("Payment order not found.");

  // A retry must never create another billing record.
  if (intent.status === "PAID") {
    return {
      alreadyProcessed: true,
      subscription_id: subscription.id,
    };
  }

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  const provided = Buffer.from(razorpay_signature || "");
  const expected = Buffer.from(expectedSignature);

  if (
    provided.length !== expected.length ||
    !crypto.timingSafeEqual(provided, expected)
  ) {
    throw new Error("Payment signature is invalid.");
  }

  const order = await razorpay.orders.fetch(razorpay_order_id);
  const payment = await razorpay.payments.fetch(razorpay_payment_id);

  if (
    order.notes?.purpose !== "subscription_renewal" ||
    order.notes?.subscription_id !== subscription.id ||
    order.notes?.renewal_key !== renewalKey ||
    Number(order.amount) !== Math.round(amount * 100) ||
    order.currency !== "INR" ||
    payment.order_id !== razorpay_order_id ||
    Number(payment.amount) !== Math.round(amount * 100) ||
    payment.currency !== "INR" ||
    payment.status !== "captured"
  ) {
    throw new Error("Payment could not be verified as captured.");
  }

  /*
   * IMPORTANT:
   * Do not finalize here using a plain sequence of independent
   * database writes in production. See Step 4 for atomic finalization.
   */
  const { data: updatedIntent, error: updateError } =
    await supabaseAdmin
      .from("payment_intents")
      .update({
        razorpay_payment_id,
        status: "PAID",
        updated_at: new Date().toISOString(),
      })
      .eq("id", intent.id)
      .eq("status", "CREATED")
      .select()
      .maybeSingle();

  if (updateError) throw updateError;

  if (!updatedIntent) {
    throw new Error(
      "Payment is being processed. Please check your renewal status."
    );
  }

  return {
    verified: true,
    subscription_id: subscription.id,
    amount,
  };
}

export async function renewByCodService(token) {
  const {
    subscription,
    amount,
    renewalKey,
  } = await getValidRenewal(token);

  // COD uses a separate key from the online-payment intent.
  const { data: existing, error: lookupError } =
    await supabaseAdmin
      .from("payment_intents")
      .select("id,status")
      .eq("renewal_key", `cod:${renewalKey}`)
      .maybeSingle();

  if (lookupError) throw lookupError;

  if (existing) {
    throw new Error("This renewal has already been submitted.");
  }

  /*
   * The COD finalization must also be atomic and idempotent.
   * Do not deploy this placeholder sequence as a production-safe
   * renewal until Step 4 is completed.
   */
  const { error: intentError } = await supabaseAdmin
    .from("payment_intents")
    .insert({
      customer_id: subscription.customer_id,
      subscription_id: subscription.id,
      amount,
      currency: "INR",
      checkout_payload: {
        purpose: "subscription_renewal",
        payment_method: "COD",
        renewal_key: renewalKey,
      },
      renewal_key: `cod:${renewalKey}`,
      status: "CREATED",
    });

  if (intentError) throw intentError;

  return {
    subscription_id: subscription.id,
    amount,
    payment_method: "COD",
    payment_status: "Pending",
  };
}