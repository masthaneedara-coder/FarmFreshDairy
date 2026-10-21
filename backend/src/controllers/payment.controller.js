
import {
  createOrderService,
  verifyPaymentService,
} from "../services/payment.service.js";

/* ==========================================================
   Create Razorpay Order
========================================================== */

export async function createOrder(req, res) {
  try {
    const { customer_id, checkout_payload } = req.body;

    if (!customer_id || !checkout_payload) {
      return res.status(400).json({
        success: false,
        message: "Customer ID and checkout details are required.",
      });
    }

    const { data, error } = await createOrderService({
      customer_id,
      checkout_payload,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message || "Unable to create payment order.",
      });
    }

    if (!data?.order?.id || !data?.intent_id) {
      return res.status(500).json({
        success: false,
        message: "Razorpay order or payment intent was not created.",
      });
    }

    return res.status(201).json({
      success: true,
      order: data.order,
      intent_id: data.intent_id,
      amount: data.amount,
      currency: data.currency,
    });
  } catch (error) {
    console.error("Create Order Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create payment order.",
    });
  }
}
/* ==========================================================
   Verify Razorpay Payment
========================================================== */
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
      intent_id,
      payment_intent_id,
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

    if (!customer_id) {
      return res.status(400).json({
        success: false,
        message: "Customer ID is required.",
      });
    }

    // Support either frontend field name.
    const resolvedIntentId = intent_id || payment_intent_id;

    const { data, error } = await verifyPaymentService({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      customer_id,
      intent_id: resolvedIntentId,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message || "Payment verification failed.",
      });
    }

    return res.status(200).json({
      success: true,
      payment: data,
    });
  } catch (error) {
    console.error("Verify Payment Controller Error:", error);

    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred while verifying payment.",
    });
  }
}
  
