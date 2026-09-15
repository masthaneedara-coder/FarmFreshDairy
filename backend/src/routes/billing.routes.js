import express from "express";

import {
  getAllBills,
  getBillById,
  createOrderInvoice,
  updateBillingStatus,
  generateMonthlyInvoices,
  getSubscriptionBills,
} from "../controllers/billing.controller.js";

const router = express.Router();

// ======================================
// Get All Billing Records
// ======================================
router.get("/", getAllBills);

// ======================================
// Get Subscription Billing Records
// IMPORTANT: Keep this BEFORE /:id
// ======================================
router.get(
  "/subscription-bills",
  getSubscriptionBills
);

// ======================================
// Generate Subscription Bills
// ======================================
router.post(
  "/generate-subscription-bills",
  generateMonthlyInvoices
);

router.post(
  "/generate",
  generateMonthlyInvoices
);

// ======================================
// Order Invoice
// ======================================
router.post(
  "/order/:orderId",
  createOrderInvoice
);

// ======================================
// Update Payment Status
// ======================================
router.put(
  "/:id/status",
  updateBillingStatus
);

// ======================================
// Get Bill By ID
// IMPORTANT: Keep this LAST
// ======================================
router.get(
  "/:id",
  getBillById
);

export default router;