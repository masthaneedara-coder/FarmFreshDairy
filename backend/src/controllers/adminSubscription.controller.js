import {
  getAllSubscriptionsService,
  updateSubscriptionStatusService,
} from "../services/adminSubscription.service.js";

export async function getAllSubscriptions(req, res) {
  try {
    const subscriptions = await getAllSubscriptionsService();

    res.json({
      success: true,
      subscriptions,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

export async function updateSubscriptionStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const subscription =
      await updateSubscriptionStatusService(id, status);

    res.json({
      success: true,
      subscription,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}