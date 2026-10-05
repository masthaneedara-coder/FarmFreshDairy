import { supabaseAdmin } from "../config/supabase.js";
import { getCustomerByPhoneService } from "./customer.service.js";
import { pauseSubscriptionService } from "./subscription.service.js";
import { normalizeIndianPhone } from "../utils/phone.js";

/**
 * Find customer's active subscription
 */
export const getActiveSubscriptionForCustomer = async (customerId) => {
  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .select(`
      id,
      customer_id,
      status,
      start_date,
      end_date,
      delivery_time,
      frequency,
      is_paused,
      pause_from,
      pause_to
    `)
    .eq("customer_id", customerId)
    .eq("status", "Active")
    .eq("is_paused", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error(
      "WhatsApp active subscription lookup error:",
      error
    );

    throw error;
  }

  return data;
};


/**
 * Convert date into YYYY-MM-DD
 */
const formatDate = (date) => {
  if (!date) return "Not specified";

  // Supabase usually returns dates as YYYY-MM-DD strings
  if (typeof date === "string") {
    const parts = date.split("-");

    if (parts.length === 3 && parts[0].length === 4) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }

    return date;
  }

  if (date instanceof Date && !isNaN(date.getTime())) {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  }

  return String(date);
};


/**
 * Parse DD/MM/YYYY, DD-MM-YYYY or YYYY-MM-DD
 */
const parseDate = (value) => {
  if (!value) return null;

  const text = String(value).trim();

  let day;
  let month;
  let year;

  // DD/MM/YYYY or DD-MM-YYYY
  let match = text.match(
    /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/
  );

  if (match) {
    day = Number(match[1]);
    month = Number(match[2]);
    year = Number(match[3]);
  }

  // YYYY-MM-DD
  if (!match) {
    match = text.match(
      /^(\d{4})-(\d{1,2})-(\d{1,2})$/
    );

    if (match) {
      year = Number(match[1]);
      month = Number(match[2]);
      day = Number(match[3]);
    }
  }

  if (!year || !month || !day) {
    return null;
  }

  const date = new Date(year, month - 1, day);

  // Validate date
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  // Return Supabase/PostgreSQL date format
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
};


/**
 * Extract two dates from WhatsApp message
 *
 * Examples:
 *
 * Pause from 10-10-2026 to 15-10-2026
 * Pause 10/10/2026 to 15/10/2026
 * Pause from 2026-10-10 to 2026-10-15
 */
export const extractPauseDates = (message) => {
  const text = String(message || "");

  const matches = text.match(
    /\b(?:\d{1,2}[\/-]\d{1,2}[\/-]\d{4}|\d{4}-\d{1,2}-\d{1,2})\b/g
  );

  console.log("📅 Date matches:", matches);

  if (!matches || matches.length < 2) {
    return null;
  }

  const pauseFrom = parseDate(matches[0]);
  const pauseTo = parseDate(matches[1]);

  console.log("📅 Parsed dates:", {
    pauseFrom,
    pauseTo,
  });

  if (!pauseFrom || !pauseTo) {
    return null;
  }

  return {
    pauseFrom,
    pauseTo,
  };
};

/**
 * Send WhatsApp text message using Meta Cloud API
 */
export const sendWhatsAppMessage = async (
  recipientPhone,
  message
) => {
  const phoneNumberId =
    process.env.WHATSAPP_PHONE_NUMBER_ID;

  const accessToken =
    process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId) {
    throw new Error(
      "WHATSAPP_PHONE_NUMBER_ID is not configured"
    );
  }

  if (!accessToken) {
    throw new Error(
      "WHATSAPP_ACCESS_TOKEN is not configured"
    );
  }

  const url =
    `https://graph.facebook.com/v23.0/` +
    `${phoneNumberId}/messages`;

  const response = await fetch(url, {
    method: "POST",

    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      messaging_product: "whatsapp",

      to: recipientPhone,

      type: "text",

      text: {
        preview_url: false,
        body: message,
      },
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    console.error(
      "WhatsApp send message error:",
      result
    );

    throw new Error(
      result?.error?.message ||
        "Failed to send WhatsApp message"
    );
  }

  return result;
};


/**
 * Process WhatsApp pause request
 */
