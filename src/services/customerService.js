import { getJSON, postJSON } from "../config/api";
const API_URL = "https://farmfreshdairy.onrender.com/api";

let cachedCustomer = null;
let cachedUid = null;

// =============================
// Get Customer By Firebase UID
// =============================


// =============================
// Get Customer By Phone
// =============================
export async function getCustomerByPhone(phone) {
  const response = await getJSON(
    `${API_URL}/customers/phone/${phone}`
  );

  return response.customer;
}

// =============================
// Create Customer
// =============================


// =============================
// Clear Cache (Logout)
// =============================
export function clearCustomerCache() {
  cachedUid = null;
  cachedCustomer = null;
}