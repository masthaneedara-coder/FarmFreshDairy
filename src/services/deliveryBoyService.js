import {
  getJSON,
  postJSON,
  putJSON,
  deleteJSON,
  patchJSON,
} from "../config/api";

const API_URL = "https://farmfreshdairy.onrender.com/api"

// Get All
export async function getDeliveryBoys() {
  const response = await getJSON(API_URL);
  return response.deliveryBoys;
}

// Get By ID
export async function getDeliveryBoy(id) {
  const response = await getJSON(`${API_URL}/${id}`);
  return response.deliveryBoy;
}

// Create
export async function createDeliveryBoy(data) {
  const response = await postJSON(API_URL, data);
  return response.deliveryBoy;
}

// Update
export async function updateDeliveryBoy(id, data) {
  const response = await putJSON(`${API_URL}/${id}`, data);
  return response.deliveryBoy;
}

// Delete
export async function deleteDeliveryBoy(id) {
  return await deleteJSON(`${API_URL}/${id}`);
}

// Activate / Deactivate
export async function toggleDeliveryBoyStatus(
  id,
  is_active
) {
  const response = await patchJSON(
    `${API_URL}/${id}/status`,
    { is_active }
  );

  return response.deliveryBoy;
}