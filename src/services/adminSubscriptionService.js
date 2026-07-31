import { getJSON, putJSON } from "../config/api";
import {
  fetchSubscriptionDeliverySummary,
} from "../config/api";
const API_URL = "http://localhost:5000/api";

export async function getAllSubscriptions() {
  const response = await getJSON(
    `${API_URL}/admin/subscriptions`
  );

  return response.subscriptions;
}

export async function updateSubscriptionStatus(id, status) {
  const response = await putJSON(
    `${API_URL}/admin/subscriptions/${id}/status`,
    { status }
  );

  return response.subscription;
}
export async function getDeliverySummary(subscriptionId) {
  const data =
    await fetchSubscriptionDeliverySummary(
      subscriptionId
    );

  return data.summary;
}