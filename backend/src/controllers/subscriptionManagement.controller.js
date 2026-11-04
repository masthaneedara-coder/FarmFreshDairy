import {
  getPauseManagementData,
  pauseSubscriptionWithManagementToken,
} from "../services/subscriptionManagement.service.js";

export async function getPauseManagement(req, res) {
  try {
    const result = await getPauseManagementData(req.params.token);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : "Unable to validate this subscription link.",
    });
  }
}

export async function submitPauseManagement(req, res) {
  try {
    const { subscriptionId, pauseFrom, pauseTo } = req.body || {};
    const result = await pauseSubscriptionWithManagementToken({
      rawToken: req.params.token,
      subscriptionId,
      pauseFrom,
      pauseTo,
    });

    return res.status(200).json({
      success: true,
      message: "Your subscription has been paused successfully.",
      notificationSent: result.notificationSent,
      subscription: {
        id: result.subscription.id,
        status: result.subscription.status,
        pause_from: result.subscription.pause_from,
        pause_to: result.subscription.pause_to,
      },
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : "Unable to pause this subscription right now.",
    });
  }
}
