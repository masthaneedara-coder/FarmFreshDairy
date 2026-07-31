import express from "express";

import {
  getCustomerByPhone,
} from "../controllers/customer.controller.js";

const router = express.Router();

router.get("/phone/:phone", getCustomerByPhone);

export default router;