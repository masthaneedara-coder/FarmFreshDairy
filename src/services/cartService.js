import {
  fetchCart,
  addCartItem,
} from "../config/api";

// ===============================
// Get Customer Cart
// ===============================

export async function getCart(customerId) {
  try {
    return await fetchCart(customerId);
  } catch (error) {
    console.error("getCart:", error);
    return [];
  }
}

// ===============================
// Add Product To Cart
// ===============================

export async function addProductToCart(cartItem) {
  try {
    return await addCartItem(cartItem);
  } catch (error) {
    console.error("addProductToCart:", error);
    throw error;
  }
}