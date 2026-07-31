import {
  generateTodayDeliveriesService,
  getTodayDeliveriesService,
  getDeliveryByIdService,
  assignDeliveryBoyService,
  updateDeliveryStatusService,
  deleteDeliveryService,
  assignSubscriptionDeliveryService
} from "../services/subscriptionDelivery.service.js";


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
        status
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
        generated: result.created.length,
        skipped: result.skipped,
        deliveries: result.created,
        });

  } catch (err) {

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