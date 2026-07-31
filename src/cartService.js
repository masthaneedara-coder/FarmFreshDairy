import { addCartItem } from "../config/api";

export async function addProductToCart(cartItem) {
  return await addCartItem(cartItem);
}