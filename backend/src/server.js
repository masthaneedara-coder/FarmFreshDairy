
import "dotenv/config";

import app from "./app.js";
import { startSubscriptionResumeJob } from "./jobs/subscriptionResume.job.js";
import { startDeliveryGeneratorJob } from "./jobs/deliveryGenerator.job.js";

const PORT = process.env.PORT || 5000;

console.log(
  "ADMIN_JWT_SECRET loaded:",
  Boolean(process.env.ADMIN_JWT_SECRET),
  "Length:",
  process.env.ADMIN_JWT_SECRET?.length || 0
);

startSubscriptionResumeJob();
startDeliveryGeneratorJob();

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
