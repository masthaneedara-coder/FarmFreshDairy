import { supabaseAdmin } from "../config/supabase.js";

// Add item to cart
export const addToCartService = async (cartItem) => {
  return await supabaseAdmin
    .from("cart_items")
    .insert(cartItem)
    .select()
    .single();
};

// Get customer's cart
export const getCartService = async (customerId) => {
  console.log("Searching Cart For:", customerId);

  const result = await supabaseAdmin
    .from("cart_items")
    .select(`
      *,
      products(
        id,
        name,
        image,
        price,
        size,
        unit,
        weight
      )
    `)
    .eq("customer_id", customerId);

  console.log(result.data);

  return result;
};

// Update quantity
export const updateCartService = async (id, quantity) => {
  return await supabaseAdmin
    .from("cart_items")
    .update({
      quantity,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();
};

// Remove one item
export const removeCartItemService = async (id) => {
  return await supabaseAdmin
    .from("cart_items")
    .delete()
    .eq("id", id);
};

// Clear entire cart
export const clearCartService = async (customerId) => {
  return await supabaseAdmin
    .from("cart_items")
    .delete()
    .eq("customer_id", customerId);
};