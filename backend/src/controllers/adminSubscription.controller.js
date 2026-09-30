import {
  getAllSubscriptionsService,
  updateSubscriptionStatusService,
} from "../services/adminSubscription.service.js";
import { supabaseAdmin } from "../config/supabase.js";

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


const getIndiaDate = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

export async function sendExpiryReminders(req, res) {
  try {
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const templateName = process.env.WHATSAPP_TEMPLATE_NAME;
    const languageCode =
      process.env.WHATSAPP_LANGUAGE_CODE || "en";

    if (!accessToken || !phoneNumberId || !templateName) {
      return res.status(500).json({
        success: false,
        message: "WhatsApp API environment variables are missing.",
      });
    }

    // Get today's date in India
    const today = getIndiaDate();

    // Date 5 days from today
    const endDateObj = new Date(`${today}T00:00:00+05:30`);
    endDateObj.setDate(endDateObj.getDate() + 5);

    const endDate = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(endDateObj);

    // Get subscriptions expiring today through the next 5 days
    const { data: subscriptions, error } = await supabaseAdmin
      .from("subscriptions")
      .select("id, customer_id, end_date, status, is_paused")
      .eq("status", "Active")
      .eq("is_paused", false)
      .gte("end_date", today)
      .lte("end_date", endDate);

    if (error) throw error;

    if (!subscriptions?.length) {
      return res.json({
        success: true,
        message: "No active subscriptions expiring within 5 days.",
        total: 0,
        sent: 0,
        failed: 0,
        results: [],
      });
    }

    const results = [];

    for (const subscription of subscriptions) {
      try {
        const { data: customer, error: customerError } =
          await supabaseAdmin
            .from("customers")
            .select("full_name, phone")
            .eq("id", subscription.customer_id)
            .single();

        if (customerError || !customer?.phone) {
          results.push({
            subscriptionId: subscription.id,
            customerName: customer?.full_name || "Customer",
            success: false,
            message: "Customer phone number not found.",
          });
          continue;
        }

        // Normalize Indian phone number to international format
        let phone = String(customer.phone).replace(/\D/g, "");

        if (phone.length === 10) {
          phone = `91${phone}`;
        } else if (phone.startsWith("0") && phone.length === 11) {
          phone = `91${phone.substring(1)}`;
        }

        if (phone.length < 10) {
          results.push({
            subscriptionId: subscription.id,
            customerName: customer.full_name,
            success: false,
            message: "Invalid customer phone number.",
          });
          continue;
        }

        const expiryDate = new Date(
          `${subscription.end_date}T00:00:00`
        );

        const todayDate = new Date(`${today}T00:00:00`);

        const remainingDays = Math.max(
          0,
          Math.round(
            (expiryDate.getTime() - todayDate.getTime()) /
              (1000 * 60 * 60 * 24)
          )
        );

        const formattedExpiry = new Intl.DateTimeFormat("en-IN", {
          day: "2-digit",
          month: "long",
          year: "numeric",
          timeZone: "Asia/Kolkata",
        }).format(expiryDate);

        // Send approved WhatsApp template
        const response = await fetch(
          `https://graph.facebook.com/${process.env.WHATSAPP_API_VERSION}/${phoneNumberId}/messages`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              messaging_product: "whatsapp",
              recipient_type: "individual",
              to: phone,
              type: "template",
              template: {
                name: templateName,
                language: {
                  code: languageCode,
                },
                components: [
                  {
                    type: "body",
                    parameters: [
                      {
                        type: "text",
                        text: customer.full_name || "Customer",
                      },
                      {
                        type: "text",
                        text: String(remainingDays),
                      },
                      {
                        type: "text",
                        text: formattedExpiry,
                      },
                    ],
                  },
                ],
              },
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          results.push({
            subscriptionId: subscription.id,
            customerName: customer.full_name,
            success: false,
            message:
              data?.error?.message || "WhatsApp sending failed.",
          });
          continue;
        }

        results.push({
          subscriptionId: subscription.id,
          customerName: customer.full_name,
          success: true,
          messageId: data?.messages?.[0]?.id,
        });
      } catch (error) {
        results.push({
          subscriptionId: subscription.id,
          success: false,
          message: error.message,
        });
      }
    }

    const sent = results.filter((item) => item.success).length;
    const failed = results.length - sent;

    return res.json({
      success: true,
      message: `WhatsApp reminders processed. Sent: ${sent}, Failed: ${failed}.`,
      total: subscriptions.length,
      sent,
      failed,
      results,
    });
  } catch (err) {
    console.error("WhatsApp expiry reminder error:", err);

    return res.status(500).json({
      success: false,
      message: err.message || "Failed to send expiry reminders.",
    });
  }
}