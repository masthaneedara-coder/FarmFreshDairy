import { supabaseAdmin } from "../config/supabase.js";
import { normalizeIndianPhone } from "../utils/phone.js";

const CUSTOMER_VISIBLE_STATUSES = new Set([
  "Out for Delivery",
  "Delivered",
  "Skipped",
  "Missed",
  "Failed",
  "Cancelled",
]);

function formatDeliveryDate(value) {
  if (!value) return "today";

  const match = String(value).slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return String(value);

  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
}

async function sendDeliveryStatusTemplate({
  recipientPhone,
  customerName,
  deliveryNumber,
  deliveryDate,
  status,
}) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const templateName = process.env.WHATSAPP_DELIVERY_STATUS_TEMPLATE_NAME;
  const languageCode = process.env.WHATSAPP_DELIVERY_STATUS_TEMPLATE_LANGUAGE || "en";
  const apiVersion = process.env.WHATSAPP_API_VERSION || "v23.0";

  if (!phoneNumberId || !accessToken) {
    throw new Error("WhatsApp Cloud API credentials are not configured.");
  }

  if (!templateName) {
    throw new Error("WHATSAPP_DELIVERY_STATUS_TEMPLATE_NAME is not configured.");
  }

  const phone = normalizeIndianPhone(recipientPhone);
  if (!phone) throw new Error("Customer WhatsApp number is invalid.");

  const response = await fetch(
    `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: phone,
        type: "template",
        template: {
          name: templateName,
          language: { code: languageCode },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: customerName || "Customer" },
                { type: "text", text: String(deliveryNumber || "N/A") },
                { type: "text", text: formatDeliveryDate(deliveryDate) },
                { type: "text", text: status },
              ],
            },
          ],
        },
      }),
    }
  );

  const responseText = await response.text();
  let result;
  try {
    result = responseText ? JSON.parse(responseText) : {};
  } catch {
    result = { raw: responseText };
  }

  if (!response.ok) {
    const providerMessage = result?.error?.message || `WhatsApp API request failed (${response.status}).`;
    throw new Error(providerMessage);
  }

  return result;
}

/**
 * Sends a WhatsApp notification only after a real status transition,
 * only for customer-visible statuses, and only when the customer has
 * explicitly opted in. Call this after the delivery row is saved.
 */
export async function notifyCustomerDeliveryStatusChange({
  customerId,
  deliveryId,
  deliveryNumber,
  deliveryDate,
  status,
}) {
  if (process.env.WHATSAPP_DELIVERY_NOTIFICATIONS_ENABLED !== "true") {
    return { sent: false, reason: "feature_disabled" };
  }

  if (!CUSTOMER_VISIBLE_STATUSES.has(status)) {
    return { sent: false, reason: "status_not_customer_visible" };
  }

  if (!customerId || !deliveryId) {
    return { sent: false, reason: "missing_delivery_customer_reference" };
  }

  const { data: preference, error: preferenceError } = await supabaseAdmin
    .from("whatsapp_notification_preferences")
    .select("delivery_updates_enabled, consented_at, revoked_at")
    .eq("customer_id", customerId)
    .maybeSingle();

  if (preferenceError) throw preferenceError;

  if (
    !preference ||
    preference.delivery_updates_enabled !== true ||
    !preference.consented_at ||
    preference.revoked_at
  ) {
    return { sent: false, reason: "customer_not_opted_in" };
  }

  const { data: customer, error: customerError } = await supabaseAdmin
    .from("customers")
    .select("id, full_name, phone")
    .eq("id", customerId)
    .maybeSingle();

  if (customerError) throw customerError;
  if (!customer?.phone) return { sent: false, reason: "customer_phone_missing" };

  const providerResponse = await sendDeliveryStatusTemplate({
    recipientPhone: customer.phone,
    customerName: customer.full_name,
    deliveryNumber: deliveryNumber || deliveryId.slice(0, 8),
    deliveryDate,
    status,
  });

  return {
    sent: true,
    messageId: providerResponse?.messages?.[0]?.id || null,
  };
}
