import { getJSON } from "../config/api";

const API_URL = "http://localhost:5000/api";

export async function getDeliveryBoys() {
  const response = await getJSON(
    `${API_URL}/delivery-boys`
  );

  return response.deliveryBoys;
}