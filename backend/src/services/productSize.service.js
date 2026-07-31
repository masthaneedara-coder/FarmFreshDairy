import { supabaseAdmin } from "../config/supabase.js";

/* -----------------------------
   Get Sizes By Product
------------------------------*/
export const getProductSizesService = async (productId) => {
  return await supabaseAdmin
    .from("product_sizes")
    .select("*")
    .eq("product_id", productId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
};

/* -----------------------------
   Create Size
------------------------------*/
export const createProductSizeService = async (size) => {
  console.log("Insert Payload:", size);

  const result = await supabaseAdmin
    .from("product_sizes")
    .insert(size)
    .select()
    .single();

  console.log("Insert Result:", result);

  return result;
};

/* -----------------------------
   Update Size
------------------------------*/
export const updateProductSizeService = async (id, size) => {
  return await supabaseAdmin
    .from("product_sizes")
    .update(size)
    .eq("id", id)
    .select()
    .single();
};

/* -----------------------------
   Delete Size
------------------------------*/
export const deleteProductSizeService = async (id) => {
  return await supabaseAdmin
    .from("product_sizes")
    .delete()
    .eq("id", id);
};