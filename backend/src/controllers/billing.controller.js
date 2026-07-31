import {
  getAllBillsService,
  getBillByIdService,
  createOrderInvoiceService,
  updateBillingStatusService,
  generateMonthlySubscriptionInvoicesService
} from "../services/billing.service.js";
import {
  getSubscriptionBillsService,
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