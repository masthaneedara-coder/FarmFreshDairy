import app from "./app.js";
import { startSubscriptionResumeJob }
  from "./jobs/subscriptionResume.job.js";

const PORT = process.env.PORT || 5000;
startSubscriptionResumeJob();

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});