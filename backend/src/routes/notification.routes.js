import express from "express";

import {
  getAllNotifications,
  getNotificationCount,
  getCustomerNotificationsController,
  getCustomerNotificationCount,
  sendNotification,
  readNotification,
  readAllNotifications,
  readCustomerNotification,
  readAllCustomerNotifications,
  removeNotification,
  removeCustomerNotification,
  removeAllCustomerNotifications,
} from "../controllers/notification.controller.js";

const router = express.Router();

/* =========================================================
   ADMIN / GENERAL NOTIFICATIONS
========================================================= */

// Get all notifications
// GET /api/notifications
router.get("/", getAllNotifications);

// Get total unread notifications
// GET /api/notifications/count
router.get("/count", getNotificationCount);

// Create/send notification
// POST /api/notifications
router.post("/", sendNotification);

// Mark all notifications as read
// PUT /api/notifications/read-all
router.put("/read-all", readAllNotifications);

// Mark one notification as read
// PUT /api/notifications/:id/read
router.put("/:id/read", readNotification);

// Delete notification
// DELETE /api/notifications/:id
router.delete("/:id", removeNotification);


/* =========================================================
   CUSTOMER NOTIFICATIONS
========================================================= */

// Get customer's notifications
// GET /api/notifications/customer/:customerId
router.get(
  "/customer/:customerId",
  getCustomerNotificationsController
);

// Get customer's unread count
// GET /api/notifications/customer/:customerId/count
router.get(
  "/customer/:customerId/count",
  getCustomerNotificationCount
);

// Mark customer's notification as read
// PUT /api/notifications/customer/:customerId/:id/read
router.put(
  "/customer/:customerId/:id/read",
  readCustomerNotification
);

// Mark all customer's notifications as read
// PUT /api/notifications/customer/:customerId/read-all
router.put(
  "/customer/:customerId/read-all",
  readAllCustomerNotifications
);

// Delete customer's notification
// DELETE /api/notifications/customer/:customerId/:id
router.delete(
  "/customer/:customerId/:id",
  removeCustomerNotification
);

// Delete all customer's notifications
// DELETE /api/notifications/customer/:customerId
router.delete(
  "/customer/:customerId",
  removeAllCustomerNotifications
);

export default router;