
import {
  getActiveAnnouncementsService,
  getAllAnnouncementsService,
  createAnnouncementService,
  updateAnnouncementService,
  deleteAnnouncementService,
  validAnnouncementDate,
} from "../services/announcement.service.js";

import {
  uploadAnnouncementImage,
} from "../services/storage.service.js";

const allowedFields = [
  "title",
  "message",
  "image_url",
  "start_date",
  "end_date",
  "show_on_home",
  "show_on_dashboard",
  "show_on_renewal",
  "is_active",
];

const validateAnnouncement = (body, partial = false) => {
  const payload = {};

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      payload[field] = body[field];
    }
  }

  if (!partial || payload.title !== undefined) {
    if (typeof payload.title !== "string" || !payload.title.trim()) {
      throw new Error("Announcement title is required.");
    }
    payload.title = payload.title.trim();
  }

  if (!partial || payload.message !== undefined) {
    if (typeof payload.message !== "string" || !payload.message.trim()) {
      throw new Error("Announcement message is required.");
    }
    payload.message = payload.message.trim();
  }

  for (const field of ["start_date", "end_date"]) {
    if (payload[field] !== undefined && !validAnnouncementDate(payload[field])) {
      throw new Error(`${field} must be a valid YYYY-MM-DD date.`);
    }
  }

  if (
    !partial &&
    (!payload.start_date || !payload.end_date)
  ) {
    throw new Error("Start date and end date are required.");
  }

  if (
    payload.start_date &&
    payload.end_date &&
    payload.end_date < payload.start_date
  ) {
    throw new Error("End date cannot be before start date.");
  }

  for (const field of [
    "show_on_home",
    "show_on_dashboard",
    "show_on_renewal",
    "is_active",
  ]) {
    if (
      payload[field] !== undefined &&
      typeof payload[field] !== "boolean"
    ) {
      throw new Error(`${field} must be true or false.`);
    }
  }

  if (
    payload.image_url !== undefined &&
    payload.image_url !== null &&
    typeof payload.image_url !== "string"
  ) {
    throw new Error("Invalid image URL.");
  }

  return payload;
};

export const getActiveAnnouncements = async (req, res) => {
  try {
    const placement = String(req.query.placement || "home").toLowerCase();

    const announcements =
      await getActiveAnnouncementsService(placement);

    return res.json({
      success: true,
      announcements,
    });
  } catch (error) {
    console.error("Get active announcements:", error.message);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllAnnouncements = async (req, res) => {
  try {
    const announcements = await getAllAnnouncementsService();

    return res.json({
      success: true,
      announcements,
    });
  } catch (error) {
    console.error("Get all announcements:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to load announcements.",
    });
  }
};

export const createAnnouncement = async (req, res) => {
  try {
    const payload = validateAnnouncement(req.body);

    const announcement = await createAnnouncementService(
      payload,
      req.admin.id
    );

    return res.status(201).json({
      success: true,
      message: "Announcement created successfully.",
      announcement,
    });
  } catch (error) {
    console.error("Create announcement:", error.message);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateAnnouncement = async (req, res) => {
  try {
    const payload = validateAnnouncement(req.body, true);

    if (!Object.keys(payload).length) {
      return res.status(400).json({
        success: false,
        message: "No valid announcement fields provided.",
      });
    }

    const announcement = await updateAnnouncementService(
      req.params.id,
      payload
    );

    return res.json({
      success: true,
      message: "Announcement updated successfully.",
      announcement,
    });
  } catch (error) {
    console.error("Update announcement:", error.message);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteAnnouncement = async (req, res) => {
  try {
    await deleteAnnouncementService(req.params.id);

    return res.json({
      success: true,
      message: "Announcement deleted successfully.",
    });
  } catch (error) {
    console.error("Delete announcement:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to delete announcement.",
    });
  }
};

export const uploadAnnouncementImageController = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select an announcement image.",
      });
    }

    const imageUrl = await uploadAnnouncementImage(req.file);

    return res.json({
      success: true,
      image_url: imageUrl,
      message: "Announcement image uploaded successfully.",
    });
  } catch (error) {
    console.error("Announcement image upload:", error.message);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
