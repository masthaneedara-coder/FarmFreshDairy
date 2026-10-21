import { supabaseAdmin } from "../config/supabase.js";
import razorpay from "../config/razorpay.js";
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
  expireSubscriptionsService,
} from "../services/subscriptionDelivery.service.js";
import {
  getSubscriptionDeliverySummaryService,
} from "../services/subscription.service.js";
import {
  createSubscriptionRenewalLinkService,
  getSubscriptionRenewalLinkService,
  markSubscriptionRenewalLinkUsedService,
} from "../services/subscriptionRenewalLink.service.js";



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
   Renew Subscription
========================================================== */

export async function renewSubscription(req, res) {
  try {
    const { id } = req.params;

    const {
      end_date,
      total_amount,

      // Payment details
      payment_method,
      payment_status,
      payment_date,
      payment_reference,
      payment_amount,

      // Optional billing details
      subtotal,
      discount,
      gst,
      gst_percent,
    } = req.body;

    const {
      data,
      billing,
      error,
    } = await renewSubscriptionService(
      id,
      end_date,
      total_amount,
      {
        payment_method,
        payment_status,
        payment_date,
        payment_reference,
        payment_amount,

        subtotal,
        discount,
        gst,
        gst_percent,
      }
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

      billing,
    });

  } catch (err) {
    console.error(
      "Renew Subscription Error:",
      err
    );

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}
export async function generateTodayDeliveriesController(req, res) {
  try {
    // ==========================================
    // AUTO EXPIRE OLD SUBSCRIPTIONS FIRST
    // ==========================================
    const expiredSubscriptions =
      await expireSubscriptionsService();

    console.log(
      `Auto expiry completed: ${expiredSubscriptions.length} subscription(s) expired.`
    );

    // ==========================================
    // THEN GENERATE TODAY'S DELIVERIES
    // ==========================================
    const result =
      await generateTodayDeliveriesService();

    return res.json({
      success: true,
      expired: expiredSubscriptions.length,
      generated: result.created.length,
      skipped: result.skipped,
      deliveries: result.created,
    });

  } catch (err) {
    console.error(
      "Generate Today Deliveries Error:",
      err
    );

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
/* ==========================================================
   CREATE CUSTOMER RENEWAL LINK
   ADMIN ONLY
========================================================== */

export async function createRenewalLink(req, res) {
  try {
    const { id } = req.params;

    const result =
      await createSubscriptionRenewalLinkService(id);

    return res.json({
      success: true,
      renewalUrl: result.renewalUrl,
      expiresAt: result.expiresAt,
    });

  } catch (err) {
    console.error(
      "Create Renewal Link Error:",
      err
    );

    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
}


/* ==========================================================
   GET PUBLIC RENEWAL DETAILS
========================================================== */

export async function getRenewalLinkDetails(
  req,
  res
) {
  try {
    const { token } = req.params;

    const result =
      await getSubscriptionRenewalLinkService(
        token
      );

    const subscription =
      result.subscription;

    const item =
      subscription.subscription_items?.[0];

    const product =
      item?.products;

    const customer =
      subscription.customers;

    return res.json({
      success: true,

      subscription: {
        id: subscription.id,

        customerName:
          customer?.full_name || "Customer",

        phone:
          customer?.phone || "",

        product:
          product?.name || "Milk",

        size:
          item?.size || "",

        quantity:
          Number(item?.quantity || 1),

        deliveryTime:
          subscription.delivery_time || "Morning",

        startDate:
          subscription.start_date,

        endDate:
          subscription.end_date,

        amount:
          Number(subscription.total_amount || 0),

        paymentMethod:
          subscription.payment_method || "COD",

        paymentStatus:
          subscription.payment_status || "Pending",

        status:
          subscription.status,

        isPaused:
          subscription.is_paused === true,

        address:
          subscription.addresses || null,
      },

      expiresAt:
        result.expiresAt,
    });

  } catch (err) {
    console.error(
      "Get Renewal Link Error:",
      err
    );

    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
}
export async function createRenewalPaymentOrder(req, res) {
  try {
    const { token } = req.params;

    // Validate the renewal link first.
    const result =
      await getSubscriptionRenewalLinkService(token);

    const subscription = result.subscription;
    const linkId = result.linkId;

    if (!linkId) {
      return res.status(400).json({
        success: false,
        message: "Renewal link ID is missing.",
      });
    }

    const status = String(subscription.status || "")
      .trim()
      .toLowerCase();

    if (["stopped", "cancelled", "canceled"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "This subscription cannot be renewed.",
      });
    }

    const amount = Number(subscription.total_amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid subscription amount.",
      });
    }

    const customerId = subscription.customer_id;

    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: "Subscription customer was not found.",
      });
    }

    const renewalKey = String(linkId);

    // Prevent a second order if this link already has a
    // payment intent. A retry should reuse the existing order.
    const { data: existingIntent, error: lookupError } =
      await supabaseAdmin
        .from("payment_intents")
        .select("*")
        .eq("renewal_key", renewalKey)
        .maybeSingle();

    if (lookupError) throw lookupError;

    if (existingIntent) {
      if (
        existingIntent.status === "PAID" ||
        existingIntent.razorpay_payment_id
      ) {
        return res.status(409).json({
          success: false,
          message:
            "Payment has already been recorded. Please check renewal status.",
        });
      }

      if (
        existingIntent.status === "CREATED" &&
        existingIntent.razorpay_order_id
      ) {
        return res.json({
          success: true,
          order: {
            id: existingIntent.razorpay_order_id,
            amount: Math.round(amount * 100),
            currency: existingIntent.currency || "INR",
          },
          intent_id: existingIntent.id,
          amount,
          currency: existingIntent.currency || "INR",
        });
      }

      return res.status(409).json({
        success: false,
        message:
          "A previous payment attempt needs checking before another order can be created.",
      });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;

    if (!keyId) {
      throw new Error("Razorpay is not configured.");
    }

    // Create a payment intent first.
    const { data: intent, error: insertError } =
      await supabaseAdmin
        .from("payment_intents")
        .insert({
          customer_id: customerId,
          subscription_id: subscription.id,
          amount,
          currency: "INR",
          status: "CREATED",
          renewal_key: renewalKey,
          checkout_payload: {
            flow: "SUBSCRIPTION_RENEWAL",
            subscription_id: subscription.id,
            renewal_link_id: linkId,
            renewal_key: renewalKey,
          },
        })
        .select()
        .single();

    if (insertError) throw insertError;

    // Create the Razorpay order using the server-calculated amount.
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `renew_${String(linkId).replace(/-/g, "").slice(0, 20)}`,
      notes: {
        customer_id: String(customerId),
        payment_intent_id: String(intent.id),
        renewal_link_id: String(linkId),
        renewal_key: renewalKey,
      },
    });

    const { error: updateError } = await supabaseAdmin
      .from("payment_intents")
      .update({
        razorpay_order_id: order.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", intent.id);

    if (updateError) {
      console.error("Saving Razorpay order failed:", updateError);
      throw new Error(
        "The payment order needs reconciliation. Please do not retry payment yet."
      );
    }

    return res.status(201).json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
      },
      intent_id: intent.id,
      amount,
      currency: "INR",
      key: keyId,
    });
  } catch (err) {
    console.error("Create Renewal Payment Order Error:", err);

    return res.status(400).json({
      success: false,
      message:
        err.message || "Unable to create renewal payment order.",
    });
  }
}


