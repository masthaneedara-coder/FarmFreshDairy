import express from "express";
import {
    getDeliveryDashboard,
} from "../controllers/deliveryDashboard.controller.js";

const router = express.Router();

router.get(
    "/:deliveryBoyId",
    getDeliveryDashboard
);

export default router;