import { supabaseAdmin } from "../config/supabase.js";

// Reduce stock after order
export const reduceStockService = async (items) => {
  for (const item of items) {
    // Get current stock
    const { data: product, error } = await supabaseAdmin
      .from("products")
      .select("stock")
      .eq("id", item.product_id)
      .single();

    if (error) throw error;

    const newStock = Number(product.stock) - Number(item.quantity);

    if (newStock < 0) {
      throw new Error(
        `Insufficient stock for product ${item.product_id}`
      );
    }

    const { error: updateError } = await supabaseAdmin
      .from("products")
      .update({
        stock: newStock,
      })
      .eq("id", item.product_id);

    if (updateError) throw updateError;
  }
};