import {
  addToCartService,
  getCartService,
  updateCartService,
  removeCartItemService,
  clearCartService,
} from "../services/cart.service.js";

// Add item to cart
export const addToCart = async (req, res) => {
  try {
    const {
      customer_id,
      product_id,
      quantity,
      price,
      size,
    } = req.body;

    if (!customer_id || !product_id) {
      return res.status(400).json({
        success: false,
        message: "Customer and Product are required",
      });
    }

    const { data, error } = await addToCartService({
      customer_id,
      product_id,
      quantity,
      price,
      size,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Item added to cart",
      cart: data,
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Get customer's cart
export const getCart = async (req, res) => {
  try {
    const { customerId } = req.params;

    const { data, error } = await getCartService(customerId);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.json({
      success: true,
      cart: data,
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Update quantity
export const updateCart = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    const { data, error } = await updateCartService(id, quantity);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.json({
      success: true,
      message: "Cart updated",
      cart: data,
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Remove one item
export const removeCartItem = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await removeCartItemService(id);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.json({
      success: true,
      message: "Item removed from cart",
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Clear cart
export const clearCart = async (req, res) => {
  try {
    const { customerId } = req.params;

    const { error } = await clearCartService(customerId);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.json({
      success: true,
      message: "Cart cleared",
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};