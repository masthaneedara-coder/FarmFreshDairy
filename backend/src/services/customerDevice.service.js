import { supabaseAdmin } from "../config/supabase.js";

export const registerCustomerDevice = async ({
  customerId,
  deviceToken,
  platform,
}) => {
  if (!customerId || !deviceToken || !platform) {
    throw new Error("customerId, deviceToken and platform are required");
  }

  const { data, error } = await supabaseAdmin
    .from("customer_devices")
    .upsert(
      {
        customer_id: customerId,
        device_token: deviceToken,
        platform,
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "device_token",
      }
    )
    .select()
    .single();

  if (error) {
    console.error("[FCM] Device registration error:", error);
    throw error;
  }

  return data;
};