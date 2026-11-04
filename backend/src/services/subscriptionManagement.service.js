import { createHash } from "node:crypto";
import { supabaseAdmin } from "../config/supabase.js";
import { pauseSubscriptionService } from "./subscription.service.js";
import { normalizeIndianPhone } from "../utils/phone.js";
import { sendWhatsAppMessage } from "./whatsapp.service.js";

const TOKEN_PURPOSE = "pause_subscription";
const TOKEN_SELECT = "id, customer_id, expires_at, revoked_at, used_at, purpose";

const hashToken = (token) =>
  createHash("sha256").update(String(token)).digest("hex");

const invalidTokenError = () => {
  const error = new Error("This subscription link is invalid, expired, or already used. Please send 'Pause' on WhatsApp to get a new link.");
  error.statusCode = 410;
  return error;
};

async function getValidTokenRecord(rawToken) {
  if (!rawToken || typeof rawToken !== "string" || rawToken.length < 30 || rawToken.length > 200) {
    throw invalidTokenError();
  }

  const { data, error } = await supabaseAdmin
    .from("subscription_management_tokens")
    .select(TOKEN_SELECT)
    .eq("token_hash", hashToken(rawToken))
    .eq("purpose", TOKEN_PURPOSE)
    .is("revoked_at", null)
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (error) throw error;
  if (!data) throw invalidTokenError();
  return data;
}

export async function getPauseManagementData(rawToken) {
  const tokenRecord = await getValidTokenRecord(rawToken);

  const { data: subscriptions, error: subscriptionError } = await supabaseAdmin
    .from("subscriptions")
    .select("id, status, start_date, end_date, delivery_time, frequency, is_paused")
    .eq("customer_id", tokenRecord.customer_id)
    .eq("status", "Active")
    .eq("is_paused", false)
    .order("created_at", { ascending: false });

  if (subscriptionError) throw subscriptionError;

  return {
    expiresAt: tokenRecord.expires_at,
    subscriptions: subscriptions || [],
  };
}

export async function pauseSubscriptionWithManagementToken({
  rawToken,
  subscriptionId,
  pauseFrom,
  pauseTo,
}) {
  const tokenRecord = await getValidTokenRecord(rawToken);

  if (!subscriptionId || !pauseFrom || !pauseTo) {
    const error = new Error("Subscription, pause start date and pause end date are required.");
    error.statusCode = 400;
    throw error;
  }

  // Confirm ownership and eligibility before calling the existing pause service.
  const { data: ownedSubscription, error: ownershipError } = await supabaseAdmin
    .from("subscriptions")
    .select("id, customer_id, status, is_paused, start_date, end_date")
    .eq("id", subscriptionId)
    .eq("customer_id", tokenRecord.customer_id)
    .maybeSingle();

  if (ownershipError) throw ownershipError;
  if (!ownedSubscription) {
    const error = new Error("The selected subscription does not belong to this customer.");
    error.statusCode = 403;
    throw error;
  }

  if (ownedSubscription.status !== "Active" || ownedSubscription.is_paused === true) {
    const error = new Error("This subscription is no longer active or has already been paused. Refresh the page and try again.");
    error.statusCode = 409;
    throw error;
  }

  // Existing service retains all date checks and pause-history behavior.
  const updatedSubscription = await pauseSubscriptionService(
    subscriptionId,
    pauseFrom,
    pauseTo
  );

  // Mark token used only after the pause operation succeeds.
  const { data: consumedToken, error: consumeError } = await supabaseAdmin
    .from("subscription_management_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("id", tokenRecord.id)
    .is("used_at", null)
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString())
    .select("id")
    .maybeSingle();

  if (consumeError) {
    // Pause already succeeded; log for operational reconciliation.
    console.error("Pause link token consumption failed after successful pause:", consumeError.message);
  } else if (!consumedToken) {
    console.warn("Pause succeeded but token was not consumed; subscription state remains authoritative.");
  }

  // Send confirmation best-effort. Fetch customer contact without assuming one phone column.
  let notificationSent = false;
  try {
    const { data: customer, error: customerError } = await supabaseAdmin
      .from("customers")
      .select("*")
      .eq("id", tokenRecord.customer_id)
      .maybeSingle();

    if (customerError) throw customerError;

    const candidatePhone =
      customer?.whatsapp_phone ||
      customer?.phone ||
      customer?.mobile_number ||
      customer?.phone_number;

    const normalizedPhone = normalizeIndianPhone(candidatePhone);
    if (normalizedPhone) {
      const name = customer?.full_name ? `Hi ${customer.full_name},\n\n` : "";
      const message =
        `${name}Your Farm Fresh Dairy subscription has been paused successfully.\n\n` +
        `Pause from: ${pauseFrom}\nPause until: ${pauseTo}\n\n` +
        `Your delivery will resume according to the pause schedule.`;
      await sendWhatsAppMessage(normalizedPhone, message);
      notificationSent = true;
    } else {
      console.warn("Pause confirmation not sent: no supported customer phone field found.");
    }
  } catch (notificationError) {
    // Do not report the pause as failed after the database update succeeded.
    console.error("Pause confirmation WhatsApp notification failed:", notificationError.message);
  }

  return {
    subscription: updatedSubscription,
    notificationSent,
  };
}
