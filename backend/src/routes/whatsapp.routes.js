import express from "express";
import {
  processWhatsAppPauseRequest,
  sendWhatsAppMessage,
} from "../services/whatsapp.service.js";

const router = express.Router();

/**
 * Meta webhook verification
 * Configure the same WHATSAPP_VERIFY_TOKEN in Meta and Vercel.
 */
router.get("/webhook", (req, res) => {
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token && token === verifyToken) {
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

/**
 * Process incoming WhatsApp text messages.
 * Meta must receive HTTP 200 quickly, so message processing happens
 * after the response has been acknowledged.
 */
async function processIncomingMessages(body) {
  const entries = Array.isArray(body?.entry) ? body.entry : [];

  for (const entry of entries) {
    const changes = Array.isArray(entry?.changes) ? entry.changes : [];

    for (const change of changes) {
      const value = change?.value;
      const messages = Array.isArray(value?.messages) ? value.messages : [];

      for (const incomingMessage of messages) {
        // Ignore delivery/read status callbacks and non-text messages.
        if (incomingMessage?.type !== "text") continue;

        const whatsappPhone = incomingMessage?.from;
        const messageText = incomingMessage?.text?.body;

        if (!whatsappPhone || !messageText) continue;

        try {
          const result = await processWhatsAppPauseRequest({
            whatsappPhone,
            message: messageText,
          });

          // Ignore unrelated messages instead of sending unsolicited replies.
          if (result?.ignored) continue;

          if (result?.message) {
            await sendWhatsAppMessage(whatsappPhone, result.message);
          }
        } catch (error) {
          console.error(
            "WhatsApp incoming message processing failed:",
            error?.message || error
          );

          // Best-effort customer-facing error response.
          try {
            await sendWhatsAppMessage(
              whatsappPhone,
              "Sorry, we could not process your request right now. Please try again later."
            );
          } catch (sendError) {
            console.error(
              "WhatsApp error reply failed:",
              sendError?.message || sendError
            );
          }
        }
      }
    }
  }
}

router.post("/webhook", (req, res) => {
  // Acknowledge Meta immediately. Do not log the full payload because it
  // contains customer phone numbers and message contents.
  res.sendStatus(200);

  void processIncomingMessages(req.body).catch((error) => {
    console.error(
      "WhatsApp webhook background processing failed:",
      error?.message || error
    );
  });
});

export default router;