export const processWhatsAppPauseRequest = async ({
  whatsappPhone,
  message,
}) => {
  try {
    // 1. Normalize WhatsApp phone number
    const normalizedPhone = normalizeIndianPhone(whatsappPhone);

    if (!normalizedPhone) {
      return {
        success: false,
        message:
          "Sorry, we could not identify your WhatsApp phone number.",
      };
    }

    console.log("📱 WhatsApp phone:", normalizedPhone);

    // 2. Find customer
    const customer = await getCustomerByPhoneService(normalizedPhone);

    if (!customer) {
      return {
        success: false,
        message:
          "Sorry, we could not find a FarmFreshDairy customer account linked to this WhatsApp number.",
      };
    }

    console.log("👤 Customer found:", customer.id);

    // 3. Check whether the customer is asking to pause
    const lowerMessage = String(message || "").toLowerCase();

    const pauseKeywords = [
      "pause",
      "stop milk",
      "stop delivery",
      "pause milk",
      "pause subscription",
    ];

    const isPauseRequest = pauseKeywords.some((keyword) =>
      lowerMessage.includes(keyword)
    );

    if (!isPauseRequest) {
      return {
        success: false,
        message:
          "Please send a message like: Pause my milk subscription.",
      };
    }

    // 4. Get customer's latest subscription
    const subscription =
      await getCustomerSubscriptionForWhatsApp(customer.id);

    if (!subscription) {
      return {
        success: false,
        message:
          "Sorry, we could not find any milk subscription for your account.",
      };
    }

    console.log("📋 Subscription:", {
      id: subscription.id,
      status: subscription.status,
      is_paused: subscription.is_paused,
    });

    // 5. Already paused
    if (
      subscription.status === "Paused" ||
      subscription.is_paused === true
    ) {
      return {
        success: true,
        alreadyPaused: true,
        customer,
        subscription,
        message:
          `🥛 Hi ${customer.full_name}, your FarmFreshDairy subscription is already paused.\n\n` +
          `Pause started: ${formatDate(subscription.pause_from)}\n\n` +
          `If you want to change the pause dates or resume your subscription, please send us a message.`,
      };
    }

    // 6. Only Active subscriptions can be paused
    if (
      subscription.status !== "Active" ||
      subscription.is_paused === true
    ) {
      return {
        success: false,
        customer,
        subscription,
        message:
          `Your subscription cannot be paused because its current status is "${subscription.status}".`,
      };
    }

    // 7. Extract pause dates from WhatsApp message
    const dates = extractPauseDates(message);

    if (!dates.pauseFrom || !dates.pauseTo) {
      return {
        success: false,
        customer,
        subscription,
        message:
          "🥛 Please provide the pause dates.\n\n" +
          "Example:\n" +
          "Pause my milk from 05/10/2026 to 10/10/2026.",
      };
    }

    console.log("⏸️ Pause request:", dates);

    // 8. Pause the subscription using existing service
    const updatedSubscription = await pauseSubscriptionService(
      subscription.id,
      dates.pauseFrom,
      dates.pauseTo
    );

    console.log("✅ Subscription paused:", subscription.id);

    // 9. Confirmation message
    return {
      success: true,
      alreadyPaused: false,
      customer,
      subscription: updatedSubscription,
      message:
        `🥛 Hi ${customer.full_name},\n\n` +
        `Your FarmFreshDairy subscription has been successfully paused. ✅\n\n` +
        `Pause from: ${formatDate(dates.pauseFrom)}\n` +
        `Pause until: ${formatDate(dates.pauseTo)}\n\n` +
        `Your milk delivery will resume after the pause period.`,
    };
  } catch (error) {
    console.error(
      "❌ processWhatsAppPauseRequest Error:",
      error
    );

    return {
      success: false,
      message:
        "Sorry, we could not process your subscription request right now. Please try again later.",
      error: error.message,
    };
  }
};
// =====================================================
// WhatsApp Customer + Subscription Lookup
// =====================================================

export const getCustomerSubscriptionForWhatsApp = async (
  customerId
) => {
  if (!customerId) {
    throw new Error("Customer ID is required");
  }

  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .select(`
      id,
      customer_id,
      status,
      start_date,
      end_date,
      delivery_time,
      frequency,
      is_paused,
      pause_from,
      pause_to,
      created_at
    `)
    .eq("customer_id", customerId)
    .order("created_at", {
      ascending: false,
    })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error(
      "WhatsApp subscription lookup error:",
      error
    );

    throw error;
  }

  return data;
};


export const getCustomerAndSubscriptionForWhatsApp = async (
  phone
) => {
  const customer =
    await getCustomerByPhoneService(phone);

  if (!customer) {
    return {
      customer: null,
      subscription: null,
    };
  }

  const subscription =
    await getCustomerSubscriptionForWhatsApp(
      customer.id
    );

  return {
    customer,
    subscription,
  };
};

