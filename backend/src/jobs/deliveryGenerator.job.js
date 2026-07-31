import cron from "node-cron";
import { generateTodayDeliveriesService } from "../services/subscriptionDelivery.service.js";

export function startDeliveryGeneratorJob() {

  // Every day at 5:00 AM
  cron.schedule("0 5 * * *", async () => {

    console.log("==================================");
    console.log("Generating Today's Deliveries...");
    console.log("==================================");

    try {

      const result =
        await generateTodayDeliveriesService();

      console.log(
        `Generated: ${result.created.length}`
      );

      console.log(
        `Skipped: ${result.skipped}`
      );

    } catch (err) {

      console.error("Delivery Generator Error");

      console.error(err);

    }

  });

}