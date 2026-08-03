import { getJSON } from "../config/api";

const API_URL = "https://farmfreshdairy.onrender.com/api";

// ===============================
// Get All Customers
// ===============================
export async function getAllCustomers() {
  const response = await getJSON(API_URL);
  return response.customers;
}

// ===============================
// Get Customer By ID
// ===============================
export async function getCustomerById(id) {
  const response = await getJSON(`${API_URL}/${id}`);
  return response.customer;
}