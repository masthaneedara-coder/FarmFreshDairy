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
  removeNotification,
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

// Mark one notification as read
// PUT /api/notifications/:id/read
router.put("/:id/read", readNotification);

// Mark all notifications as read
// PUT /api/notifications/read-all
router.put("/read-all", readAllNotifications);

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

export default router;