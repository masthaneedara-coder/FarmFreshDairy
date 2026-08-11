import cron from "node-cron";
import { generateTodayDeliveriesService } from "../services/subscriptionDelivery.service.js";
import {
  autoResumePausedSubscriptionsService,
} from "../services/subscription.service.js";
export function startDeliveryGeneratorJob() {

  // Every day at 5:00 AM
  cron.schedule("0 4 * * *", async () => {

    console.log("==================================");
    console.log("DAILY SUBSCRIPTION JOB");
    console.log("==================================");

    // ==========================================
    // 1. Auto Resume expired subscriptions
    // ==========================================
    try {

      const resumed =
        await autoResumePausedSubscriptionsService();

      console.log(
        `Auto Resumed: ${resumed.length}`
      );

    } catch (err) {

      console.error(
        "Auto Resume Error:",
        err
      );

    }

    // ==========================================
    // 2. Generate today's deliveries
    // ==========================================
    try {

      console.log(
        "Generating Today's Deliveries..."
      );

      const result =
        await generateTodayDeliveriesService();

      console.log(
        `Generated: ${result.created.length}`
      );

      console.log(
        `Skipped: ${result.skipped}`
      );

    } catch (err) {

      console.error(
        "Delivery Generator Error"
      );

      console.error(err);

    }

  });

}