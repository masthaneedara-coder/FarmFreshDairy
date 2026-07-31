import {
  createOrderService,
  createOrderItemsService,
  getCustomerOrdersService,
  getAllOrdersService,
  getOrderByIdService,
  updateOrderStatusService,
  updatePaymentStatusService,
  assignDeliveryBoyService,
  deleteOrderService,
} from "../services/order.service.js";
import { generateOrderNumber } from "../utils/orderNumber.js";
import { reduceStockService } from "../services/inventory.service.js";
import { createPaymentService } from "../services/payment.service.js";
import { clearCartService } from "../services/cart.service.js";

// ==============================
// Create Order
// ==============================
export const createOrder = async (req, res) => {
  try {
    const { order, items } = req.body;

    if (!order || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order data is required",
      });
    }

    // Generate Order Number
    const orderNumber = await generateOrderNumber();

    // Save Order
    const { data: savedOrder, error } =
      await createOrderService({
        ...order,
        order_number: orderNumber,
      });

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    // Save Order Items
    const orderItems = items.map((item) => ({
      order_id: savedOrder.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price,
      size: item.size,
    }));

    const { data: savedItems, error: itemError } =
      await createOrderItemsService(orderItems);

    if (itemError) {
      return res.status(400).json({
        success: false,
        message: itemError.message,
      });
    }

    // Reduce Stock
    await reduceStockService(orderItems);

    // Clear Cart
    await clearCartService(order.customer_id);

    // Create Payment Record
    await createPaymentService({
      order_id: savedOrder.id,
      customer_id: order.customer_id,
      amount: order.total_amount,
      payment_method: order.payment_method,
      payment_status: order.payment_status,
    });

    return res.status(201).json({
      success: true,
      message: "Order Placed Successfully",
      order: savedOrder,
      items: savedItems,
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ==============================
// Customer Orders
// ==============================
export const getCustomerOrders = async (req, res) => {
  try {
    const { customerId } = req.params;

    const { data, error } =
      await getCustomerOrdersService(customerId);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.json({
      success: true,
      orders: data,
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ==============================
// Admin Orders
// ==============================
export const getAllOrders = async (req, res) => {
  try {
    const { data, error } =
      await getAllOrdersService();

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.json({
      success: true,
      orders: data,
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ==============================
// Single Order
// ==============================
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } =
      await getOrderByIdService(id);

    if (error) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.json({
      success: true,
      order: data,
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ==============================
// Update Status
// ==============================
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const { data, error } =
      await updateOrderStatusService(id, status);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.json({
      success: true,
      message: "Status Updated",
      order: data,
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ==============================
// Update Payment
// ==============================
export const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      payment_status,
      payment_method,
      transaction_id,
      received_by,
    } = req.body;

    const order =
      await updatePaymentStatusService(
        id,
        {
          payment_status,
          payment_method,
          transaction_id,
          received_by,
        }
      );

    return res.status(200).json({
      success: true,
      message: "Payment updated successfully.",
      order,
    });

  } catch (err) {

    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });

  }
};
// ==============================
// Assign Delivery Boy
// ==============================
export const assignDeliveryBoy = async (req, res) => {
  try {
    const { id } = req.params;
    const { delivery_boy_id } = req.body;

    const { data, error } =
      await assignDeliveryBoyService(
        id,
        delivery_boy_id
      );

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.json({
      success: true,
      message: "Delivery Boy Assigned",
      order: data,
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ==============================
// Delete Order
// ==============================
export const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } =
      await deleteOrderService(id);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.json({
      success: true,
      message: "Order Deleted Successfully",
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};