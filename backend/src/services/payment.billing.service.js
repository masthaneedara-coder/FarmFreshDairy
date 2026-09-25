import crypto from "crypto";
import razorpay from "../config/razorpay.js";
import { supabaseAdmin } from "../config/supabase.js";

/**
 * Create Razorpay order for postpaid billing
 */
export async function createBillingPaymentOrderService({
  billing_id,
  customer_id,
}) {
  try {
    if (!billing_id || !customer_id) {
      return {
        data: null,
        error: {
          message: "Billing ID and customer ID are required.",
        },
      };
    }

    const { data: bill, error: billError } = await supabaseAdmin
      .from("billing")
      .select(`
        id,
        invoice_number,
        customer_id,
        total_amount,
        calculated_total_amount,
        payment_status,
        payment_method
      `)
      .eq("id", billing_id)
      .eq("customer_id", customer_id)
      .single();

    if (billError || !bill) {
      console.error("Billing lookup error:", billError);

      return {
        data: null,
        error: {
          message: "Billing record not found.",
        },
      };
    }

    // Already paid
    if (
      String(bill.payment_status || "Pending").toLowerCase() ===
      "paid"
    ) {
      return {
        data: null,
        error: {
          message: "This bill is already paid.",
        },
      };
    }

    // This endpoint is only for postpaid/COD billing
    const paymentMethod = String(
      bill.payment_method || "COD"
    )
      .trim()
      .toLowerCase();

    if (
      paymentMethod === "online" ||
      paymentMethod === "prepaid"
    ) {
      return {
        data: null,
        error: {
          message: "This bill is not a postpaid bill.",
        },
      };
    }

    const amount = Number(
  bill.calculated_total_amount ??
  bill.total_amount ??
  0
);

    if (!Number.isFinite(amount) || amount <= 0) {
      return {
        data: null,
        error: {
          message: "Billing amount must be greater than zero.",
        },
      };
    }

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `BILL_${String(billing_id).slice(
        0,
        12
      )}_${Date.now()}`,
      notes: {
        billing_id,
        customer_id,
        invoice_number: bill.invoice_number || "",
      },
    });

    return {
      data: order,
      error: null,
    };
  } catch (error) {
    console.error(
      "Create Billing Payment Order Error:",
      error
    );

    return {
      data: null,
      error: {
        message:
          error.message ||
          "Unable to create billing payment order.",
      },
    };
  }
}

/**
 * Verify Razorpay payment and mark billing as Paid
 */
