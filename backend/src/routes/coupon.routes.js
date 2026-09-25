import express from "express";

import {
  validateCoupon,
} from "../controllers/coupon.controller.js";

const router = express.Router();

router.post("/validate", validateCoupon);

export default router;