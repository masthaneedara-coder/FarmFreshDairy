import express from "express";

import {
  getAllBills,
  getBillById,
  createOrderInvoice,
  updateBillingStatus,
  generateMonthlyInvoices,
  getSubscriptionBills,
  payBilling,
} from "../controllers/billing.controller.js";

const router = express.Router();

router.get("/", getAllBills);

router.get(
  "/subscription",
  getSubscriptionBills
);

router.get(
  "/:id",
  getBillById
);

router.post(
  "/order/:orderId",
  createOrderInvoice
);

router.put(
  "/:id/status",
  updateBillingStatus
);

router.post(
  "/:id/pay",
  payBilling
);

router.post(
  "/generate-monthly",
  generateMonthlyInvoices
);

export default router;