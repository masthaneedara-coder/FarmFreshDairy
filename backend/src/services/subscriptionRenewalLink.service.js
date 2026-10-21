import crypto from "crypto";
import { supabaseAdmin } from "../config/supabase.js";

const FRONTEND_URL =
  process.env.FRONTEND_URL ||
  "https://farm-fresh-dairy.vercel.app";

const TOKEN_EXPIRY_DAYS = 7;

function hashToken(token) {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
}

/* ==========================================================
   CREATE RENEWAL LINK
========================================================== */

export async function createSubscriptionRenewalLinkService(subscriptionId) {

  // ========================================================
  // 1. GET SUBSCRIPTION
  // ========================================================

  const { data: subscription, error: subscriptionError } =
    await supabaseAdmin
      .from("subscriptions")
      .select(`
        *,
        subscription_items(
          quantity,
          size,
          products(
            id,
            name
          )
        )
      `)
      .eq("id", subscriptionId)
      .single();

  if (subscriptionError) {
    throw subscriptionError;
  }

  if (!subscription) {
    throw new Error("Subscription not found.");
  }

  // ========================================================
  // 2. PREVENT STOPPED/CANCELLED SUBSCRIPTIONS
  // ========================================================

  const status =
    String(subscription.status || "")
      .trim()
      .toLowerCase();

  if (
    status === "stopped" ||
    status === "cancelled" ||
    status === "canceled"
  ) {
    throw new Error(
      "This subscription cannot be renewed."
    );
  }

 
  // ========================================================
  // 3. CHECK EXISTING RENEWAL LINKS AND PAYMENT INTENTS
  // ========================================================

  const now = new Date().toISOString();

  const {
    data: existingLinks,
    error: existingLinksError,
  } = await supabaseAdmin
    .from("subscription_renewal_links")
    .select("id, expires_at, used_at, created_at")
    .eq("subscription_id", subscriptionId)
    .is("used_at", null)
    .gt("expires_at", now)
    .order("created_at", { ascending: false })
    .limit(1);

  if (existingLinksError) {
    throw existingLinksError;
  }

  if (existingLinks?.length) {
    const existingLink = existingLinks[0];

    // Check whether a Razorpay payment intent already exists
    // for this renewal link.
    const {
      data: existingIntent,
      error: intentError,
    } = await supabaseAdmin
      .from("payment_intents")
      .select("id, status, razorpay_order_id, razorpay_payment_id")
      .eq("renewal_key", existingLink.id)
      .maybeSingle();

    if (intentError) {
      throw intentError;
    }

    if (existingIntent) {
      // Never invalidate a link that has a payment intent.
      // Its original token cannot be recovered from token_hash.
      throw new Error(
        "An existing renewal link has a payment record. " +
        "Do not create another link or payment order until " +
        "the existing renewal is reconciled."
      );
    }

    // No payment intent exists. Invalidate the old link so
    // a fresh token and usable URL can be generated below.
    const {
      error: invalidateError,
    } = await supabaseAdmin
      .from("subscription_renewal_links")
      .update({ used_at: now })
      .eq("id", existingLink.id)
      .is("used_at", null);

    if (invalidateError) {
      throw invalidateError;
    }
  }

  // ========================================================
  // 4. GENERATE NEW SECURE TOKEN
  // ========================================================

  const token =
    crypto.randomBytes(32).toString("hex");

  const tokenHash =
    hashToken(token);

  // ========================================================
  // 5. TOKEN EXPIRY
  // ========================================================

  const expiresAt = new Date();

  expiresAt.setDate(
    expiresAt.getDate() + TOKEN_EXPIRY_DAYS
  );

  // ========================================================
  // 6. SAVE NEW LINK
  // ========================================================

  const { data: renewalLink, error: linkError } =
    await supabaseAdmin
      .from("subscription_renewal_links")
      .insert({
        subscription_id: subscriptionId,
        token_hash: tokenHash,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

  if (linkError) {
    throw linkError;
  }

  // ========================================================
  // 7. CREATE URL
  // ========================================================

  const renewalUrl =
    `${FRONTEND_URL}/renew/${token}`;

  return {
    id: renewalLink.id,
    subscriptionId,
    renewalUrl,
    expiresAt: renewalLink.expires_at,
  };
}

/* ==========================================================
   GET RENEWAL LINK DETAILS
========================================================== */

export async function getSubscriptionRenewalLinkService(
  token
) {
  if (!token) {
    throw new Error("Renewal token is required.");
  }

  const tokenHash = hashToken(token);

  const {
    data: link,
    error: linkError,
  } = await supabaseAdmin
    .from("subscription_renewal_links")
    .select(`
      id,
      subscription_id,
      expires_at,
      used_at
    `)
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (linkError) {
    throw linkError;
  }

  if (!link) {
    throw new Error(
      "This renewal link is invalid."
    );
  }

  if (link.used_at) {
    throw new Error(
      "This renewal link has already been used."
    );
  }

  if (
    new Date(link.expires_at).getTime() <
    Date.now()
  ) {
    throw new Error(
      "This renewal link has expired."
    );
  }

  // ----------------------------------------------------------
  // Get subscription information
  // ----------------------------------------------------------

  const {
    data: subscription,
    error: subscriptionError,
  } = await supabaseAdmin
    .from("subscriptions")
    .select(`
      id,
      customer_id,
      start_date,
      end_date,
      status,
      is_paused,
      delivery_time,
      frequency,
      total_amount,
      payment_method,
      payment_status,

      customers(
        id,
        full_name,
        phone,
        email
      ),

      addresses(
        id,
        house_no,
        street,
        area,
        city,
        state,
        pincode
      ),

      subscription_items(
        quantity,
        size,
        products(
          id,
          name,
          image
        )
      )
    `)
    .eq("id", link.subscription_id)
    .single();

  if (subscriptionError) {
    throw subscriptionError;
  }

  if (!subscription) {
    throw new Error(
      "Subscription not found."
    );
  }

  return {
  linkId: link.id,
  subscription,
  expiresAt: link.expires_at,
};
}


/* ==========================================================
   MARK TOKEN USED
========================================================== */

export async function markSubscriptionRenewalLinkUsedService(
  token
) {
  const tokenHash = hashToken(token);

  const {
    data,
    error,
  } = await supabaseAdmin
    .from("subscription_renewal_links")
    .update({
      used_at: new Date().toISOString(),
    })
    .eq("token_hash", tokenHash)
    .is("used_at", null)
    .select()
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}