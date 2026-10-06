import { supabaseAdmin } from "../config/supabase.js";

/**
 * Normalize Indian phone number to 10 digits.
 *
 * Supported:
 * 919876543210
 * 9876543210
 * +919876543210
 */
export const normalizePhone = (phone) => {
  if (!phone) return null;

  let value = String(phone).trim();

  // Remove spaces, +, -, brackets, etc.
  value = value.replace(/\D/g, "");

  // 919876543210 -> 9876543210
  if (value.length === 12 && value.startsWith("91")) {
    value = value.substring(2);
  }

  // 09876543210 -> 9876543210
  if (value.length === 11 && value.startsWith("0")) {
    value = value.substring(1);
  }

  // Final valid Indian mobile number
  if (
    value.length === 10 &&
    /^[6-9]\d{9}$/.test(value)
  ) {
    return value;
  }

  return null;
};


/**
 * Find customer by phone number.
 *
 * Supports database values such as:
 *
 * 919876543210
 * 9876543210
 * +919876543210
 */
export const getCustomerByPhoneService = async (phone) => {
  const normalizedPhone = normalizePhone(phone);

  if (!normalizedPhone) {
    throw new Error(
      "Invalid Indian phone number"
    );
  }

  // Get possible customer records.
  // We check all three common formats.
  const phoneFormats = [
    normalizedPhone,
    `91${normalizedPhone}`,
    `+91${normalizedPhone}`,
  ];

  const { data, error } = await supabaseAdmin
    .from("customers")
    .select("id, full_name, phone, email")
    .in("phone", phoneFormats)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error(
      "Customer phone lookup error:",
      error
    );

    throw error;
  }

  return data;
};