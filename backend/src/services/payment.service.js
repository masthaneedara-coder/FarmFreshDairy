import crypto from "crypto";
import razorpay from "../config/razorpay.js";
import { supabaseAdmin } from "../config/supabase.js";

/* ==========================================================
   Create Razorpay Order
========================================================== */

export async function createOrderService({
  amount,
  customer_id = null,
}) {
  try {
    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return {
        data: null,
        error: {
          message: "Valid amount is required.",
        },
      };
    }

    const order = await razorpay.orders.create({
      amount: Math.round(numericAmount * 100),
      currency: "INR",
      receipt: `SUB_${Date.now()}`,
      notes: {
        customer_id: customer_id || "",
      },
    });

    return {
      data: order,
      error: null,
    };
  } catch (error) {
    console.error("Razorpay Create Order Error:", error);

    return {
      data: null,
      error,
    };
  }
}

/* ==========================================================
   Save Payment
========================================================== */

export async function createPaymentService(payment) {
  return await supabaseAdmin
    .from("payments")
    .insert(payment)
    .select()
    .single();
}

/* ==========================================================
   Verify Razorpay Payment
========================================================== */

export async function verifyPaymentService({
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
  customer_id,
}) {
  try {
    /* --------------------------------------------------------
       Validate required fields
    -------------------------------------------------------- */

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return {
        data: null,
        error: {
          message:
            "Razorpay payment verification details are required.",
        },
      };
    }

    if (!customer_id) {
      return {
        data: null,
        error: {
          message: "Customer ID is required.",
        },
      };
    }

    /* --------------------------------------------------------
       1. Verify Razorpay signature
    -------------------------------------------------------- */

    const body =
      `${razorpay_order_id}|${razorpay_payment_id}`;

    const expectedSignature = crypto
      .createHmac(
        "sha256",
        process.env.RAZORPAY_KEY_SECRET
      )
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return {
        data: null,
        error: {
          message: "Invalid payment signature.",
        },
      };
    }

    /* --------------------------------------------------------
       2. Fetch Razorpay order
    -------------------------------------------------------- */

    const razorpayOrder =
      await razorpay.orders.fetch(razorpay_order_id);

    if (!razorpayOrder) {
      return {
        data: null,
        error: {
          message: "Razorpay order not found.",
        },
      };
    }

    /* --------------------------------------------------------
       3. Fetch Razorpay payment
    -------------------------------------------------------- */

    const razorpayPayment =
      await razorpay.payments.fetch(
        razorpay_payment_id
      );

    if (!razorpayPayment) {
      return {
        data: null,
        error: {
          message: "Razorpay payment not found.",
        },
      };
    }

    /* --------------------------------------------------------
       4. Verify payment belongs to order
    -------------------------------------------------------- */

    if (
      razorpayPayment.order_id !==
      razorpay_order_id
    ) {
      return {
        data: null,
        error: {
          message:
            "Payment does not belong to this Razorpay order.",
        },
      };
    }

    /* --------------------------------------------------------
       5. Verify amount
    -------------------------------------------------------- */

    if (
      Number(razorpayPayment.amount) !==
      Number(razorpayOrder.amount)
    ) {
      return {
        data: null,
        error: {
          message:
            "Payment amount does not match the Razorpay order.",
        },
      };
    }

    /* --------------------------------------------------------
       6. Verify captured payment
    -------------------------------------------------------- */

    if (razorpayPayment.status !== "captured") {
      return {
        data: null,
        error: {
          message:
            `Payment is not captured. Current status: ${razorpayPayment.status}`,
        },
      };
    }

    const paymentAmount =
      Number(razorpayPayment.amount) / 100;

    /* --------------------------------------------------------
       7. Check duplicate payment
    -------------------------------------------------------- */

    const {
      data: existingPayment,
      error: existingPaymentError,
    } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq(
        "transaction_id",
        razorpay_payment_id
      )
      .maybeSingle();

    if (existingPaymentError) {
      console.error(
        "Existing payment lookup error:",
        existingPaymentError
      );

      return {
        data: null,
        error: {
          message:
            "Unable to check existing payment.",
        },
      };
    }

    /* --------------------------------------------------------
       Already processed
    -------------------------------------------------------- */

    if (existingPayment) {
      return {
        data: {
          verified: true,
          alreadyProcessed: true,

          payment: {
            id: existingPayment.id,
            payment_id:
              existingPayment.transaction_id,
            order_id: razorpay_order_id,
            amount:
              Number(existingPayment.amount),
            status:
              existingPayment.payment_status,
          },

          message:
            "Payment already processed.",
        },

        error: null,
      };
    }

    /* --------------------------------------------------------
       8. Save verified payment
       
       Subscription does NOT exist yet.
       Therefore subscription_id remains NULL.
    -------------------------------------------------------- */

    const {
      data: payment,
      error: paymentError,
    } = await createPaymentService({
      subscription_id: null,
      customer_id,
      amount: paymentAmount,
      payment_method: "ONLINE",
      transaction_id:
        razorpay_payment_id,
      payment_status: "Paid",
      paid_at:
        new Date().toISOString(),
    });

    if (paymentError || !payment) {
      console.error(
        "Payment insert error:",
        paymentError
      );

      return {
        data: null,
        error: {
          message:
            "Unable to save verified payment.",
        },
      };
    }

    /* --------------------------------------------------------
       9. Return verified payment
       
       Wallet is NOT credited here.
       Subscription is NOT updated here.
    -------------------------------------------------------- */

    return {
      data: {
        verified: true,
        alreadyProcessed: false,

        payment: {
          id: payment.id,

          payment_id:
            razorpay_payment_id,

          order_id:
            razorpay_order_id,

          amount: paymentAmount,

          status: "Paid",
        },

        message:
          "Payment verified successfully.",
      },

      error: null,
    };
  } catch (error) {
    console.error(
      "Verify Payment Service Error:",
      error
    );

    return {
      data: null,
      error: {
        message:
          error.message ||
          "Payment verification failed.",
      },
    };
  }
}