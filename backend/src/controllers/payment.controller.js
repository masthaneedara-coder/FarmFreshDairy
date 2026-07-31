import {
  createOrderService,
  verifyPaymentService,
} from "../services/payment.service.js";

/* ==========================================================
   Create Razorpay Order
========================================================== */

export async function createOrder(req, res) {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid amount is required.",
      });
    }

    const { data, error } = await createOrderService(amount);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
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
      message: err.message,
    });
  }
}

/* ==========================================================
   Verify Razorpay Payment
========================================================== */

export async function verifyPayment(req, res) {
  try {
    const { data, error } = await verifyPaymentService(req.body);

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
      message: err.message,
    });
  }
}