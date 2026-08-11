import {
  createExtraMilkRequestService,
  getExtraMilkRequestsService,
  getCustomerExtraMilkService,
  approveExtraMilkService,
  rejectExtraMilkService,
  cancelExtraMilkService
} from "../services/extraMilk.service.js";

// ======================================
// Create
// ======================================
export async function createExtraMilkRequest(req, res) {
  try {
    console.log("=================================");
    console.log("CREATE EXTRA MILK REQUEST");
    console.log("Request Body:", req.body);
    console.log(
      "Estimated Amount:",
      req.body.estimated_amount
    );
    console.log("=================================");

    const request =
      await createExtraMilkRequestService(req.body);

    res.status(201).json({
      success: true,
      message: "Extra milk request created successfully.",
      request,
    });

  } catch (err) {
    console.error("Create Extra Milk Error:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

// ======================================
// Admin List
// ======================================
export async function getExtraMilkRequests(req, res) {
  try {

    const requests =
      await getExtraMilkRequestsService();

    res.json({
      success: true,
      requests,
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      message: err.message,
    });

  }
}

// ======================================
// Customer History
// ======================================
export async function getCustomerExtraMilk(req, res) {
  try {

    const requests =
      await getCustomerExtraMilkService(
        req.params.customerId
      );

    res.json({
      success: true,
      requests,
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      message: err.message,
    });

  }
}

// ======================================
// Approve
// ======================================
export async function approveExtraMilk(req, res) {
  try {

    const request =
      await approveExtraMilkService(req.params.id);

    res.json({
      success: true,
      message: "Request approved.",
      request,
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      message: err.message,
    });

  }
}

// ======================================
// Reject
// ======================================
export async function rejectExtraMilk(req, res) {
  try {

    const request =
      await rejectExtraMilkService(req.params.id);

    res.json({
      success: true,
      message: "Request rejected.",
      request,
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      message: err.message,
    });

  }
}
// ======================================
// Cancel Extra Milk
// ======================================
export async function cancelExtraMilk(req, res) {
  try {
    const { id } = req.params;

    console.log("Cancelling Extra Milk Request:", id);

    const request = await cancelExtraMilkService(id);

    res.status(200).json({
      success: true,
      message: "Extra milk request cancelled successfully.",
      request,
    });

  } catch (err) {
    console.error("Cancel Extra Milk Error:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}