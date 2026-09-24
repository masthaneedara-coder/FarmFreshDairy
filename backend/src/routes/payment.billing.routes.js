import express from "express";

import {
  createBillingPaymentOrder,
  verifyBillingPayment,
} from "../controllers/payment.billing.controller.js";

const router = express.Router();

router.post(
  "/create-billing-order",
  createBillingPaymentOrder
);

router.post(
  "/verify-billing",
  verifyBillingPayment
);

export default router;