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

async function getValidRenewal(token, { allowUsed = false } = {}) {
  if (!token || typeof token !== "string") {
    throw new Error("Renewal link is invalid.");
  }

  const result = await getSubscriptionRenewalLinkService(
    token,
    { allowUsed }
  );

  const subscription = result.subscription;
  const linkId = result.linkId;

  if (!linkId) {
    throw new Error("Renewal link ID is missing.");
  }

  const status = String(subscription.status || "")
    .trim()
    .toLowerCase();

  if (
    ["stopped", "cancelled", "canceled"].includes(status) ||
    (status === "renewed" && !allowUsed)
  ) {
    throw new Error("This subscription cannot be renewed.");
  }

  const amount = Number(subscription.total_amount);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Invalid renewal amount.");
  }

  return {
    subscription,
    amount: Number(amount.toFixed(2)),
    renewalKey: linkId,
    linkId,
    usedAt: result.usedAt,
  };
}

export async function createRenewalOrderService(token) {
  const {
    subscription,
    amount,
    renewalKey,
 } = await getValidRenewal(token);

  // Generate a unique token for this request.
  const lockToken = crypto.randomUUID();
  let lockAcquired = false;

  try {
    // 1. Acquire the database lock.
    const { data: lockResult, error: lockError } =
      await supabaseAdmin.rpc("acquire_renewal_order_lock", {
        p_renewal_key: renewalKey,
        p_lock_token: lockToken,
        p_lock_seconds: 300,
      });

    if (lockError) throw lockError;

    lockAcquired = lockResult === true;

    if (!lockAcquired) {
      throw new Error(
        "Another renewal request is being processed. Please wait and try again."
      );
    }

    // 2. Find the existing payment intent.
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

    // 3. Inspect the existing Razorpay order.
    if (existing?.razorpay_order_id) {
      const existingOrder = await razorpay.orders.fetch(
        existing.razorpay_order_id
      );

      const payments = await razorpay.orders.fetchPayments(
        existing.razorpay_order_id
      );

      const paymentItems = payments.items || [];

      const capturedPayment = paymentItems.find(
        (payment) => payment.status === "captured"
      );

      if (capturedPayment || existingOrder.status === "paid") {
        throw new Error(
          "A payment may already be captured. Verify the renewal status before attempting another payment."
        );
      }

      const unresolvedPayment = paymentItems.find(
        (payment) =>
          ["authorized", "created"].includes(payment.status)
      );

      if (unresolvedPayment) {
        throw new Error(
          "A payment attempt is still pending. Please wait for confirmation before retrying."
        );
      }
       // Do not retry while a payment is authorized or still processing.
  const pendingPayment = paymentItems.find(
    (payment) =>
      ["created", "authorized"].includes(payment.status)
  );

  if (pendingPayment) {
    throw new Error(
      "A payment attempt is still pending. Please wait for confirmation."
    );
  }

  // Determine whether every recorded attempt has failed.
  const allAttemptsFailed =
    paymentItems.length > 0 &&
    paymentItems.every(
      (payment) => payment.status === "failed"
    );

  if (allAttemptsFailed) {
    const { error: updateError } = await supabaseAdmin
      .from("payment_intents")
      .update({
        status: "FAILED",
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .eq("status", "CREATED");

    if (updateError) {
      console.error(
        "Unable to update failed renewal payment:",
        updateError.message
      );

      throw new Error(
        "Payment failure could not be recorded. Please try again later."
      );
    }

    existing.status = "FAILED";
  }
// Reuse an order that has not yet had a payment attempt.
  if (
    existingOrder.status === "created" &&
    !allAttemptsFailed
  ) {
    return {
      order: existingOrder,
      amount,
      currency: "INR",
      intent_id: existing.id,
    };
  }

      // A failed attempt can be replaced with a new order.
        if (
          existingOrder.status !== "attempted" &&
          !allAttemptsFailed
        ) {
          throw new Error(
            `Razorpay order status is ${existingOrder.status}. Manual verification is required.`
          );
        }
    }

    // 4. Create a new Razorpay order.
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
      flow: "SUBSCRIPTION_RENEWAL",
      renewal_link_id: renewalKey,
    };

    // 5. Save the new order against the existing intent.
    if (existing) {
      const { data: intent, error } = await supabaseAdmin
        .from("payment_intents")
        .update({
          razorpay_order_id: order.id,
          amount,
          currency: "INR",
          checkout_payload: payload,
          status: "CREATED",
          subscription_id: subscription.id,
          razorpay_payment_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .eq("status", existing.status)
        .select()
        .single();

      if (error) {
        console.error(
          "Unable to update renewal payment intent:",
          error
        );

        throw new Error(
          "The Razorpay order was created but could not be saved. Contact support before retrying."
        );
      }

      return {
        order,
        amount,
        currency: "INR",
        intent_id: intent.id,
      };
    }

    // 6. Create a new payment intent.
    const { data: intent, error: insertError } =
      await supabaseAdmin
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

    if (insertError) {
      console.error(
        "Renewal payment intent insert failed:",
        order.id,
        insertError.message
      );

      throw new Error(
        "The Razorpay order was created but could not be saved. Contact support before retrying."
      );
    }

    return {
      order,
      amount,
      currency: "INR",
      intent_id: intent.id,
    };
  } finally {
    // 7. Release only the lock owned by this request.
    if (lockAcquired) {
      const { data: released, error: releaseError } =
        await supabaseAdmin.rpc("release_renewal_order_lock", {
          p_renewal_key: renewalKey,
          p_lock_token: lockToken,
        });

      if (releaseError || released !== true) {
        console.error(
          "Renewal order lock release warning:",
          releaseError || "Lock was not released."
        );
      }
    }
  }
}


export async function verifyRenewalPaymentService({
  token,
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
}) {
  // Allow inspection of an already-used link for retry verification.
  const {
    subscription,
    amount,
    linkId,
  } = await getValidRenewal(token, { allowUsed: true });

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw new Error("Payment verification details are missing.");
  }

  // 1. Find payment intent using renewal link ID.
  // Do not filter by subscription_id because SQL changes it after renewal.
  const { data: intent, error: intentError } = await supabaseAdmin
    .from("payment_intents")
    .select("*")
    .eq("razorpay_order_id", razorpay_order_id)
    .eq("renewal_key", linkId)
    .maybeSingle();

  if (intentError) throw intentError;

  if (!intent) {
    throw new Error("Payment order not found.");
  }

  // 2. Check whether a renewal billing record already exists.
  const { data: billing, error: billingError } = await supabaseAdmin
    .from("billing")
    .select("*")
    .eq("renewal_key", linkId)
    .eq("invoice_type", "Subscription Renewal")
    .maybeSingle();

  if (billingError) throw billingError;

  // 3. If billing exists, verify that it belongs to this payment.
  if (billing) {
  const samePayment =
  billing.payment_method === "ONLINE" &&
  String(billing.payment_status).toLowerCase() === "paid" &&
  billing.payment_reference === razorpay_payment_id &&
  intent.razorpay_payment_id === razorpay_payment_id &&
  String(intent.status).toUpperCase() === "PAID" &&
  String(intent.customer_id) === String(subscription.customer_id) &&
  Math.round(Number(billing.total_amount ?? billing.amount) * 100) ===
    Math.round(Number(intent.amount) * 100);

    if (!samePayment) {
      throw new Error(
        "Renewal billing exists, but payment details do not match. Please contact support."
      );
    }

    return {
      verified: true,
      alreadyProcessed: true,
      old_subscription_id: subscription.id,
      subscription_id: billing.subscription_id,
      amount: Number(billing.total_amount ?? billing.amount),
      payment_status: billing.payment_status,
      message: "This renewal payment was already processed successfully.",
    };
  }

  // A PAID intent without its renewal billing record needs reconciliation.
  if (String(intent.status).toUpperCase() === "PAID") {
    throw new Error(
      "Payment is marked as paid, but the renewal record is missing. Do not pay again; reconciliation is required."
    );
  }

  if (String(intent.status).toUpperCase() !== "CREATED") {
    throw new Error(
      "Payment intent is not available for verification."
    );
  }
  // Validate payment intent against the subscription.
if (
  String(intent.customer_id) !== String(subscription.customer_id) ||
  Math.round(Number(intent.amount) * 100) !==
    Math.round(Number(amount) * 100) ||
  String(intent.currency).toUpperCase() !== "INR"
) {
  throw new Error(
    "Payment intent does not match the subscription details."
  );
}

 // 4. Verify Razorpay signature.
const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;

if (!razorpaySecret) {
  throw new Error("Razorpay secret is not configured.");
}

if (!/^[a-fA-F0-9]{64}$/.test(razorpay_signature)) {
  throw new Error("Invalid Razorpay signature format.");
}

const expectedSignature = crypto
  .createHmac("sha256", razorpaySecret)
  .update(`${razorpay_order_id}|${razorpay_payment_id}`)
  .digest("hex");

  const provided = Buffer.from(razorpay_signature, "utf8");
  const expected = Buffer.from(expectedSignature, "utf8");

  if (
    provided.length !== expected.length ||
    !crypto.timingSafeEqual(provided, expected)
  ) {
    throw new Error("Payment signature is invalid.");
  }

  // 5. Verify payment directly with Razorpay.
  const order = await razorpay.orders.fetch(razorpay_order_id);
  const payment = await razorpay.payments.fetch(razorpay_payment_id);

  if (
  order.id !== intent.razorpay_order_id ||
  payment.id !== razorpay_payment_id ||
  order.notes?.purpose !== "subscription_renewal" ||
  order.notes?.subscription_id !== subscription.id ||
  order.notes?.renewal_key !== linkId ||
  Number(order.amount) !== Math.round(amount * 100) ||
  order.currency !== "INR" ||
  payment.order_id !== razorpay_order_id ||
  Number(payment.amount) !== Math.round(amount * 100) ||
  payment.currency !== "INR" ||
  payment.status !== "captured"
) {
  throw new Error("Payment could not be verified as captured.");
}

  // 6. Finalize renewal inside the database transaction.
  const { data: result, error: finalizeError } =
    await supabaseAdmin.rpc("finalize_subscription_renewal", {
      p_link_id: linkId,
      p_renewal_key: linkId,
      p_payment_method: "ONLINE",
      p_payment_reference: razorpay_payment_id,
      p_payment_intent_id: intent.id,
    });

  if (finalizeError) {
    console.error(
      "Renewal finalization failed after captured payment:",
      finalizeError.message,
      {
        paymentIntentId: intent.id,
        razorpayPaymentId: razorpay_payment_id,
        renewalLinkId: linkId,
      }
    );

    throw new Error(
      "Payment was captured, but renewal finalization needs reconciliation. Do not pay again."
    );
  }

  const renewal = Array.isArray(result) ? result[0] : result;

  if (!renewal || renewal.success !== true) {
    throw new Error(
      "Payment was captured, but renewal was not confirmed. Do not pay again."
    );
  }

  // 7. Return confirmed renewal details.
  return {
    verified: true,
    alreadyProcessed: renewal.alreadyFinalized === true,
    old_subscription_id: renewal.oldSubscriptionId ?? subscription.id,
    subscription_id: renewal.subscriptionId,
    start_date: renewal.startDate,
    end_date: renewal.endDate,
    amount: renewal.amount,
    payment_status: renewal.paymentStatus,
    message: renewal.alreadyFinalized
      ? "This renewal payment was already processed successfully."
      : "Payment verified and renewal finalized successfully.",
  };
}

export async function renewByCodService(token) {
  const {
    subscription,
    amount,
    renewalKey,
  } = await getValidRenewal(token);

  // 1. Check all online payment attempts for this renewal.
  const { data: onlineIntents, error: lookupError } =
    await supabaseAdmin
      .from("payment_intents")
      .select("id,status,razorpay_order_id,razorpay_payment_id")
      .eq("renewal_key", renewalKey);

  if (lookupError) throw lookupError;

  for (const intent of onlineIntents || []) {
    const status = String(intent.status).toUpperCase();

    if (status === "PAID" || intent.razorpay_payment_id) {
      throw new Error(
        "Online payment has already been recorded. COD is unavailable."
      );
    }

    if (!intent.razorpay_order_id) {
      if (!["CANCELLED", "FAILED"].includes(status)) {
        throw new Error(
          "Online payment status is not confirmed. Please try again later."
        );
      }
      continue;
    }

    const order = await razorpay.orders.fetch(
      intent.razorpay_order_id
    );

    const payments = await razorpay.orders.fetchPayments(
      intent.razorpay_order_id
    );

    const paymentItems = payments.items || [];

    if (
      order.status === "paid" ||
      paymentItems.some((payment) => payment.status === "captured")
    ) {
      throw new Error(
        "Razorpay reports a successful payment. COD is unavailable."
      );
    }

    if (
      paymentItems.some((payment) =>
        ["created", "authorized"].includes(payment.status)
      )
    ) {
      throw new Error(
        "An online payment attempt is still pending. Please wait before choosing COD."
      );
    }

    // Only confirmed failed or cancelled attempts can proceed.
   if (status !== "FAILED" && status !== "CANCELLED") {
  throw new Error(
    "Online payment is not confirmed as failed or cancelled. COD is unavailable."
  );
}
  }

  // 2. Finalize COD renewal atomically in the database.
  const { data: result, error: finalizeError } =
    await supabaseAdmin.rpc("finalize_subscription_renewal", {
      p_link_id: renewalKey,
      p_renewal_key: renewalKey,
      p_payment_method: "COD",
      p_payment_reference: null,
      p_payment_intent_id: null,
    });

  if (finalizeError) {
    console.error(
      "COD renewal finalization failed:",
      finalizeError.message,
      { renewalKey, subscriptionId: subscription.id }
    );

    throw new Error(
      "COD renewal could not be finalized. Please check the renewal status before retrying."
    );
  }

  const renewal = Array.isArray(result) ? result[0] : result;

  if (!renewal || renewal.success !== true) {
    throw new Error("COD renewal was not confirmed.");
  }

  return {
    subscription_id: renewal.subscriptionId,
    old_subscription_id: renewal.oldSubscriptionId ?? subscription.id,
    amount: renewal.amount ?? amount,
    payment_method: "COD",
    payment_status: "Pending",
    start_date: renewal.startDate,
    end_date: renewal.endDate,
    already_processed: renewal.alreadyFinalized === true,
    message: renewal.alreadyFinalized
      ? "This COD renewal was already processed."
      : "COD renewal completed successfully.",
  };
}
