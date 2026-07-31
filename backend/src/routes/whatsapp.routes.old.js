import express from "express";

import {
  sendTestMessage,
} from "../controllers/whatsapp.controller.old.js";

const router = express.Router();

/* ======================================
   Test WhatsApp Message
====================================== */

router.post(
  "/test",
  sendTestMessage
);

export default router;