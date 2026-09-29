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
  getSubscriptionDeliveryOverrides,
  saveSubscriptionDeliveryOverrides,
  deleteSubscriptionDeliveryOverride,
} from "../controllers/subscriptionDelivery.controller.js";

const router = express.Router();

// Delivery generation
router.post("/generate", generateTodayDeliveries);

// Today's deliveries
router.get("/", getTodayDeliveries);

// Customer summary
router.get(
  "/customer/:customerId/summary",
  getCustomerDeliverySummary
);

// Product-specific delivery size overrides.
// Keep these routes before generic /:id routes.
router.get(
  "/:subscriptionId/delivery-overrides",
  getSubscriptionDeliveryOverrides
);

router.post(
  "/:subscriptionId/delivery-overrides",
  saveSubscriptionDeliveryOverrides
);

router.delete(
  "/:subscriptionId/delivery-overrides/:deliveryDate/:productId",
  deleteSubscriptionDeliveryOverride
);

// Generic delivery routes
router.get("/:id", getDeliveryById);

router.put("/bulk-assign", bulkAssignSubscriptionDeliveries);

router.put("/:id/assign", assignSubscriptionDelivery);

router.put(
  "/:deliveryId/status",
  updateSubscriptionDeliveryStatus
);

router.delete("/:id", deleteDelivery);

export default router;
