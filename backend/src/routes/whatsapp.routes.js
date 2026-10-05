import express from "express";

const router = express.Router();

// Meta webhook verification
router.get("/webhook", (req, res) => {
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  console.log("🔐 WhatsApp webhook verification request");

  if (mode === "subscribe" && token === verifyToken) {
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

  // Acknowledge Meta immediately
  res.sendStatus(200);
});

export default router;