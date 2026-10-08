import { generateTodayDeliveriesService } from "../../src/services/subscriptionDelivery.service.js";
import { autoAssignTodayDeliveriesService } from "../../src/services/deliveryAssignment.service.js";

export default async function handler(req, res) {
  return res.status(200).json({
    success: true,
    message: "Vercel Cron endpoint is working",
    time: new Date().toISOString(),
  });
}
