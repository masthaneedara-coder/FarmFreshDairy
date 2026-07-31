import express from "express";
import {
  generateTodayDeliveries,
  getTodayDeliveries,
  getDeliveryById,
  assignSubscriptionDelivery,
  updateDeliveryStatus,
  deleteDelivery,
} from "../controllers/subscriptionDelivery.controller.js";

const router = express.Router();

router.post("/generate", generateTodayDeliveries);

router.get("/", getTodayDeliveries);

router.get("/:id", getDeliveryById);

router.put("/:id/assign", assignSubscriptionDelivery);

router.put("/:id/status", updateDeliveryStatus);

router.delete("/:id", deleteDelivery);

export default router;