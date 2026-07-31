import { supabaseAdmin } from "../config/supabase.js";

export const loginAdminService = async (email) => {
  return await supabaseAdmin
    .from("admins")
    .select("*")
    .eq("email", email)
    .single();
};