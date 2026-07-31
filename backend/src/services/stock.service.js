import { supabaseAdmin } from "../config/supabase.js";

export async function getRemainingStock(productId) {

  const { data: product, error } = await supabaseAdmin
    .from("products")
    .select("stock")
    .eq("id", productId)
    .single();

  if (error) throw error;

  const stock = Number(product.stock || 0);

  return stock;
}