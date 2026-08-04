import { getJSON } from "../config/api";

const API_URL = "https://farmfreshdairy.onrender.com/api";

// Get All Customers
export async function getAllCustomers() {
  const response = await getJSON(
    `${API_URL}/admin/customers`
  );

  return response.customers;
}

// Get Customer By ID
export async function getCustomerById(id) {
  const response = await getJSON(
    `${API_URL}/admin/customers/${id}`
  );

  return response.customer;
}