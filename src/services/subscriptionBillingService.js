import { getJSON } from "../config/api";

const API_URL = "https://farmfreshdairy.onrender.com/api";

export async function getSubscriptionBills() {
  const data = await getJSON(
    `${API_URL}/billing/subscription-bills`
  );

  return data.bills || [];
}