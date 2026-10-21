import express from "express";
import {
  createRenewalOrder,
  verifyRenewalPayment,
  renewByCod,
} from "../controllers/subscriptionRenewalPayment.controller.js";

const router = express.Router();

router.post("/:token/create-order", createRenewalOrder);
router.post("/:token/verify", verifyRenewalPayment);
router.post("/:token/cod", renewByCod);

export default router;