import express from "express";

import {
  generateTodayDeliveries,
  getTodayDeliveries,
  getPreviousPendingDeliveries,
  getDeliveryById,
  assignSubscriptionDelivery,
  deleteDelivery,
  getCustomerDeliverySummary,
  bulkAssignSubscriptionDeliveries,
  updateSubscriptionDeliveryStatus,
  getSubscriptionDeliveryOverrides,
  saveSubscriptionDeliveryOverrides,
  deleteSubscriptionDeliveryOverride,
  getAllSubscriptionDeliveryOverrides
} from "../controllers/subscriptionDelivery.controller.js";

const router = express.Router();

// Delivery generation
router.post("/generate", generateTodayDeliveries);

// Today's deliveries
router.get("/", getTodayDeliveries);

// Previous scheduled days that still need admin review.
// Keep this route before the generic /:id route below.
router.get("/previous-pending", getPreviousPendingDeliveries);

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


// ==========================================
// ADMIN: GET ALL CUSTOMER DELIVERY OVERRIDES
// ==========================================
router.get(
  "/overrides",
  getAllSubscriptionDeliveryOverrides
);

// Keep this generic route AFTER /overrides
router.get("/:id", getDeliveryById);

router.put("/bulk-assign", bulkAssignSubscriptionDeliveries);

router.put("/:id/assign", assignSubscriptionDelivery);

router.put(
  "/:deliveryId/status",
  updateSubscriptionDeliveryStatus
);

router.delete("/:id", deleteDelivery);

export default router;
