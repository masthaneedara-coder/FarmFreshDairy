import express from "express";
import { registerDevice } from "../controllers/customerDevice.controller.js";
import { authenticateUser } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/register", authenticateUser, registerDevice);

export default router;