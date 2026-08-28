import {
  getDeliveryDashboardService,
} from "../services/deliveryDashboard.service.js";
import { supabaseAdmin } from "../config/supabase.js";

/**
 * GET Delivery Boy Dashboard
 * GET /api/delivery-dashboard/:deliveryBoyId
 */
export async function getDeliveryDashboard(req, res) {

  try {

    const { deliveryBoyId } = req.params;

    if (!deliveryBoyId) {

      return res.status(400).json({
        success: false,
        message: "Delivery Boy ID is required",
      });

    }

    const dashboard =
      await getDeliveryDashboardService(
        deliveryBoyId
      );

    return res.json({
      success: true,
      message: "Dashboard Loaded Successfully",
      summary: dashboard.summary,
      deliveries: dashboard.deliveries,
    });

  } catch (err) {

    console.error(
      "Delivery Dashboard Error:",
      err
    );

    return res.status(500).json({
      success: false,
      message: err.message,
    });

  }

}
export async function updateDeliveryStatus(req, res) {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const { data, error } =
      await updateDeliveryStatusService(
        orderId,
        status
      );

    if (error) throw error;

    res.json({
      success: true,
      order: data,
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      message: err.message,
    });

  }
}
export async function updateSubscriptionDeliveryStatus(
  req,
  res
) {
  try {
    const { deliveryId } = req.params;
    const { status } = req.body;

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

    const { data, error } = await supabaseAdmin
      .from("subscription_deliveries")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", deliveryId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return res.json({
      success: true,
      message: "Subscription delivery status updated",
      delivery: data,
    });

  } catch (err) {
    console.error(
      "Update Subscription Delivery Status Error:",
      err
    );

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}
