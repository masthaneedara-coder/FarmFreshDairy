import cron from "node-cron";

import {
  generateTodayDeliveriesService,
} from "../services/subscriptionDelivery.service.js";

import {
  autoAssignTodayDeliveriesService,
} from "../services/deliveryAssignment.service.js";

export function startDeliveryGeneratorJob() {

  // Every day at 4:00 AM IST
  cron.schedule(
    "0 4 * * *",
    async () => {

      console.log("==================================");
      console.log("DAILY SUBSCRIPTION JOB");
      console.log("4:00 AM IST");
      console.log(
        "UTC Time:",
        new Date().toISOString()
      );
      console.log("==================================");

      // ====================================================
      // 1. GENERATE TODAY'S DELIVERIES
      // ====================================================

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
          `Existing: ${result.updated.length}`
        );

        console.log(
          `Skipped: ${result.skipped}`
        );

      } catch (err) {

        console.error(
          "Delivery Generator Error:",
          err
        );

        // Do not continue assignment if generation failed
        return;
      }

      // ====================================================
      // 2. AUTO ASSIGN DELIVERY BOYS
      // ====================================================

      try {

        console.log(
          "Starting Auto Assignment..."
        );

        const assignment =
          await autoAssignTodayDeliveriesService();

        console.log(
          `Auto Assigned: ${assignment.assigned.length}`
        );

        console.log(
          `Remaining Pending: ${assignment.pending.length}`
        );

      } catch (err) {

        console.error(
          "Auto Assignment Error:",
          err
        );

      }

      console.log("==================================");
      console.log(
        "DAILY SUBSCRIPTION JOB COMPLETED"
      );
      console.log("==================================");

    },
    {
      timezone: "Asia/Kolkata",
    }
  );
}