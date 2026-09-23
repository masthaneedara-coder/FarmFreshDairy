import {
  generateTodayDeliveriesService,
  getTodayDeliveriesService,
  getDeliveryByIdService,
  assignDeliveryBoyService,
  updateDeliveryStatusService,
  deleteDeliveryService,
  assignSubscriptionDeliveryService,
  getCustomerDeliverySummaryService,
  bulkAssignSubscriptionDeliveriesService
} from "../services/subscriptionDelivery.service.js";
import { supabaseAdmin } from "../config/supabase.js";


export async function getTodayDeliveries(req, res) {
  try {
    const { data, error } =
      await getTodayDeliveriesService();

    if (error) throw error;

    res.json({
      success: true,
      deliveries: data,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}
export async function getDeliveryById(req, res) {
  try {
    const { data, error } =
      await getDeliveryByIdService(req.params.id);

    if (error) throw error;

    res.json({
      success: true,
      delivery: data,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}
export async function assignDeliveryBoy(req, res) {
  try {
    const { delivery_boy_id } = req.body;

    const { data, error } =
      await assignDeliveryBoyService(
        req.params.id,
        delivery_boy_id
      );

    if (error) throw error;

    res.json({
      success: true,
      message: "Delivery Boy Assigned Successfully",
      delivery: data,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}
export async function updateDeliveryStatus(req, res) {
  try {
    const { status } = req.body;

    const { data, error } =
      await updateDeliveryStatusService(
        req.params.id,
        status,
        "Order"
      );

    if (error) throw error;

    res.json({
      success: true,
      message: "Delivery Status Updated",
      delivery: data,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}
export async function deleteDelivery(req, res) {
  try {
    const { error } =
      await deleteDeliveryService(req.params.id);

    if (error) throw error;

    res.json({
      success: true,
      message: "Delivery Deleted Successfully",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}
  export async function generateTodayDeliveries(req, res) {
  try {

    const result =
      await generateTodayDeliveriesService();

    res.json({
  success: true,

  message:
    "Today's subscription deliveries generated successfully.",

  generated:
    result.created.length,

  updated:
    result.updated.length,

  skipped:
    result.skipped,

  deliveries:
    result.created,

  updatedDeliveries:
    result.updated,
});

  } catch (err) {

    console.error(
      "Generate Deliveries Error:",
      err
    );

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}
export async function assignSubscriptionDelivery(req, res) {
  try {
    const result =
      await assignSubscriptionDeliveryService(
        req.params.id,
        req.body.delivery_boy_id
      );

    res.json({
      success: true,
      delivery: result,
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      message: err.message,
    });

  }
}
export async function getCustomerDeliverySummary(req, res) {
  try {
    const { customerId } = req.params;

    const summary =
      await getCustomerDeliverySummaryService(customerId);

    res.json({
      success: true,
      summary,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}
export async function bulkAssignSubscriptionDeliveries(
  req,
  res
) {
  try {

    const {
      delivery_ids,
      delivery_boy_id,
    } = req.body;

    if (
      !Array.isArray(delivery_ids) ||
      delivery_ids.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "No deliveries selected.",
      });
    }

    if (!delivery_boy_id) {
      return res.status(400).json({
        success: false,
        message: "Delivery boy is required.",
      });
    }

    const data =
      await bulkAssignSubscriptionDeliveriesService(
        delivery_ids,
        delivery_boy_id
      );

    return res.json({
      success: true,
      message: "Deliveries assigned successfully.",
      deliveries: data,
    });

  } catch (err) {

    console.error(
      "Bulk Assign Error:",
      err
    );

    return res.status(500).json({
      success: false,
      message: err.message,
    });

  }
}
export async function updateSubscriptionDeliveryStatus(req, res) {
  try {
    const { deliveryId } = req.params;
    const { status } = req.body;

    // ==========================================================
    // VALIDATION
    // ==========================================================

    if (!deliveryId) {
      return res.status(400).json({
        success: false,
        message: "Delivery ID is required",
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    const allowedStatuses = [
      "Pending",
      "Assigned",
      "Out for Delivery",
      "Delivered",
      "Skipped",
      "Missed",
      "Failed",
      "Cancelled",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid delivery status: ${status}`,
      });
    }

    // ==========================================================
    // GET CURRENT DELIVERY
    // ==========================================================

    const { data: currentDelivery, error: fetchError } =
      await supabaseAdmin
        .from("subscription_deliveries")
        .select("id, status, delivery_boy_id")
        .eq("id", deliveryId)
        .single();

    if (fetchError) {
      throw fetchError;
    }

    if (!currentDelivery) {
      return res.status(404).json({
        success: false,
        message: "Delivery not found",
      });
    }

    // ==========================================================
    // PREVENT CHANGING DELIVERED DELIVERY
    // ==========================================================

    if (
      currentDelivery.status === "Delivered" &&
      status !== "Delivered"
    ) {
      return res.status(400).json({
        success: false,
        message: "Delivered delivery cannot be changed.",
      });
    }

    // ==========================================================
    // OUT FOR DELIVERY → CANNOT SKIP
    // ==========================================================

    if (
      currentDelivery.status === "Out for Delivery" &&
      status === "Skipped"
    ) {
      return res.status(400).json({
        success: false,
        message: "Out for Delivery cannot be skipped.",
      });
    }

    // ==========================================================
    // SPECIAL HANDLING FOR SKIPPED / PENDING
    // ==========================================================

    /*
     * We let the main service handle the actual status update
     * and wallet processing.
     *
     * Wallet processing happens ONLY when:
     *
     * status === "Delivered"
     */

    const result = await updateDeliveryStatusService(
      deliveryId,
      status,
      "Subscription"
    );

    // ==========================================================
    // RESPONSE
    // ==========================================================

    return res.json({
      success: true,
      message: `Subscription delivery status updated to ${status}`,
      delivery: result.data,
      wallet: result.wallet || null,
      billing: result.billing || null,
    });

  } catch (err) {
    console.error(
      "Update Subscription Delivery Status Error:",
      err
    );

    return res.status(500).json({
      success: false,
      message:
        err?.message ||
        "Failed to update subscription delivery status",
    });
  }
}