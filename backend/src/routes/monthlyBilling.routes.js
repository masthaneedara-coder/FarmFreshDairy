
import express from "express";

import {
  generateBills,
  getBills,
  getCustomerBill,
  markBillPaid,
  getBillDetails,
  applyCouponToMonthlyBill
} from "../controllers/monthlyBilling.controller.js";

const router = express.Router();

router.post("/generate", generateBills);

router.get("/", getBills);

// Get detailed bill for a subscription
router.get("/details/:subscriptionId", getBillDetails);

// Get monthly bill for a subscription
router.get("/:subscriptionId", getCustomerBill);

// Mark bill paid (admin-only; protect with your auth middleware)
router.put("/:id/pay", markBillPaid);
router.post("/:id/apply-coupon", applyCouponToMonthlyBill);

export default router;