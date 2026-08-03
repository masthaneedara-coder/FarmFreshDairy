import {
  getJSON,
  postJSON,
} from "../config/api";

const API_URL = "https://farmfreshdairy.onrender.com/api";

export async function getAllBills() {
  const res = await getJSON(API);
  return res.bills;
}

export async function getBill(id) {
  const res = await getJSON(`${API}/${id}`);
  return res.bill;
}

export async function createOrderInvoice(orderId) {
  const res = await postJSON(
    `${API}/order/${orderId}`
  );

  return res.invoice;
}

export async function createSubscriptionInvoice(
  subscriptionId
) {
  const res = await postJSON(
    `${API}/subscription/${subscriptionId}`
  );

  return res.invoice;
}