import cron from "node-cron";
import {
  autoResumePausedSubscriptionsService,
} from "../services/subscription.service.js";

export function startSubscriptionResumeJob() {
  console.log("=================================");
  console.log("SUBSCRIPTION RESUME JOB STARTED");
  console.log("Timezone: Asia/Kolkata");
  console.log("Schedule: Every day at 4:00 AM IST");
  console.log("=================================");

  cron.schedule(
    "0 4 * * *",
    async () => {
      console.log("=================================");
      console.log("AUTO RESUME JOB RUNNING");
      console.log("Time:", new Date().toISOString());
      console.log("=================================");

      try {
        const resumed =
          await autoResumePausedSubscriptionsService();

        console.log(
          `✅ Auto Resumed: ${resumed.length} subscriptions`
        );
      } catch (error) {
        console.error(
          "❌ Auto Resume Job Error:",
          error
        );
      }

      console.log("=================================");
    },
    {
      timezone: "Asia/Kolkata",
    }
  );
}