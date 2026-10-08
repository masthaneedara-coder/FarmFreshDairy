export default async function handler(req, res) {
  try {
    console.log("==================================");
    console.log("VERCEL DELIVERY GENERATION");
    console.log("Time:", new Date().toISOString());
    console.log("==================================");

    const { generateTodayDeliveriesService } =
      await import("../../src/services/subscriptionDelivery.service.js");

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

    return res.status(200).json({
      success: true,
      message: "Delivery generation completed",
      generated: deliveryResult.created?.length || 0,
      existing: deliveryResult.updated?.length || 0,
      skipped: deliveryResult.skipped || 0,
    });
  } catch (error) {
    console.error("DELIVERY GENERATION ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Delivery generation failed",
      error: error.message,
    });
  }
}