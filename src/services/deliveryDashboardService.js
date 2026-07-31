import { getJSON } from "../config/api";

const API_URL = "http://localhost:5000/api";

export async function fetchDeliveryDashboard(
  deliveryBoyId
) {

  return await getJSON(
    `${API_URL}/delivery-dashboard/${deliveryBoyId}`
  );

}