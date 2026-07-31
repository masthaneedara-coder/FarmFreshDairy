import express from "express";
import { getAllOrders, getOrderById, updateOrderStatus,assignDeliveryBoy } from "../controllers/adminOrder.controller.js";

const router = express.Router();

router.get("/", getAllOrders);
router.get("/:id", getOrderById);
router.put("/:id/status", updateOrderStatus);
router.put("/:id/assign", assignDeliveryBoy);


export default router;