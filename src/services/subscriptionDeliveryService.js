import {
  getJSON,
  postJSON,
  putJSON,
} from "../config/api";

const API_URL = "https://farmfreshdairy.onrender.com/api";
// const API_URL =
//   "http://localhost:5000/api";
/**
 * Get Today's Subscription Deliveries
 */
export async function getSubscriptionDeliveries() {
  const response = await getJSON(
    `${API_URL}/subscription-deliveries`
  );

  return response.deliveries || [];
}

/**
 * Get Single Delivery
 */
export async function getSubscriptionDelivery(id) {
  return await getJSON(
    `${API_URL}/subscription-deliveries/${id}`
  );
}

/**
 * Generate Today's Deliveries
 */
export async function generateSubscriptionDeliveries() {
  return await postJSON(
    `${API_URL}/subscription-deliveries/generate`,
    {}
  );
}

/**
 * Assign Delivery Boy
 */
export async function assignSubscriptionDelivery(
  deliveryId,
  deliveryBoyId
) {
  return await putJSON(
    `${API_URL}/subscription-deliveries/${deliveryId}/assign`,
    {
      delivery_boy_id: deliveryBoyId,
    }
  );
}

/**
 * Update Delivery Status
 */
/**
 * Update Delivery Status
 */
export async function updateSubscriptionDeliveryStatus(
  deliveryId,
  status
) {
  return await putJSON(
    `${API_URL}/subscription-deliveries/${deliveryId}/status`,
    {
      status,
      delivery_type: "Subscription",
    }
  );
}

/**
 * Delete Delivery
 */
export async function deleteSubscriptionDelivery(
  deliveryId
) {
  return await fetch(
    `${API_URL}/subscription-deliveries/${deliveryId}`,
    {
      method: "DELETE",
    }
  ).then((res) => res.json());
}
export async function bulkAssignSubscriptionDeliveries(
  deliveryIds,
  deliveryBoyId
) {
  return await putJSON(
    `${API_URL}/subscription-deliveries/bulk-assign`,
    {
      delivery_ids: deliveryIds,
      delivery_boy_id: deliveryBoyId,
    }
  );
}
// ==========================================
// AUTO ASSIGN SETTING
// ==========================================

export async function getAutoAssignSetting() {
  const response = await fetch(
    `${API_URL}/admin/auto-assign`
  );

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(
      data.message ||
        "Failed to load auto assign setting."
    );
  }

  return data;
}

export async function setAutoAssignSetting(enabled) {
  const response = await fetch(
    `${API_URL}/admin/auto-assign`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        enabled,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(
      data.message ||
        "Failed to update auto assign setting."
    );
  }

  return data;
}