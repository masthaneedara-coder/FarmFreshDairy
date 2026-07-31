import express from "express";

import {
  getCustomerAddresses,
  getAddressById,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "../controllers/address.controller.js";

const router = express.Router();

/* ==========================================================
   Address APIs
========================================================== */

// Get all addresses of a customer
router.get("/customer/:customerId", getCustomerAddresses);

// Get single address
router.get("/:id", getAddressById);

// Create address
router.post("/", createAddress);

// Update address
router.put("/:id", updateAddress);

// Delete address
router.delete("/:id", deleteAddress);

// Set default address
router.put("/:id/default", setDefaultAddress);

export default router;