export default function handler(req, res) {
  console.log("🚀 WhatsApp webhook function started");
  console.log("Method:", req.method);

  if (req.method === "GET") {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    console.log("Mode:", mode);
    console.log("Token received:", !!token);

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

  if (req.method === "POST") {
    console.log("📩 WhatsApp POST received");
    console.log(JSON.stringify(req.body, null, 2));

    return res.status(200).send("EVENT_RECEIVED");
  }

  return res.status(405).send("Method Not Allowed");
}