import { supabaseAdmin } from "../config/supabase.js";
import { sendDeliveryStatusTemplate } from "./whatsapp.service.js";

function formatTemplateDate(value) {
  if (!value) return "Not specified";

  const raw = String(value);
  const match = raw.match(/^(\\d{4})-(\\d{2})-(\\d{2})/);

  if (match) {
    return `${match[3]}/${match[2]}/${match[1]}`;
  }

  return raw;
}

/**
 * Sends the approved Meta Utility template:
 * delivery_status_update_utility
 *
 * {{1}} customer name
 * {{2}} delivery number
 * {{3}} delivery date
 * {{4}} delivery status
 *
 * Requires the whatsapp_delivery_notification_logs table migration.
 */
export async function notifyCustomerDeliveryStatusChange({
  customerId,
  deliveryId,
  deliveryNumber,
  deliveryDate,
  status,
}) {
  if (!customerId || !deliveryId || !status) {
    return { sent: false, reason: "Missing customer, delivery, or status data" };
  }

  const { data: customer, error: customerError } = await supabaseAdmin
    .from("customers")
    .select("id, full_name, phone")
    .eq("id", customerId)
    .maybeSingle();

  if (customerError) {
    console.error("WhatsApp customer lookup failed:", customerError.message);
    return { sent: false, reason: "Customer lookup failed" };
  }

  if (!customer?.phone) {
    return { sent: false, reason: "Customer has no phone number" };
  }

  const logPayload = {
    delivery_id: String(deliveryId),
    customer_id: String(customerId),
    status: String(status),
    recipient_phone: String(customer.phone),
    send_status: "pending",
    updated_at: new Date().toISOString(),
  };

  // Unique(delivery_id, status) prevents duplicate sends from repeated requests.
  const { data: claimedLog, error: claimError } = await supabaseAdmin
    .from("whatsapp_delivery_notification_logs")
    .insert(logPayload)
    .select("id")
    .single();

  if (claimError) {
    if (claimError.code === "23505") {
      const { data: existingLog, error: existingError } = await supabaseAdmin
        .from("whatsapp_delivery_notification_logs")
        .select("id, send_status, message_id")
        .eq("delivery_id", String(deliveryId))
        .eq("status", String(status))
        .maybeSingle();

      if (existingError) {
        console.error("WhatsApp notification log lookup failed:", existingError.message);
        return { sent: false, reason: "Notification log lookup failed" };
      }

      return {
        sent: false,
        duplicate: true,
        reason: `Notification already recorded (${existingLog?.send_status || "unknown"})`,
        messageId: existingLog?.message_id || null,
      };
    }

    console.error("WhatsApp notification log insert failed:", claimError.message);
    return { sent: false, reason: "Could not create notification log" };
  }

  try {
    const result = await sendDeliveryStatusTemplate({
      recipientPhone: customer.phone,
      customerName: customer.full_name || "Customer",
      deliveryId: deliveryNumber || String(deliveryId),
      deliveryDate: formatTemplateDate(deliveryDate),
      deliveryStatus: String(status),
    });

    const messageId = result?.messages?.[0]?.id || null;

    const { error: updateError } = await supabaseAdmin
      .from("whatsapp_delivery_notification_logs")
      .update({
        send_status: "sent",
        message_id: messageId,
        sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        error_message: null,
      })
      .eq("id", claimedLog.id);

    if (updateError) {
      // Meta may already have accepted the message. Do not retry automatically
      // because that could send a duplicate.
      console.error("WhatsApp log success update failed:", updateError.message);
    }

    return { sent: true, messageId };
  } catch (sendError) {
    const { error: logError } = await supabaseAdmin
      .from("whatsapp_delivery_notification_logs")
      .update({
        send_status: "failed",
        error_message: String(sendError?.message || sendError).slice(0, 1000),
        updated_at: new Date().toISOString(),
      })
      .eq("id", claimedLog.id);

    if (logError) {
      console.error("WhatsApp failure log update failed:", logError.message);
    }

    console.error("WhatsApp template send failed:", sendError?.message || sendError);
    return { sent: false, reason: sendError?.message || "WhatsApp send failed" };
  }
}
