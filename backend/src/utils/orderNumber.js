import { supabaseAdmin } from "../config/supabase.js";

export const generateOrderNumber = async () => {
  const { count } = await supabaseAdmin
    .from("orders")
    .select("*", {
      count: "exact",
      head: true,
    });

  const next = String((count || 0) + 1).padStart(6, "0");

  return `FFD${next}`;
};