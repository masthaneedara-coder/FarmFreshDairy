import { getDashboard } from "../config/api";

export async function fetchDashboard(customerId) {
  try {
    const res = await getDashboard(customerId);

    if (!res.success) {
      throw new Error(res.message);
    }

    return res.dashboard;
  } catch (err) {
    console.error("Dashboard:", err);
    return null;
  }
}