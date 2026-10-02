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

export async function createSubscriptionRenewalLinkService(
  subscriptionId
) {
  // ----------------------------------------------------------
  // 1. Get subscription
  // ----------------------------------------------------------

  const {
    data: subscription,
    error: subscriptionError,
  } = await supabaseAdmin
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

  // ----------------------------------------------------------
  // 2. Do not create links for stopped subscriptions
  // ----------------------------------------------------------

  const status = String(
    subscription.status || ""
  ).trim().toLowerCase();

  if (
    status === "stopped" ||
    status === "cancelled" ||
    status === "canceled"
  ) {
    throw new Error(
      "This subscription cannot be renewed."
    );
  }

  // ----------------------------------------------------------
  // 3. Generate secure random token
  // ----------------------------------------------------------

  const token = crypto.randomBytes(32).toString("hex");

  const tokenHash = hashToken(token);

  // ----------------------------------------------------------
  // 4. Token expires after 7 days
  // ----------------------------------------------------------

  const expiresAt = new Date();

  expiresAt.setDate(
    expiresAt.getDate() + TOKEN_EXPIRY_DAYS
  );

  // ----------------------------------------------------------
  // 5. Store HASH only
  // ----------------------------------------------------------

  const {
    data: renewalLink,
    error: linkError,
  } = await supabaseAdmin
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

  // ----------------------------------------------------------
  // 6. Customer-facing URL
  // ----------------------------------------------------------

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