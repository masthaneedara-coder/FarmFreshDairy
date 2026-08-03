import { getJSON } from "../config/api";

const API_URL = "https://farmfreshdairy.onrender.com/api";

export async function fetchDeliveryDashboard(
  deliveryBoyId
) {

  return await getJSON(
    `${API_URL}/delivery-dashboard/${deliveryBoyId}`
  );

}