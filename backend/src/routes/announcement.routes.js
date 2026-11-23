
import express from "express";

import {
  getActiveAnnouncements,
  getAllAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  uploadAnnouncementImageController,
} from "../controllers/announcement.controller.js";

import { authenticateAdmin } from "../middleware/adminAuth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";

const router = express.Router();

// Public customer endpoint
router.get("/active", getActiveAnnouncements);

// Admin-only endpoints
router.get("/admin", authenticateAdmin, getAllAnnouncements);

router.post("/", authenticateAdmin, createAnnouncement);

router.post(
  "/upload",
  authenticateAdmin,
  upload.single("image"),
  uploadAnnouncementImageController
);

router.put("/:id", authenticateAdmin, updateAnnouncement);

router.delete("/:id", authenticateAdmin, deleteAnnouncement);

export default router;
