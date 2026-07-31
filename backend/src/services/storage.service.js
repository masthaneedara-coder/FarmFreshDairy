import { supabaseAdmin } from "../config/supabase.js";
import { randomUUID } from "crypto";

export const uploadProductImage = async (file) => {
  const fileName = `${randomUUID()}-${file.originalname}`;

  const { error } = await supabaseAdmin.storage
    .from("products")
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (error) {
     console.error("SUPABASE STORAGE ERROR:", error);
  throw error;
  }

  const { data } = supabaseAdmin.storage
    .from("products")
    .getPublicUrl(fileName);

  return data.publicUrl;
};