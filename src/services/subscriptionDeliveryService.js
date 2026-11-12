import {
  getJSON,
  postJSON,
  putJSON,
} from "../config/api";

const API_URL = "https://farmfreshdairy.onrender.com/api";
// const API_URL = "http://localhost:5000/api";

export async function getSubscriptionDeliveries() {
  const response = await getJSON(`${API_URL}/subscription-deliveries`);
  return response.deliveries || [];
}

export async function getPreviousUnconfirmedDeliveries() {
  const response = await getJSON(`${API_URL}/subscription-deliveries/previous-pending`);
  return response.deliveries || [];
}

export async function getSubscriptionDelivery(id) {
  return await getJSON(`${API_URL}/subscription-deliveries/${id}`);
}

export async function generateSubscriptionDeliveries() {
  return await postJSON(`${API_URL}/subscription-deliveries/generate`, {});
}

export async function assignSubscriptionDelivery(deliveryId, deliveryBoyId) {
  return await putJSON(`${API_URL}/subscription-deliveries/${deliveryId}/assign`, {
    delivery_boy_id: deliveryBoyId,
  });
}

export async function updateSubscriptionDeliveryStatus(deliveryId, status) {
  return await putJSON(`${API_URL}/subscription-deliveries/${deliveryId}/status`, {
    status,
    delivery_type: "Subscription",
  });
}

export async function deleteSubscriptionDelivery(deliveryId) {
  const response = await fetch(`${API_URL}/subscription-deliveries/${deliveryId}`, {
    method: "DELETE",
  });
  const data = await response.json();
  if (!response.ok || data?.success === false) {
    throw new Error(data?.message || "Failed to delete delivery.");
  }
  return data;
}

export async function bulkAssignSubscriptionDeliveries(deliveryIds, deliveryBoyId) {
  return await putJSON(`${API_URL}/subscription-deliveries/bulk-assign`, {
    delivery_ids: deliveryIds,
    delivery_boy_id: deliveryBoyId,
  });
}

export async function getAutoAssignSetting() {
  const response = await fetch(`${API_URL}/admin/auto-assign`);
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || "Failed to load auto assign setting.");
  }
  return data;
}

export async function setAutoAssignSetting(enabled) {
  const response = await fetch(`${API_URL}/admin/auto-assign`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ enabled }),
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || "Failed to update auto assign setting.");
  }
  return data;
}

// Admin: list all customer delivery overrides.
export async function getAllSubscriptionDeliveryOverrides() {
  const response = await getJSON(`${API_URL}/subscription-deliveries/overrides`);
  return response.overrides || [];
}

// Admin: remove one scheduled product override.
export async function deleteSubscriptionDeliveryOverride(subscriptionId, deliveryDate, productId) {
  const response = await fetch(
    `${API_URL}/subscription-deliveries/${subscriptionId}/delivery-overrides/${encodeURIComponent(deliveryDate)}/${encodeURIComponent(productId)}`,
    { method: "DELETE" }
  );
  const data = await response.json();
  if (!response.ok || data?.success === false) {
    throw new Error(data?.message || "Failed to delete delivery override.");
  }
  return data;
}
