import express from "express";
import {
  getAllNotifications,
  getNotificationCount,
  readNotification,
} from "../controllers/notification.controller.js";

const router = express.Router();

router.get("/", getAllNotifications);

router.get("/count", getNotificationCount);

router.put("/:id/read", readNotification);

export default router;