
import {
  createOrderService,
  verifyPaymentService,
} from "../services/payment.service.js";

/* ==========================================================
   Create Razorpay Order
========================================================== */

export async function createOrder(req, res) {
  try {
    const {
      amount,
      customer_id,
      subscription_id,
    } = req.body;

    if (!amount || !Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid amount is required.",
      });
    }

    if (!customer_id) {
      return res.status(400).json({
        success: false,
        message: "Customer ID is required.",
      });
    }

    if (!subscription_id) {
      return res.status(400).json({
        success: false,
        message: "Subscription ID is required.",
      });
    }

    const { data, error } = await createOrderService({
      amount: Number(amount),
      customer_id,
      subscription_id,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    if (!data?.id) {
      return res.status(500).json({
        success: false,
        message: "Razorpay order was not created successfully.",
      });
    }

    return res.status(201).json({
      success: true,
      order: data,
    });
  } catch (err) {
    console.error("Create Order Error:", err);

    return res.status(500).json({
      success: false,
      message: err.message || "Unable to create payment order.",
    });
  }
}

/* ==========================================================
   Verify Razorpay Payment
========================================================== */

export async function verifyPayment(req, res) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      customer_id,
      subscription_id,
    } = req.body;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        message: "Razorpay payment details are required.",
      });
    }

    if (!customer_id || !subscription_id) {
      return res.status(400).json({
        success: false,
        message: "Customer ID and Subscription ID are required.",
      });
    }

    const { data, error } = await verifyPaymentService({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      customer_id,
      subscription_id,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.json({
      success: true,
      payment: data,
    });
  } catch (err) {
    console.error("Verify Payment Error:", err);

    return res.status(500).json({
      success: false,
      message: err.message || "Payment verification failed.",
    });
  }
}
