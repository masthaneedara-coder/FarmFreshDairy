import { getJSON } from "../config/api";

const API_URL = "https://farmfreshdairy.onrender.com/api";
//const API_URL = "http://localhost:5000/api";

export async function fetchDeliveryDashboard(
  deliveryBoyId
) {

  return await getJSON(
    `${API_URL}/delivery-dashboard/${deliveryBoyId}`
  );

}
export async function updateDeliveryStatus(orderId, status) {
  return await postJSON(
    `${API_URL}/delivery-dashboard/${orderId}/status`,
    { status }
  );
}