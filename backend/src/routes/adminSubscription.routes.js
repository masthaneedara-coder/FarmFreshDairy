import express from "express";
import {
  getAllSubscriptions,
  updateSubscriptionStatus,
  sendExpiryReminders
} from "../controllers/adminSubscription.controller.js";

const router = express.Router();

router.get("/", getAllSubscriptions);
router.put("/:id/status", updateSubscriptionStatus);
// One-click bulk WhatsApp expiry reminders
router.post("/send-expiry-reminders", sendExpiryReminders);

export default router;