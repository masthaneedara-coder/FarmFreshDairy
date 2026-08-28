import express from "express";

import {
  generateTodayDeliveries,
  getTodayDeliveries,
  getDeliveryById,
  assignSubscriptionDelivery,
  deleteDelivery,
  getCustomerDeliverySummary,
  bulkAssignSubscriptionDeliveries,
  updateSubscriptionDeliveryStatus,
} from "../controllers/subscriptionDelivery.controller.js";

const router = express.Router();

router.post(
  "/generate",
  generateTodayDeliveries
);

router.get(
  "/",
  getTodayDeliveries
);

router.get(
  "/customer/:customerId/summary",
  getCustomerDeliverySummary
);

router.get(
  "/:id",
  getDeliveryById
);

router.put(
  "/bulk-assign",
  bulkAssignSubscriptionDeliveries
);

router.put(
  "/:id/assign",
  assignSubscriptionDelivery
);

// ✅ Subscription delivery status
router.put(
  "/:deliveryId/status",
  updateSubscriptionDeliveryStatus
);

router.delete(
  "/:id",
  deleteDelivery
);

export default router;