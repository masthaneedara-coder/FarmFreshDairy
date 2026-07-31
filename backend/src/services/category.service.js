import { supabaseAdmin } from "../config/supabase.js";

export const getCategoriesService = async () => {
  return await supabaseAdmin
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("name");
};