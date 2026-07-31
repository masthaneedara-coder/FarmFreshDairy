import {
  createSubscriptionService,
  getCustomerSubscriptionService,
  getSubscriptionHistoryService,
  getBillingSummaryService,
  getUpcomingDeliveryService,
  getSubscriptionByIdService,
  updateSubscriptionService,
  updateSubscriptionItemService,
  updateSubscriptionStatusService,
  deleteSubscriptionService,
  renewSubscriptionService,
    pauseSubscriptionService,
  resumeSubscriptionService,
} from "../services/subscription.service.js";
import {
  generateTodayDeliveriesService,
} from "../services/subscriptionDelivery.service.js";
import {
  getSubscriptionDeliverySummaryService,
} from "../services/subscription.service.js";

/* ==========================================================
   Create Subscription
========================================================== */

export async function createSubscription(req, res) {
  try {
    const { data, error } =
      await createSubscriptionService(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(201).json({
      success: true,
      subscription: data,
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

/* ==========================================================
   Active Subscription
========================================================== */

export async function getCustomerSubscription(req, res) {
  try {
    const { customerId } = req.params;

    const { data, error } =
      await getCustomerSubscriptionService(customerId);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.json({
      success: true,
      subscription: data,
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

/* ==========================================================
   Subscription History
========================================================== */

export async function getSubscriptionHistory(req, res) {
  try {
    const { customerId } = req.params;

    const { data, error } =
      await getSubscriptionHistoryService(customerId);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.json({
      success: true,
      subscriptions: data,
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

/* ==========================================================
   Billing Summary
========================================================== */

export async function getBillingSummary(req, res) {
  try {
    const { customerId } = req.params;

    const { data, error } =
      await getBillingSummaryService(customerId);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.json({
      success: true,
      billing: data,
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

/* ==========================================================
   Upcoming Delivery
========================================================== */

export async function getUpcomingDelivery(req, res) {
  try {
    const { customerId } = req.params;

    const { data, error } =
      await getUpcomingDeliveryService(customerId);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.json({
      success: true,
      delivery: data,
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

/* ==========================================================
   Get By ID
========================================================== */

export async function getSubscriptionById(req, res) {
  try {
    const { id } = req.params;

    const { data, error } =
      await getSubscriptionByIdService(id);

    if (error) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.json({
      success: true,
      subscription: data,
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

/* ==========================================================
   Update Subscription
========================================================== */

export async function updateSubscription(req, res) {
  try {
    const { id } = req.params;

    const {
      quantity,
      size,
      delivery_time,
      address_id,
      total_amount,
    } = req.body;

    const { data, error } =
      await updateSubscriptionService(id, {
        delivery_time,
        address_id,
        total_amount,
        updated_at: new Date().toISOString(),
        
      });
      console.log("Update Result:", { data, error });

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    await updateSubscriptionItemService(id, {
      quantity,
      size,
    });

    return res.json({
      success: true,
      subscription: data,
    });

  } catch (err) {
    console.error("Update Subscription Error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

/* ==========================================================
   Update Status
========================================================== */

export async function updateSubscriptionStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const { data, error } =
      await updateSubscriptionStatusService(id, status);

    if (error) {
       console.error("Update Status Error:", error);
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.json({
      success: true,
      subscription: data,
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

/* ==========================================================
   Delete
========================================================== */

export async function deleteSubscription(req, res) {
  try {
    const { id } = req.params;

    const { error } =
      await deleteSubscriptionService(id);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.json({
      success: true,
      message: "Subscription deleted.",
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

/* ==========================================================
   Renew
========================================================== */

export async function renewSubscription(req, res) {
  try {
    const { id } = req.params;
    const { end_date, total_amount } = req.body;

    const { data, error } =
      await renewSubscriptionService(
        id,
        end_date,
        total_amount
      );

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.json({
      success: true,
      subscription: data,
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}
export async function generateTodayDeliveriesController(req, res) {
  try {
    const result = await generateTodayDeliveriesService();

    return res.json({
      success: true,
      generated: result.created.length,
      skipped: result.skipped,
      deliveries: result.created,
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}
export async function getSubscriptionDeliverySummary(
  req,
  res
) {
  try {

    const { id } = req.params;

    const summary =
      await getSubscriptionDeliverySummaryService(id);

    res.json({
      success: true,
      summary,
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });

  }
}
export async function pauseSubscription(req, res) {

  try {

    const { id } = req.params;

    const {
      pause_from,
      pause_to,
    } = req.body;

    if (!pause_from || !pause_to) {
      return res.status(400).json({
        success: false,
        message: "Pause From and Pause To are required.",
      });
    }

    // Load subscription FIRST
    const { data: currentSubscription, error } =
      await getSubscriptionByIdService(id);

    if (error || !currentSubscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found",
      });
    }

    const from = new Date(pause_from);
    const to = new Date(pause_to);
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const endDate = new Date(currentSubscription.end_date);

    if (from < today) {
      return res.status(400).json({
        success: false,
        message: "Pause From cannot be before today.",
      });
    }

    if (to < from) {
      return res.status(400).json({
        success: false,
        message: "Pause To cannot be earlier than Pause From.",
      });
    }

    if (to > endDate) {
      return res.status(400).json({
        success: false,
        message: "Pause period exceeds subscription end date.",
      });
    }

    const subscription =
      await pauseSubscriptionService(
        id,
        pause_from,
        pause_to
      );

    return res.json({
      success: true,
      message: "Subscription paused successfully.",
      subscription,
    });

  } catch (err) {

    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });

  }
}
export async function resumeSubscription(req, res) {

  try {

    const { id } = req.params;

    const subscription =
      await resumeSubscriptionService(id);

    res.json({
      success: true,
      message: "Subscription resumed successfully.",
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