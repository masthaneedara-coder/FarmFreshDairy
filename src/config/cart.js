

/* -----------------------------
   GET CART
----------------------------- */
export function getCart() {
  try {
    const cart = JSON.parse(
  localStorage.getItem(getCartKey()) || "[]"
);
    return Array.isArray(cart) ? cart : [];
  } catch {
    return [];
  }
}

/* -----------------------------
   SAVE CART
----------------------------- */
export function saveCart(cart) {
 localStorage.setItem(
  getCartKey(),
  JSON.stringify(cart)
);
  window.dispatchEvent(new Event("cartUpdated"));
}

/* -----------------------------
   ADD TO CART
----------------------------- */
export function addToCart(product) {
  const cart = getCart();

  const existingIndex = cart.findIndex(
    (item) => item.id === product.id && item.size === product.size
  );

  if (existingIndex > -1) {
    cart[existingIndex].qty += product.qty || 1;
    cart[existingIndex].total =
      cart[existingIndex].qty * Number(cart[existingIndex].price || 0);
  } else {
    cart.push({
      ...product,
      qty: product.qty || 1,
      price: Number(product.price || 0),
      total: (product.qty || 1) * Number(product.price || 0),
    });
  }

  saveCart(cart);
  return cart;
}

/* -----------------------------
   ALIAS FOR OLD CODE SUPPORT
----------------------------- */
export function addItemToCart(product) {
  return addToCart(product);
}

/* -----------------------------
   REMOVE ITEM
----------------------------- */
export function removeCartItem(index) {
  const cart = getCart();
  cart.splice(index, 1);
  saveCart(cart);
  return cart;
}

/* -----------------------------
   INCREASE ITEM QTY
----------------------------- */
export function increaseCartItemQty(index) {
  const cart = getCart();

  if (!cart[index]) return cart;

  cart[index].qty += 1;
  cart[index].total = cart[index].qty * Number(cart[index].price || 0);

  saveCart(cart);
  return cart;
}

/* -----------------------------
   DECREASE ITEM QTY
----------------------------- */
export function decreaseCartItemQty(index) {
  const cart = getCart();

  if (!cart[index]) return cart;

  if (cart[index].qty > 1) {
    cart[index].qty -= 1;
    cart[index].total = cart[index].qty * Number(cart[index].price || 0);
  } else {
    cart.splice(index, 1);
  }

  saveCart(cart);
  return cart;
}

/* -----------------------------
   CLEAR CART
----------------------------- */
export function clearCart() {
 localStorage.removeItem(getCartKey());
  // Notify all components (Navbar, Cart, etc.)
  window.dispatchEvent(new Event("cartUpdated"));
}

/* -----------------------------
   CART TOTAL
----------------------------- */
export function getCartTotal() {
  return getCart().reduce((sum, item) => {
    return sum + Number(item.total || item.price * item.qty || 0);
  }, 0);
}

/* -----------------------------
   CART COUNT
----------------------------- */
export function getCartItemCount() {
  return getCart().reduce((sum, item) => sum + Number(item.qty || 0), 0);
}

/* -----------------------------
   ALIAS FOR OLD CODE SUPPORT
----------------------------- */
export function getCartCount() {
  return getCartItemCount();
}

function getCartKey() {
  const customer = JSON.parse(
    localStorage.getItem("customer")
  );

  return customer
    ? `cart_${customer.id}`
    : "guest_cart";
}