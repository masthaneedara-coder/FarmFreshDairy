import { getMessaging } from "firebase-admin/messaging";
import { firebaseAdmin } from "../config/firebaseAdmin.js";
import { supabaseAdmin } from "../config/supabase.js";

export const sendPushNotificationToCustomer = async ({
  customerId,
  title,
  body,
  data = {},
}) => {
  if (!customerId) {
    throw new Error("customerId is required");
  }

  if (!title || !body) {
    throw new Error("title and body are required");
  }

  if (!firebaseAdmin) {
    throw new Error("Firebase Admin is not configured");
  }

  const { data: devices, error } = await supabaseAdmin
    .from("customer_devices")
    .select("id, device_token, platform")
    .eq("customer_id", customerId)
    .eq("is_active", true);

  if (error) {
    console.error("[FCM] Failed to load customer devices:", error);
    throw error;
  }

  if (!devices || devices.length === 0) {
    console.log("[FCM] No active devices found for customer:", customerId);
    return {
      success: true,
      sent: 0,
      failed: 0,
    };
  }

  const messaging = getMessaging(firebaseAdmin);

  let sent = 0;
  let failed = 0;

  for (const device of devices) {
    try {
      await messaging.send({
        token: device.device_token,
        notification: {
          title,
          body,
        },
        data: Object.fromEntries(
          Object.entries(data).map(([key, value]) => [
            key,
            String(value),
          ])
        ),
        android: {
          priority: "high",
          notification: {
            sound: "default",
            channelId: "farm_fresh_dairy",
          },
        },
      });

      sent += 1;

      console.log(
        `[FCM] Push sent successfully to device ${device.id}`
      );
    } catch (error) {
      failed += 1;

      console.error(
        `[FCM] Push failed for device ${device.id}:`,
        error?.message || error
      );

      // Remove invalid/expired FCM tokens.
      if (
        error?.code === "messaging/registration-token-not-registered" ||
        error?.code === "messaging/invalid-registration-token"
      ) {
        await supabaseAdmin
          .from("customer_devices")
          .update({
            is_active: false,
            updated_at: new Date().toISOString(),
          })
          .eq("id", device.id);
      }
    }
  }

  return {
    success: true,
    sent,
    failed,
  };
};
