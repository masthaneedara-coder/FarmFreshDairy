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
    } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid amount is required.",
      });
    }

    const { data, error } =
      await createOrderService({
        amount,
        customer_id,
      });

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
    console.error(
      "Create Order Error:",
      err
    );

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
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      customer_id,
    } = req.body;

    const { data, error } =
      await verifyPaymentService({
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        customer_id,
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
    console.error(
      "Verify Payment Error:",
      err
    );

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}