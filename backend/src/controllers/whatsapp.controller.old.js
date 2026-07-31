import {
  sendWhatsAppMessage,
} from "../services/whatsapp.service.js";

/* ======================================
   Send Test WhatsApp Message
====================================== */

export async function sendTestMessage(req, res) {

  try {

    const {
      phone,
      message,
    } = req.body;

    if (!phone || !message) {

      return res.status(400).json({
        success: false,
        message: "Phone and message are required.",
      });

    }

    await sendWhatsAppMessage(
      phone,
      message
    );

    res.json({
      success: true,
      message: "WhatsApp message sent successfully.",
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });

  }

}