
import { supabaseAdmin } from "../config/supabase.js";
import { randomUUID } from "node:crypto";
import path from "node:path";

const uploadImageToBucket = async (file, bucket) => {
  if (!supabaseAdmin) {
    throw new Error("Supabase admin client is not configured.");
  }

  if (!file || !file.buffer) {
    throw new Error("Image file is required.");
  }

  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  if (!allowedTypes.includes(file.mimetype)) {
    throw new Error("Only JPG, PNG and WEBP images are allowed.");
  }

  const maxSize = 5 * 1024 * 1024;

  if (file.size > maxSize) {
    throw new Error("Image size must not exceed 5 MB.");
  }

  const extensionMap = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
  };

  const extension =
    extensionMap[file.mimetype] ||
    path.extname(file.originalname || "").toLowerCase();

  const fileName = `${randomUUID()}${extension}`;

  const { error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (error) {
    console.error(`SUPABASE ${bucket} STORAGE ERROR:`, error);
    throw error;
  }

  const { data } = supabaseAdmin.storage
    .from(bucket)
    .getPublicUrl(fileName);

  return data.publicUrl;
};

export const uploadProductImage = async (file) => {
  return uploadImageToBucket(file, "products");
};

export const uploadAnnouncementImage = async (file) => {
  return uploadImageToBucket(file, "announcements");
};
