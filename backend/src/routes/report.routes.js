import express from "express";

import {
  getMonthlyDeliveryReport,
} from "../controllers/report.controller.js";

const router = express.Router();

/* ==========================================
   Monthly Delivery Report
========================================== */

router.get(
  "/monthly-delivery",
  getMonthlyDeliveryReport
);

export default router;