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
  // 1. Load subscription details.
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

  if (subscriptionError) throw subscriptionError;

  if (!subscription) {
    throw new Error("Subscription not found.");
  }

  // 2. Only Active subscriptions can be renewed.
  const status = String(subscription.status || "")
    .trim()
    .toLowerCase();

  if (status !== "active") {
    throw new Error(
      "Only active subscriptions can generate renewal links."
    );
  }

  // 3. Generate a secure random token.
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);

  // 4. Calculate expiry.
  const expiresAt = new Date();
  expiresAt.setDate(
    expiresAt.getDate() + TOKEN_EXPIRY_DAYS
  );

  // 5. Create the link atomically through PostgreSQL.
  const { data: result, error: rpcError } =
    await supabaseAdmin.rpc(
      "create_subscription_renewal_link_record",
      {
        p_subscription_id: subscriptionId,
        p_token_hash: tokenHash,
        p_expires_at: expiresAt.toISOString(),
      }
    );

  if (rpcError) {
    if (
      rpcError.message?.includes(
        "An active renewal link already exists"
      )
    ) {
      throw new Error(
        "An active renewal link already exists. Use the existing link or explicitly revoke it before generating another."
      );
    }

    if (
      rpcError.message?.includes(
        "An expired renewal link must be explicitly revoked"
      )
    ) {
      throw new Error(
        "The previous renewal link has expired. Revoke it explicitly before generating a replacement."
      );
    }

    console.error("Renewal link creation failed:", rpcError);

    throw new Error(
      "Unable to create the renewal link. Please try again."
    );
  }

  if (!result?.success || !result.id) {
    throw new Error(
      "Renewal link creation was not confirmed."
    );
  }

  // 6. Return the original token only once.
  const renewalUrl =
    `${FRONTEND_URL}/renew/${token}`;

  return {
    id: result.id,
    subscriptionId,
    renewalUrl,
    expiresAt: result.expires_at,
  };
}


/* ==========================================================
   GET RENEWAL LINK DETAILS
========================================================== */


export async function getSubscriptionRenewalLinkService(
  token,
  { allowUsed = false } = {}
) {
  if (!token || typeof token !== "string") {
    throw new Error("Renewal token is required.");
  }

  const tokenHash = hashToken(token);

  const { data: link, error: linkError } =
    await supabaseAdmin
      .from("subscription_renewal_links")
      .select(`
        id,
        subscription_id,
        expires_at,
        used_at
      `)
      .eq("token_hash", tokenHash)
      .maybeSingle();

  if (linkError) throw linkError;

  if (!link) {
    throw new Error("This renewal link is invalid.");
  }

  if (link.used_at && !allowUsed) {
    throw new Error("This renewal link has already been used.");
  }

  if (
    !allowUsed &&
    new Date(link.expires_at).getTime() <= Date.now()
  ) {
    throw new Error("This renewal link has expired.");
  }

  const { data: subscription, error: subscriptionError } =
    await supabaseAdmin
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
        customers(id, full_name, phone, email),
        addresses(
          id, house_no, street, area, city, state, pincode
        ),
        subscription_items(
          quantity,
          size,
          products(id, name, image)
        )
      `)
      .eq("id", link.subscription_id)
      .single();

  if (subscriptionError) throw subscriptionError;

  if (!subscription) {
    throw new Error("Subscription not found.");
  }

  return {
    linkId: link.id,
    subscription,
    expiresAt: link.expires_at,
    usedAt: link.used_at,
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