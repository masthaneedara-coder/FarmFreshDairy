import { generateTodayDeliveriesService } from "../../src/services/subscriptionDelivery.service.js";
import { autoAssignTodayDeliveriesService } from "../../src/services/deliveryAssignment.service.js";

export default async function handler(req, res) {
  try {
    console.log("==================================");
    console.log("VERCEL DAILY DELIVERY CRON");
    console.log("Time:", new Date().toISOString());
    console.log("==================================");

    // 1. Generate today's subscription deliveries
    const deliveryResult = await generateTodayDeliveriesService();

    console.log(
      `Generated: ${deliveryResult.created?.length || 0}`
    );

    console.log(
      `Existing: ${deliveryResult.updated?.length || 0}`
    );

    console.log(
      `Skipped: ${deliveryResult.skipped || 0}`
    );

    // 2. Automatically assign delivery boys
    const assignmentResult =
      await autoAssignTodayDeliveriesService();

    console.log(
      `Auto Assigned: ${assignmentResult.assigned?.length || 0}`
    );

    console.log(
      `Remaining Pending: ${assignmentResult.pending?.length || 0}`
    );

    console.log("==================================");
    console.log("VERCEL DAILY DELIVERY CRON COMPLETED");
    console.log("==================================");

    return res.status(200).json({
      success: true,
      message: "Daily delivery job completed",
      generated: deliveryResult.created?.length || 0,
      existing: deliveryResult.updated?.length || 0,
      skipped: deliveryResult.skipped || 0,
      assigned: assignmentResult.assigned?.length || 0,
      pending: assignmentResult.pending?.length || 0,
    });
  } catch (error) {
    console.error("VERCEL DAILY DELIVERY CRON ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Daily delivery job failed",
      error: error.message,
    });
  }
}