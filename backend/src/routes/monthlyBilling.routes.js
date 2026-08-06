import express from "express";

import {
  generateBills,
  getBills,
  getCustomerBill,
  markBillPaid,
  getBillDetails
} from "../controllers/monthlyBilling.controller.js";

const router = express.Router();

router.post("/generate", generateBills);

router.get("/", getBills);

router.get("/:customerId", getCustomerBill);

router.put("/:id/pay", markBillPaid);
router.get(
    "/details/:customerId",
    getBillDetails
);

export default router;