import { randomBytes, createHash } from "node:crypto";
import { supabaseAdmin } from "../config/supabase.js";
import { getCustomerByPhoneService } from "./customer.service.js";
import { normalizeIndianPhone } from "../utils/phone.js";

const TOKEN_LIFETIME_MINUTES = 30;
const TOKEN_PURPOSE = "pause_subscription";
const SUBSCRIPTION_FIELDS = `
  id, customer_id, status, start_date, end_date,
  delivery_time, frequency, is_paused, pause_from, pause_to, created_at
`;

const hashToken = (token) => createHash("sha256").update(token).digest("hex");

const formatDate = (date) => {
  if (!date) return "Not specified";
  if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [year, month, day] = date.split("-");
    return `${day}/${month}/${year}`;
  }
  return String(date);
};

const parseDate = (value) => {
  const text = String(value || "").trim();
  let year, month, day;
  let match = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (match) {
    [, day, month, year] = match.map(Number);
  } else {
    match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (!match) return null;
    [, year, month, day] = match.map(Number);
  }
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
};

// Retained for compatibility with existing imports. Dates are selected on the website.
export const extractPauseDates = (message) => {
  const matches = String(message || "").match(/\b(?:\d{1,2}[/-]\d{1,2}[/-]\d{4}|\d{4}-\d{1,2}-\d{1,2})\b/g);
  if (!matches || matches.length < 2) return null;
  const pauseFrom = parseDate(matches[0]);
  const pauseTo = parseDate(matches[1]);
  return pauseFrom && pauseTo ? { pauseFrom, pauseTo } : null;
};

export const getActiveSubscriptionsForCustomer = async (customerId) => {
  if (!customerId) throw new Error("Customer ID is required");
  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .select(SUBSCRIPTION_FIELDS)
    .eq("customer_id", customerId)
    .eq("status", "Active")
    .eq("is_paused", false)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
};

export const getActiveSubscriptionForCustomer = async (customerId) => {
  const subscriptions = await getActiveSubscriptionsForCustomer(customerId);
  return subscriptions[0] || null;
};

export const getCustomerSubscriptionForWhatsApp = async (customerId) => {
  if (!customerId) throw new Error("Customer ID is required");
  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .select(SUBSCRIPTION_FIELDS)
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
};

export const getCustomerAndSubscriptionForWhatsApp = async (phone) => {
  const normalizedPhone = normalizeIndianPhone(phone);
  if (!normalizedPhone) return { customer: null, subscription: null };
  const customer = await getCustomerByPhoneService(normalizedPhone);
  if (!customer) return { customer: null, subscription: null };
  const subscription = await getCustomerSubscriptionForWhatsApp(customer.id);
  return { customer, subscription };
};

