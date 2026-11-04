import express from "express";
import {
  getPauseManagement,
  submitPauseManagement,
} from "../controllers/subscriptionManagement.controller.js";

const router = express.Router();

// The unguessable token is the bearer credential for these two endpoints.
router.get("/:token", getPauseManagement);
router.post("/:token/pause", express.json(), submitPauseManagement);

export default router;
