import {
  getAllBillsService,
  getBillByIdService,
  createOrderInvoiceService,
  updateBillingStatusService,
  generateMonthlySubscriptionInvoicesService,
   getSubscriptionBillsService,
  markBillingPaidService,
} from "../services/billing.service.js";



export async function getAllBills(req, res) {
  try {
    const bills = await getAllBillsService();

    res.json({
      success: true,
      bills,
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });

  }
}
export async function getBillById(req, res) {

  try {

    const bill =
      await getBillByIdService(
        req.params.id
      );

    res.json({
      success: true,
      bill,
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });

  }

}
export async function createOrderInvoice(req, res) {
  try {
    const invoice = await createOrderInvoiceService(
      req.params.orderId
    );

    res.json({
      success: true,
      invoice,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}
export async function updateBillingStatus(req, res) {
  try {
    const { paymentStatus } = req.body;

    if (!paymentStatus) {
      return res.status(400).json({
        success: false,
        message: "paymentStatus is required",
      });
    }

    const bill = await updateBillingStatusService(
      req.params.id,
      paymentStatus
    );

    res.json({
      success: true,
      bill,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}
export async function generateMonthlyInvoices(req, res) {

  try {

    const { month, year } = req.body;

    const result =
      await generateMonthlySubscriptionInvoicesService(
        month,
        year
      );

    res.json({
      success: true,
      generated: result.generated,
      invoices: result.invoices,
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      message: err.message,
    });

  }

}
export async function getSubscriptionBills(req, res) {
  try {
    const bills = await getSubscriptionBillsService();

    res.json({
      success: true,
      bills,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}
// ======================================
// Pay Billing Through Razorpay
// ======================================
export async function payBilling(req, res) {
  try {
    const { id } = req.params;

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      customer_id,
    } = req.body;

    if (!razorpay_order_id) {
      return res.status(400).json({
        success: false,
        message:
          "razorpay_order_id is required",
      });
    }

    if (!razorpay_payment_id) {
      return res.status(400).json({
        success: false,
        message:
          "razorpay_payment_id is required",
      });
    }

    if (!razorpay_signature) {
      return res.status(400).json({
        success: false,
        message:
          "razorpay_signature is required",
      });
    }

    if (!customer_id) {
      return res.status(400).json({
        success: false,
        message:
          "customer_id is required",
      });
    }

    const result =
      await markBillingPaidService({
        billingId: id,
        razorpayOrderId:
          razorpay_order_id,
        razorpayPaymentId:
          razorpay_payment_id,
        razorpaySignature:
          razorpay_signature,
        customerId: customer_id,
      });

    return res.json({
      success: true,
      message: result.alreadyPaid
        ? "Billing payment already processed"
        : "Billing payment successful",
      bill: result.bill,
      payment: result.payment || null,
    });

  } catch (err) {
    console.error(
      "Billing payment error:",
      err
    );

    return res.status(500).json({
      success: false,
      message:
        err.message ||
        "Unable to process billing payment",
    });
  }
}