export async function verifyBillingPaymentService({
  billing_id,
  customer_id,
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
}) {
  try {
    if (
      !billing_id ||
      !customer_id ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return {
        data: null,
        error: {
          message:
            "Billing payment verification details are required.",
        },
      };
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;

    if (!secret) {
      return {
        data: null,
        error: {
          message:
            "Razorpay server configuration is missing.",
        },
      };
    }

    // Verify Razorpay signature
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(
        `${razorpay_order_id}|${razorpay_payment_id}`
      )
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return {
        data: null,
        error: {
          message: "Invalid payment signature.",
        },
      };
    }

    // Get billing record
    const { data: bill, error: billError } =
      await supabaseAdmin
        .from("billing")
        .select(`
          id,
          invoice_number,
          customer_id,
          subscription_id,
          total_amount,
          payment_status,
          payment_method
        `)
        .eq("id", billing_id)
        .eq("customer_id", customer_id)
        .single();

    if (billError || !bill) {
      return {
        data: null,
        error: {
          message: "Billing record not found.",
        },
      };
    }

    // Already paid
    if (
      String(bill.payment_status || "Pending").toLowerCase() ===
      "paid"
    ) {
      const { data: existingPayment } =
        await supabaseAdmin
          .from("payments")
          .select("*")
          .eq("transaction_id", razorpay_payment_id)
          .maybeSingle();

      return {
        data: {
          verified: true,
          alreadyProcessed: true,
          payment: existingPayment || null,
          billing: bill,
          message: "Billing is already paid.",
        },
        error: null,
      };
    }

    // Fetch Razorpay order
    const razorpayOrder =
      await razorpay.orders.fetch(
        razorpay_order_id
      );

    if (!razorpayOrder) {
      return {
        data: null,
        error: {
          message: "Razorpay order not found.",
        },
      };
    }

    // Fetch Razorpay payment
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

    // Make sure payment belongs to order
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

    // Check Razorpay order/payment amount
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

    // Check against our billing amount
   const expectedBillingAmount = Number(
  bill.calculated_total_amount ??
  bill.total_amount ??
  0
);

const expectedAmountPaise = Math.round(
  expectedBillingAmount * 100
);

    if (
      Number(razorpayPayment.amount) !==
      expectedAmountPaise
    ) {
      return {
        data: null,
        error: {
          message:
            "Payment amount does not match the billing amount.",
        },
      };
    }

    // Payment must be captured
    if (
      razorpayPayment.status !== "captured"
    ) {
      return {
        data: null,
        error: {
          message: `Payment is not captured. Current status: ${razorpayPayment.status}`,
        },
      };
    }

    const paymentAmount =
      Number(razorpayPayment.amount) / 100;

    // Check duplicate Razorpay payment
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

    if (existingPayment) {
      if (
        existingPayment.customer_id !==
        customer_id
      ) {
        return {
          data: null,
          error: {
            message:
              "Payment belongs to another customer.",
          },
        };
      }

      const {
        data: updatedBill,
        error: updateError,
      } = await supabaseAdmin
        .from("billing")
        .update({
          payment_status: "Paid",
          payment_method: "ONLINE",
        })
        .eq("id", billing_id)
        .eq("customer_id", customer_id)
        .select()
        .single();

      if (updateError) {
        return {
          data: null,
          error: {
            message:
              "Payment exists, but billing could not be updated.",
          },
        };
      }

      return {
        data: {
          verified: true,
          alreadyProcessed: true,
          payment: existingPayment,
          billing: updatedBill,
          message:
            "Billing payment already processed.",
        },
        error: null,
      };
    }

    // Save payment
    const {
      data: payment,
      error: paymentError,
    } = await supabaseAdmin
      .from("payments")
      .insert({
        order_id: null,
        subscription_id:
          bill.subscription_id || null,
        customer_id,
        amount: paymentAmount,
        payment_method: "ONLINE",
        transaction_id:
          razorpay_payment_id,
        payment_status: "Paid",
        paid_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (paymentError || !payment) {
      console.error(
        "Billing payment insert error:",
        paymentError
      );

      return {
        data: null,
        error: {
          message:
            "Unable to save billing payment.",
        },
      };
    }

    // Mark bill as Paid
    const {
      data: updatedBill,
      error: updateError,
    } = await supabaseAdmin
      .from("billing")
      .update({
        payment_status: "Paid",
        payment_method: "ONLINE",
      })
      .eq("id", billing_id)
      .eq("customer_id", customer_id)
      .eq("payment_status", "Pending")
      .select()
      .single();

    if (updateError || !updatedBill) {
      // Roll back payment record if billing update fails
      await supabaseAdmin
        .from("payments")
        .delete()
        .eq("id", payment.id);

      console.error(
        "Billing status update error:",
        updateError
      );

      return {
        data: null,
        error: {
          message:
            "Payment was received, but billing could not be updated. Please contact support.",
        },
      };
    }

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
        billing: updatedBill,
        message:
          "Billing payment verified and bill marked Paid successfully.",
      },
      error: null,
    };
  } catch (error) {
    console.error(
      "Verify Billing Payment Service Error:",
      error
    );

    return {
      data: null,
      error: {
        message:
          error.message ||
          "Billing payment verification failed.",
      },
    };
  }
}