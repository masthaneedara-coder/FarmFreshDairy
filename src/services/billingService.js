
import {
  getJSON,
  postJSON,
} from "../config/api";

const API = "https://farmfreshdairy.onrender.com/api/billing";

// Get all bills
export async function getAllBills() {
  const res = await getJSON(API);
  return res?.bills || [];
}

// Get bill by ID
export async function getBill(id) {
  if (!id) {
    throw new Error("Bill ID is required");
  }

  const res = await getJSON(`${API}/${id}`);
  return res?.bill || null;
}

// Create order invoice
export async function createOrderInvoice(orderId) {
  if (!orderId) {
    throw new Error("Order ID is required");
  }

  const res = await postJSON(
    `${API}/order/${orderId}`,
    {}
  );

  return res?.invoice || null;
}

// Create subscription invoice
export async function createSubscriptionInvoice(
  subscriptionId
) {
  if (!subscriptionId) {
    throw new Error("Subscription ID is required");
  }

  const res = await postJSON(
    `${API}/subscription/${subscriptionId}`,
    {}
  );

  return res?.invoice || null;
}