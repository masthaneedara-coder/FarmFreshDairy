import {
  createExtraMilkRequestService,
  getExtraMilkRequestsService,
  getCustomerExtraMilkService,
  approveExtraMilkService,
  rejectExtraMilkService,
} from "../services/extraMilk.service.js";

// ======================================
// Create
// ======================================
export async function createExtraMilkRequest(req, res) {

  try {

    console.log(req.body);

    const request =
      await createExtraMilkRequestService(req.body);

    res.status(201).json({
      success: true,
      request,
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
      error: err,
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
export async function cancelExtraMilk(req, res) {
  try {

    const request =
      await cancelExtraMilkService(
        req.params.id
      );

    res.json({
      success: true,
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