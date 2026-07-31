import express from "express";
import {
  getAllSubscriptions,
  updateSubscriptionStatus,
} from "../controllers/adminSubscription.controller.js";

const router = express.Router();

router.get("/", getAllSubscriptions);
router.put("/:id/status", updateSubscriptionStatus);

export default router;