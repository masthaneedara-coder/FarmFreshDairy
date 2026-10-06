import express from "express";
import { supabaseAdmin } from "../config/supabase.js";
import {
  getCustomerByPhoneService,
} from "../services/customer.service.js";
import {
  getCustomerAndSubscriptionForWhatsApp,
} from "../services/whatsapp.service.js";

const router = express.Router();

router.get("/test-phone/:phone", async (req, res) => {
  try {
    const customer = await getCustomerByPhoneService(
      req.params.phone
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    return res.json({
      success: true,
      customer,
    });

  } catch (error) {
    console.error(
      "Test phone lookup error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});
router.get(
  "/test-all-subscriptions/:customerId",
  async (req, res) => {
    try {
      const { customerId } = req.params;

      const { data, error } = await supabaseAdmin
        .from("subscriptions")
        .select(`
          id,
          customer_id,
          status,
          start_date,
          end_date,
          delivery_time,
          frequency,
          is_paused,
          pause_from,
          pause_to,
          created_at
        `)
        .eq("customer_id", customerId)
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.error(
          "All subscriptions lookup error:",
          error
        );

        return res.status(500).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(200).json({
        success: true,
        count: data?.length || 0,
        subscriptions: data || [],
      });

    } catch (error) {
      console.error(
        "Test all subscriptions error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);
router.get(
  "/test-whatsapp-subscription/:phone",
  async (req, res) => {
    try {
      const { phone } = req.params;

      const result =
        await getCustomerAndSubscriptionForWhatsApp(
          phone
        );

      if (!result.customer) {
        return res.status(404).json({
          success: false,
          message: "Customer not found",
        });
      }

      if (!result.subscription) {
        return res.status(404).json({
          success: false,
          message: "No subscription found",
          customer: result.customer,
        });
      }

      return res.status(200).json({
        success: true,
        customer: result.customer,
        subscription: result.subscription,
      });

    } catch (error) {
      console.error(
        "WhatsApp subscription test error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// TEST: Check active subscription by customer ID
router.get("/test-active-subscription/:customerId", async (req, res) => {
  try {
    const { customerId } = req.params;

    const { data, error } = await supabaseAdmin
      .from("subscriptions")
      .select(`
        id,
        customer_id,
        status,
        is_paused,
        start_date,
        end_date,
        pause_from,
        pause_to
      `)
      .eq("customer_id", customerId)
      .eq("status", "Active")
      .eq("is_paused", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return res.status(200).json({
      success: true,
      subscription: data,
      message: data
        ? "Active subscription found"
        : "No active subscription found",
    });

  } catch (error) {
    console.error("Subscription test error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});
// TEST: Get all subscriptions for a customer
router.get("/test-all-subscriptions/:customerId", async (req, res) => {
  try {
    const { customerId } = req.params;

    const { data, error } = await supabaseAdmin
      .from("subscriptions")
      .select(`
        id,
        customer_id,
        status,
        start_date,
        end_date,
        delivery_time,
        frequency,
        is_paused,
        pause_from,
        pause_to,
        created_at
      `)
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return res.status(200).json({
      success: true,
      count: data?.length || 0,
      subscriptions: data || [],
    });
  } catch (error) {
    console.error("All subscriptions test error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});
router.get("/test-whatsapp-pause/:phone", async (req, res) => {
  try {
    const { processWhatsAppPauseRequest } =
      await import("../services/whatsapp.service.js");

    const result = await processWhatsAppPauseRequest({
      whatsappPhone: req.params.phone,
      message: "Pause my milk from 06/10/2026 to 07/10/2026",
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error("WhatsApp pause test error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});
// TEST: Verify WhatsApp pause date parsing
router.get("/test-pause-dates", async (req, res) => {
  try {
    const { extractPauseDates } =
      await import("../services/whatsapp.service.js");

    const result = extractPauseDates(
      "Pause my milk from 06/10/2026 to 07/10/2026"
    );

    return res.status(200).json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("Pause date test error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;