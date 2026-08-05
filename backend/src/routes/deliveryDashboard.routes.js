import express from "express";
import {
    getDeliveryDashboard,
    updateDeliveryStatus
} from "../controllers/deliveryDashboard.controller.js";

const router = express.Router();

router.get(
    "/:deliveryBoyId",
    getDeliveryDashboard
);
router.patch(
  "/:orderId/status",
  updateDeliveryStatus
);

export default router;