import express from "express";

import {
  createExtraMilkRequest,
  getExtraMilkRequests,
  getCustomerExtraMilk,
  approveExtraMilk,
  rejectExtraMilk,
  cancelExtraMilk,
} from "../controllers/extraMilk.controller.js";

const router = express.Router();

router.post("/", createExtraMilkRequest);

router.get("/", getExtraMilkRequests);

router.get(
  "/customer/:customerId",
  getCustomerExtraMilk
);

router.put(
  "/:id/approve",
  approveExtraMilk
);

router.put(
  "/:id/reject",
  rejectExtraMilk
);

router.put(
  "/:id/cancel",
  cancelExtraMilk
);

export default router;