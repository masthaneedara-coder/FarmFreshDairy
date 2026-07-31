import { getJSON } from "../config/api";

const API_URL = "http://localhost:5000/api";

export async function getSubscriptionBills() {
  const data = await getJSON(
    `${API_URL}/billing/subscription-bills`
  );

  return data.bills || [];
}