import dotenv from "dotenv";

dotenv.config();

import app from "./app.js";
import { startSubscriptionResumeJob } from "./jobs/subscriptionResume.job.js";
import { startDeliveryGeneratorJob } from "./jobs/deliveryGenerator.job.js";

const PORT = process.env.PORT || 5000;

startSubscriptionResumeJob();
startDeliveryGeneratorJob();

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});