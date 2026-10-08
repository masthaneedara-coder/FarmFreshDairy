export default async function handler(req, res) {
  try {
    console.log("==================================");
    console.log("VERCEL DELIVERY GENERATION");
    console.log("Time:", new Date().toISOString());
    console.log("==================================");

    // ========================================================
    // 1. GENERATE TODAY'S DELIVERIES
    // ========================================================

    const {
      generateTodayDeliveriesService,
    } = await import(
      "../../src/services/subscriptionDelivery.service.js"
    );

    const deliveryResult =
      await generateTodayDeliveriesService();

    console.log(
      `Generated: ${deliveryResult.created?.length || 0}`
    );

    console.log(
      `Existing: ${deliveryResult.updated?.length || 0}`
    );

    console.log(
      `Skipped: ${deliveryResult.skipped || 0}`
    );

    // ========================================================
    // 2. AUTO ASSIGN DELIVERY BOYS
    // ========================================================

    const {
      autoAssignTodayDeliveriesService,
    } = await import(
      "../../src/services/deliveryAssignment.service.js"
    );

    const assignmentResult =
      await autoAssignTodayDeliveriesService();

    console.log(
      `Auto assigned: ${assignmentResult.assigned}`
    );

    console.log(
      `Auto assignment pending: ${assignmentResult.pending}`
    );

    // ========================================================
    // 3. RESPONSE
    // ========================================================

    return res.status(200).json({
      success: true,

      message:
        "Delivery generation and auto assignment completed",

      generated:
        deliveryResult.created?.length || 0,

      existing:
        deliveryResult.updated?.length || 0,

      skipped:
        deliveryResult.skipped || 0,

      autoAssignment: {
        enabled:
          assignmentResult.enabled,

        assigned:
          assignmentResult.assigned,

        pending:
          assignmentResult.pending,

        workload:
          assignmentResult.workload,
      },
    });

  } catch (error) {
    console.error(
      "DELIVERY CRON ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Delivery generation failed",
      error: error.message,
    });
  }
}