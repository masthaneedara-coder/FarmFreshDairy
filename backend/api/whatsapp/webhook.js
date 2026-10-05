import {
  processWhatsAppPauseRequest,
  sendWhatsAppMessage,
} from "../../src/services/whatsapp.service.js";

export default async function handler(req, res) {
  // =====================================================
  // META WEBHOOK VERIFICATION
  // =====================================================
  if (req.method === "GET") {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    console.log("🔐 WhatsApp webhook verification request");

    if (
      mode === "subscribe" &&
      token === process.env.WHATSAPP_VERIFY_TOKEN
    ) {
      console.log("✅ WhatsApp webhook verified");
      return res.status(200).send(challenge);
    }

    console.log("❌ WhatsApp webhook verification failed");

    return res.status(403).send("Forbidden");
  }

  // =====================================================
  // WHATSAPP MESSAGE
  // =====================================================
  if (req.method === "POST") {
    try {
      console.log("📩 WhatsApp webhook received:");
      console.log(JSON.stringify(req.body, null, 2));

      const body = req.body;

      const message =
        body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

      // Ignore webhook events that don't contain a message
      // e.g. delivery/read/status notifications
      if (!message) {
        console.log("ℹ️ No WhatsApp message found");
        return res.status(200).send("EVENT_RECEIVED");
      }

      const from = message.from;

      // We currently process text messages only
      if (message.type !== "text") {
        console.log(
          `ℹ️ Unsupported WhatsApp message type: ${message.type}`
        );

        return res.status(200).send("EVENT_RECEIVED");
      }

      const text = message.text?.body?.trim();

      if (!from || !text) {
        console.log("⚠️ WhatsApp message missing sender or text");
        return res.status(200).send("EVENT_RECEIVED");
      }

      console.log("📱 From:", from);
      console.log("💬 Message:", text);

      // =================================================
      // PROCESS CUSTOMER REQUEST
      // =================================================
      const result = await processWhatsAppPauseRequest({
        whatsappPhone: from,
        message: text,
      });

      console.log("🤖 WhatsApp processing result:", result);

      // =================================================
      // SEND RESPONSE TO CUSTOMER
      // =================================================
      if (result?.message) {
        await sendWhatsAppMessage(
          from,
          result.message
        );

        console.log("✅ WhatsApp reply sent");
      }

      return res.status(200).send("EVENT_RECEIVED");

    } catch (error) {
      console.error(
        "❌ WhatsApp webhook processing error:",
        error
      );

      // Always return 200 to Meta after receiving the webhook.
      // This prevents unnecessary webhook retries.
      return res.status(200).send("EVENT_RECEIVED");
    }
  }

  return res.status(405).send("Method Not Allowed");
}