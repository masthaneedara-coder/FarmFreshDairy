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
