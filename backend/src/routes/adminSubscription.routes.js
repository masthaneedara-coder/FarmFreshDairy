
import express from "express";

import {
  getAllSubscriptions,
  updateSubscriptionStatus,
  sendExpiryReminders,
} from "../controllers/adminSubscription.controller.js";

const router = express.Router();

// Existing subscription APIs
router.get("/", getAllSubscriptions);

router.put("/:id/status", updateSubscriptionStatus);

// Existing bulk expiry reminder API
router.post("/send-expiry-reminders", sendExpiryReminders);

export default router;
