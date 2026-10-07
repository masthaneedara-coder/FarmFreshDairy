import express from "express";
import { loginAdmin,  getAutoAssignSettingController,
  setAutoAssignSettingController, } from "../controllers/admin.controller.js";

const router = express.Router();

router.post("/login", loginAdmin);
router.get(
  "/auto-assign",
  getAutoAssignSettingController
);

router.put(
  "/auto-assign",
  setAutoAssignSettingController
);

export default router;