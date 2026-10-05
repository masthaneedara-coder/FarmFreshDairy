import express from "express";

const router = express.Router();

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

// Meta webhook verification
router.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ WhatsApp webhook verified");
    return res.status(200).send(challenge);
  }

  console.log("❌ WhatsApp webhook verification failed");
  return res.sendStatus(403);
});

// Receive WhatsApp messages/events
router.post("/webhook", (req, res) => {
  console.log("📩 WhatsApp webhook received:");
  console.log(JSON.stringify(req.body, null, 2));

  // Always acknowledge Meta quickly
  res.sendStatus(200);

  // We will add pause-subscription logic here later
});

export default router;