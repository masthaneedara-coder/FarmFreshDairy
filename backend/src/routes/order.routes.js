import express from "express";

import {
  createOrder,
  getCustomerOrders,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  updatePaymentStatus,
  assignDeliveryBoy,
  deleteOrder,
} from "../controllers/order.controller.js";

const router = express.Router();

// Customer
router.post("/", createOrder);
router.get("/customer/:customerId", getCustomerOrders);

// Admin
router.get("/", getAllOrders);
router.get("/:id", getOrderById);

router.put("/:id/status", updateOrderStatus);
router.put("/:id/payment", updatePaymentStatus);
router.put("/:id/assign", assignDeliveryBoy);

router.delete("/:id", deleteOrder);

export default router;