export const sendWhatsAppMessage = async (recipientPhone, message) => {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!phoneNumberId || !accessToken) {
    throw new Error("WhatsApp Cloud API environment variables are missing");
  }
  const phone = normalizeIndianPhone(recipientPhone);
  if (!phone) throw new Error("Invalid recipient phone number");
  const response = await fetch(`https://graph.facebook.com/v23.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: phone,
      type: "text",
      text: { preview_url: false, body: String(message) },
    }),
  });
  const result = await response.json();
  if (!response.ok) {
    console.error("WhatsApp send failed:", result?.error?.code || response.status);
    throw new Error(result?.error?.message || "Failed to send WhatsApp message");
  }
  return result;
};

const createPauseManagementLink = async (customerId) => {
  const appUrl = process.env.CUSTOMER_APP_URL;
  if (!appUrl) throw new Error("CUSTOMER_APP_URL is not configured");
  const parsedUrl = new URL(appUrl);
  if (parsedUrl.protocol !== "https:" && parsedUrl.hostname !== "localhost") {
    throw new Error("CUSTOMER_APP_URL must use HTTPS");
  }

  // Revoke previous links. Only token hashes are stored, so previous raw links cannot be reused.
  const { error: revokeError } = await supabaseAdmin
    .from("subscription_management_tokens")
    .update({ revoked_at: new Date().toISOString() })
    .eq("customer_id", customerId)
    .eq("purpose", TOKEN_PURPOSE)
    .is("revoked_at", null)
    .is("used_at", null);
  if (revokeError) throw revokeError;

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + TOKEN_LIFETIME_MINUTES * 60_000).toISOString();
  const { error: insertError } = await supabaseAdmin
    .from("subscription_management_tokens")
    .insert({ customer_id: customerId, token_hash: hashToken(token), purpose: TOKEN_PURPOSE, expires_at: expiresAt });
  if (insertError) throw insertError;

  return `${appUrl.replace(/\/+$/, "")}/manage-subscription/${token}`;
};

export const processWhatsAppPauseRequest = async ({ whatsappPhone, message }) => {
  try {
    const text = String(message || "").toLowerCase();
    const isPauseRequest = /\b(pause|stop milk|stop delivery)\b/.test(text);
    if (!isPauseRequest) {
      return { success: false, ignored: true, message: "Please send 'Pause' to manage your milk subscription." };
    }

    const phone = normalizeIndianPhone(whatsappPhone);
    if (!phone) return { success: false, message: "Sorry, we could not identify your WhatsApp number." };
    const customer = await getCustomerByPhoneService(phone);
    if (!customer) {
      return { success: false, message: "We could not find a Farm Fresh Dairy account linked to this WhatsApp number." };
    }

    const subscriptions = await getActiveSubscriptionsForCustomer(customer.id);
    if (!subscriptions.length) {
      return { success: false, message: "You do not currently have an active milk subscription eligible for pausing." };
    }

    const link = await createPauseManagementLink(customer.id);
    const greeting = customer.full_name ? `Hi ${customer.full_name},\n\n` : "";
    return {
      success: true,
      message: `${greeting}To pause your Farm Fresh Dairy milk delivery, open this secure link:\n${link}\n\nSelect your subscription and pause dates on the website. This link expires in ${TOKEN_LIFETIME_MINUTES} minutes. Your delivery has NOT been paused yet.`,
    };
  } catch (error) {
    console.error("WhatsApp pause link generation failed:", error?.message);
    return { success: false, message: "Sorry, we could not create your subscription link right now. Please try again later." };
  }
};

/* ==========================================
   FARM FRESH DAIRY - DELIVERY STATUS TEMPLATE
========================================== */

export const sendDeliveryStatusTemplate = async ({
  recipientPhone,
  customerName,
  deliveryId,
  deliveryDate,
  deliveryStatus,
}) => {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    throw new Error("WhatsApp API environment variables are missing");
  }

  const phone = normalizeIndianPhone(recipientPhone);

  if (!phone) {
    throw new Error("Invalid customer WhatsApp number");
  }

  const requiredValues = {
    customerName,
    deliveryId,
    deliveryDate,
    deliveryStatus,
  };

  for (const [key, value] of Object.entries(requiredValues)) {
    if (value === undefined || value === null || String(value).trim() === "") {
      throw new Error(`Missing WhatsApp template parameter: ${key}`);
    }
  }

  const templateName = "delivery_status_update_utility";

  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: phone,
    type: "template",
    template: {
      name: templateName,
      language: {
        code: "en",
      },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: String(customerName) },
            { type: "text", text: String(deliveryId) },
            { type: "text", text: String(deliveryDate) },
            { type: "text", text: String(deliveryStatus) },
          ],
        },
      ],
    },
  };

  const response = await fetch(
    `https://graph.facebook.com/v23.0/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  const result = await response.json();

  if (!response.ok) {
    console.error("WhatsApp template error:", result?.error);

    throw new Error(
      result?.error?.message ||
      "Failed to send delivery status template"
    );
  }

  console.log("Delivery WhatsApp template accepted:", {
    deliveryId,
    messageId: result?.messages?.[0]?.id,
    recipient: phone,
  });

  return result;
};

