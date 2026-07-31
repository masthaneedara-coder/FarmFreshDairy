import express from "express";

import {
  getAllBills,
  getBillById,
  createOrderInvoice,
  updateBillingStatus,
  generateMonthlyInvoices,
  getSubscriptionBills
} from "../controllers/billing.controller.js";

const router = express.Router();

router.get("/", getAllBills);

router.get("/:id", getBillById);

router.post("/order/:orderId", createOrderInvoice);

// THIS MUST EXIST
router.put("/:id/status", updateBillingStatus);
router.post(
  "/generate-subscription-bills",
  generateMonthlyInvoices
);
router.get(
    "/subscription-bills",
    getSubscriptionBills
);
router.post("/generate", generateMonthlyInvoices);

export default router;