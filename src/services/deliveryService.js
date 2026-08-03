import { getJSON } from "../config/api";
const API_URL = "https://farmfreshdairy.onrender.com/api";

export async function getDeliveryBoys() {
  const response = await getJSON(
    `${API_URL}/delivery-boys`
  );

  return response.deliveryBoys;
}