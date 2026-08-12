import {
  getJSON,
} from "../config/api";

const API_URL =
  "https://farmfreshdairy.onrender.com/api";

// ======================================
// Get Delivery Boys
// ======================================
export async function getDeliveryBoys() {

  const response =
    await getJSON(
      `${API_URL}/delivery-boys`
    );

  return response.deliveryBoys || [];
}


// ======================================
// Get Delivery Boy History
// ======================================
export async function getDeliveryBoyHistory(
  deliveryBoyId
) {

  const response =
    await getJSON(
      `${API_URL}/delivery-boys/${deliveryBoyId}/history`
    );

  return response.history || [];
}