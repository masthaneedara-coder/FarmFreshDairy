import crypto from "crypto";
import { supabaseAdmin } from "../config/supabase.js";

const FRONTEND_URL =
  process.env.FRONTEND_URL ||
  "https://farm-fresh-dairy.vercel.app";

const TOKEN_EXPIRY_DAYS = 90;

function hashToken(token) {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
}

/* Create a secure customer management link */
export async function createSubscriptionManageLinkService(subscriptionId) {
  const { data: subscription, error: subscriptionError } =
    await supabaseAdmin
      .from("subscriptions")
      .select("id, status")
      .eq("id", subscriptionId)
      .maybeSingle();

  if (subscriptionError) throw subscriptionError;
  if (!subscription) throw new Error("Subscription not found.");

  const status = String(subscription.status || "").toLowerCase();

  if (["stopped", "cancelled", "canceled", "deleted"].includes(status)) {
    throw new Error("A management link cannot be created for this subscription.");
  }

  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + TOKEN_EXPIRY_DAYS);

  const { data: link, error: insertError } = await supabaseAdmin
    .from("subscription_manage_links")
    .insert({
      subscription_id: subscriptionId,
      token_hash: tokenHash,
      expires_at: expiresAt.toISOString(),
    })
    .select("id, expires_at")
    .single();

  if (insertError) throw insertError;

  return {
    id: link.id,
    manageUrl: `${FRONTEND_URL}/manage-subscription/${token}`,
    expiresAt: link.expires_at,
  };
}

/* Validate token and load subscription details */
export async function getSubscriptionManageLinkService(token) {
  if (!token || !/^[a-f0-9]{64}$/i.test(token)) {
    throw new Error("This management link is invalid.");
  }

  const tokenHash = hashToken(token);

  const { data: link, error: linkError } = await supabaseAdmin
    .from("subscription_manage_links")
    .select("id, subscription_id, expires_at, revoked_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (linkError) throw linkError;
  if (!link) throw new Error("This management link is invalid.");

  if (link.revoked_at) {
    throw new Error("This management link has been revoked.");
  }

  if (new Date(link.expires_at).getTime() <= Date.now()) {
    throw new Error("This management link has expired.");
  }

  const { data: subscription, error: subscriptionError } =
    await supabaseAdmin
      .from("subscriptions")
      .select(`
        id,
        start_date,
        end_date,
        status,
        is_paused,
        pause_from,
        pause_to,
        delivery_time,
        frequency,
        total_amount,
        payment_method,
        payment_status,
        subscription_items(
          quantity,
          size,
          products(name)
        )
      `)
      .eq("id", link.subscription_id)
      .maybeSingle();

  if (subscriptionError) throw subscriptionError;
  if (!subscription) throw new Error("Subscription not found.");

  return {
    linkId: link.id,
    expiresAt: link.expires_at,
    subscription,
  };
}

/* Revoke all currently active management links for a subscription */
export async function revokeSubscriptionManageLinksService(subscriptionId) {
  const { error } = await supabaseAdmin
    .from("subscription_manage_links")
    .update({ revoked_at: new Date().toISOString() })
    .eq("subscription_id", subscriptionId)
    .is("revoked_at", null);

  if (error) throw error;
}