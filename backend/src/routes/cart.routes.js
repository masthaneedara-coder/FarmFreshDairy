import express from "express";

import {
  addToCart,
  getCart,
  updateCart,
  removeCartItem,
  clearCart,
} from "../controllers/cart.controller.js";

const router = express.Router();

// Add item
router.post("/", addToCart);

// Get customer's cart
router.get("/:customerId", getCart);

// Update quantity
router.put("/:id", updateCart);

// Remove one item
router.delete("/:id", removeCartItem);

// Clear entire cart
router.delete("/customer/:customerId", clearCart);

export default router;