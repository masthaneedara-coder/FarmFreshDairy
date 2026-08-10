import { getJSON, postJSON, putJSON } from "../config/api";

const API_URL = "https://farmfreshdairy.onrender.com/api";

// Generate Monthly Bills
export async function generateMonthlyBills(month, year) {
  return await postJSON(
    `${API_URL}/monthly-bills/generate`,
    { month, year }
  );
}

// Get Monthly Bills
export async function getMonthlyBills(month, year) {
  return await getJSON(
    `${API_URL}/monthly-bills?month=${month}&year=${year}`
  );
}

// Get Single Customer Bill
export async function getCustomerBill(customerId, month, year) {
  return await getJSON(
    `${API_URL}/monthly-bills/${customerId}?month=${month}&year=${year}`
  );
}

// Mark Bill Paid
export async function markBillPaid(id) {
  return await putJSON(
    `${API_URL}/monthly-bills/${id}/pay`,
    {}
  );
}