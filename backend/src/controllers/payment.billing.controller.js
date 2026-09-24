import {
  createBillingPaymentOrderService,
  verifyBillingPaymentService,
} from "../services/payment.billing.service.js";

export async function createBillingPaymentOrder(req, res) {
  try {
    const {
      billing_id,
      customer_id,
    } = req.body;

    const { data, error } =
      await createBillingPaymentOrderService({
        billing_id,
        customer_id,
      });

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      order: data,
    });
  } catch (error) {
    console.error(
      "Create Billing Payment Order Controller Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Unable to create billing payment order.",
    });
  }
}

export async function verifyBillingPayment(req, res) {
  try {
    const {
      billing_id,
      customer_id,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    const { data, error } =
      await verifyBillingPaymentService({
        billing_id,
        customer_id,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      });

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      ...data,
    });
  } catch (error) {
    console.error(
      "Verify Billing Payment Controller Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Billing payment verification failed.",
    });
  }
}