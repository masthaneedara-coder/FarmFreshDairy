import { getJSON, putJSON } from "../config/api";

import {
  fetchSubscriptionDeliverySummary,
} from "../config/api";

const API_URL =
  "https://farmfreshdairy.onrender.com/api";

// ======================================
// Get All Subscriptions
// ======================================
export async function getAllSubscriptions() {
  const response = await getJSON(
    `${API_URL}/admin/subscriptions`
  );

  console.log(
    "ADMIN SUBSCRIPTIONS:",
    response.subscriptions
  );

  return response.subscriptions || [];
}

// ======================================
// Update Subscription Status
// ======================================
export async function updateSubscriptionStatus(
  id,
  status
) {
  const response = await putJSON(
    `${API_URL}/admin/subscriptions/${id}/status`,
    {
      status,
    }
  );

  return response.subscription;
}

// ======================================
// Get Delivery Summary
// ======================================
export async function getDeliverySummary(
  subscriptionId
) {
  const data =
    await fetchSubscriptionDeliverySummary(
      subscriptionId
    );

  return data.summary;
}