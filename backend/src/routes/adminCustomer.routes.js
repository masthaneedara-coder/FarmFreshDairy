import express from "express";
import {
  getAllCustomers,
  getCustomerById,
} from "../controllers/adminCustomer.controller.js";

const router = express.Router();

// ====================================
// Customers
// ====================================

// Get All Customers
router.get("/", getAllCustomers);

// Get Customer By ID
router.get("/:id", getCustomerById);

export default router;