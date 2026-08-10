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

router.get("/details/:subscriptionId", getBillDetails);

// Generic route LAST
router.get("/:customerId", getCustomerBill);

router.put("/:id/pay", markBillPaid);



export default router;