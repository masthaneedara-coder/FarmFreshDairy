import express from "express";

import {
  createSubscription,
  getCustomerSubscription,
  getSubscriptionHistory,
  getBillingSummary,
  getUpcomingDelivery,
  getSubscriptionById,
  updateSubscription,
  updateSubscriptionStatus,
  deleteSubscription,
  renewSubscription,
  generateTodayDeliveriesController,
  getSubscriptionDeliverySummary,
   pauseSubscription,
  resumeSubscription,
  
} from "../controllers/subscription.controller.js";

const router = express.Router();

/* ==========================================================
   Customer Dashboard
========================================================== */

// Active subscription
router.get("/customer/:customerId", getCustomerSubscription);

// Subscription history
router.get("/history/:customerId", getSubscriptionHistory);

// Billing summary
router.get("/billing/:customerId", getBillingSummary);

// Upcoming delivery
router.get("/upcoming/:customerId", getUpcomingDelivery);

/* ==========================================================
   CRUD
========================================================== */

// Create
router.post("/", createSubscription);

// Get one subscription
router.get("/:id", getSubscriptionById);

// Update subscription
router.put("/:id", updateSubscription);

// Pause / Resume / Cancel
router.put("/:id/status", updateSubscriptionStatus);

// Renew
router.put("/:id/renew", renewSubscription);

// Delete
router.delete("/:id", deleteSubscription);
router.post(
  "/generate-daily-deliveries",
  generateTodayDeliveriesController
);
router.get(
  "/:id/delivery-summary",
  getSubscriptionDeliverySummary
);
router.post("/:id/pause", pauseSubscription);

router.post("/:id/resume", resumeSubscription);


export default router;