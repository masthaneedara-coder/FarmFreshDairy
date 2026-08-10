import express from "express";

import {
  createExtraMilkRequest,
  getExtraMilkRequests,
  getCustomerExtraMilk,
  approveExtraMilk,
  rejectExtraMilk,
  cancelExtraMilk
} from "../controllers/extraMilk.controller.js";

const router = express.Router();

// Create Request
router.post("/", createExtraMilkRequest);

// Admin List
router.get("/", getExtraMilkRequests);

// Customer History
router.get("/customer/:customerId", getCustomerExtraMilk);

// Approve
router.put("/:id/approve", approveExtraMilk);

// Reject
router.put("/:id/reject", rejectExtraMilk);
router.put("/:id/cancel", cancelExtraMilk);

export default router;