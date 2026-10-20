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
    console.log("[ExtraMilk] Creating customer request");

    // 1. Create the request as Pending
    const createdRequest = await createExtraMilkRequestService(
      req.body
    );

    // 2. Attempt automatic approval and atomic stock reservation
    let request;

    try {
      request = await approveExtraMilkService(createdRequest.id);
    } catch (approvalError) {
      if (
        approvalError.code === "INSUFFICIENT_STOCK" ||
        approvalError.statusCode === 409
      ) {
        return res.status(409).json({
          success: false,
          code: "INSUFFICIENT_STOCK",
          message:
            "Your extra milk request is pending because sufficient stock is currently unavailable.",
          request: createdRequest,
        });
      }

      // The request exists, but approval failed for another reason.
      console.error(
        "[ExtraMilk] Automatic approval failed:",
        approvalError
      );

      return res.status(500).json({
        success: false,
        code: "AUTO_APPROVAL_FAILED",
        message:
          "Your request was created, but automatic approval could not be completed. Please check your request status before retrying.",
        request: createdRequest,
      });
    }

    // 3. Return the actual request status
    if (request.status !== "Approved") {
      return res.status(202).json({
        success: true,
        message: "Your extra milk request is awaiting approval.",
        request,
      });
    }

    return res.status(201).json({
      success: true,
      message:
        "Your extra milk request has been approved and stock reserved.",
      request,
    });
  } catch (err) {
    console.error("[ExtraMilk] Request creation failed:", err);

    return res.status(500).json({
      success: false,
      message: err.message || "Failed to create extra milk request.",
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