/* ==========================================================
   CUSTOMER RENEW USING SECURE LINK
========================================================== */

export async function renewUsingLink(req, res) {
  try {
    const { token } = req.params;
    const paymentMethod = String(
      req.body?.paymentMethod || ""
    ).trim().toUpperCase();

    // This endpoint handles COD only.
    // Razorpay renewals must use the payment-order endpoint.
    if (paymentMethod !== "COD") {
      return res.status(400).json({
        success: false,
        message:
          "For online renewal, use the Razorpay payment flow.",
      });
    }

    // Validate the secure renewal link.
    const result =
      await getSubscriptionRenewalLinkService(token);

    const subscription = result.subscription;
    const linkId = result.linkId;

    if (!linkId) {
      throw new Error(
        "Renewal link ID is missing. Update the renewal-link service first."
      );
    }

    const status = String(
      subscription.status || ""
    ).trim().toLowerCase();

    if (
      ["stopped", "cancelled", "canceled"].includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: "This subscription cannot be renewed.",
      });
    }

    const totalAmount = Number(subscription.total_amount);

    if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid subscription amount.",
      });
    }

    // Finalize renewal atomically in Supabase.
    // The database RPC must validate the link and prevent duplicate renewals.
    const { data, error } = await supabaseAdmin.rpc(
      "finalize_subscription_renewal",
      {
        p_link_id: linkId,
        p_renewal_key: String(linkId),
        p_payment_method: "COD",
        p_payment_reference: null,
        p_payment_intent_id: null,
      }
    );

    if (error) {
      console.error("COD renewal finalization failed:", error);

      return res.status(400).json({
        success: false,
        message: error.message ||
          "Unable to finalize subscription renewal.",
      });
    }

    return res.json({
      success: true,
      message: "Subscription renewed successfully with COD.",
      renewal: data,
    });
  } catch (err) {
    console.error("Renew Using Link Error:", err);

    return res.status(400).json({
      success: false,
      message: err.message ||
        "Unable to renew subscription.",
    });
  }
}