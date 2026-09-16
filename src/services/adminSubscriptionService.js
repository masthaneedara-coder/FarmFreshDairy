import { getJSON, putJSON } from "../config/api";

import {
  fetchSubscriptionDeliverySummary,
} from "../config/api";

const API_URL =
  "https://farmfreshdairy.onrender.com/api";

// ======================================
// Get All Subscriptions
// ======================================
export async function getAllSubscriptions() {
  const response = await getJSON(
    `${API_URL}/admin/subscriptions`
  );

  console.log(
    "ADMIN SUBSCRIPTIONS:",
    response.subscriptions
  );

  const subscriptions =
    response.subscriptions || [];

  // ======================================
  // Get Actual Billing / Payment Records
  // ======================================
  let billingRecords = [];

  try {
    const billingResponse =
      await getJSON(`${API_URL}/billing/subscription-bills`);

    console.log(
      "ADMIN BILLING:",
      billingResponse
    );

    if (Array.isArray(billingResponse)) {
      billingRecords = billingResponse;
    } else if (
      Array.isArray(billingResponse?.billing)
    ) {
      billingRecords = billingResponse.billing;
    } else if (
      Array.isArray(billingResponse?.bills)
    ) {
      billingRecords = billingResponse.bills;
    } else if (
      Array.isArray(billingResponse?.data)
    ) {
      billingRecords = billingResponse.data;
    }
  } catch (error) {
    console.error(
      "Failed to load billing records:",
      error
    );
  }

  // ======================================
  // Attach Latest Billing Record
  // to Each Subscription
  // ======================================
  return subscriptions.map((subscription) => {
    const subscriptionId =
      subscription.subscriptionId ||
      subscription.id;

    const matchingBills =
      billingRecords.filter(
        (bill) =>
          String(bill.subscription_id || "") ===
          String(subscriptionId)
      );

    // Latest billing record
    const latestBill =
      matchingBills.sort((a, b) => {
        const dateA = new Date(
          a.invoice_date ||
          a.created_at ||
          0
        ).getTime();

        const dateB = new Date(
          b.invoice_date ||
          b.created_at ||
          0
        ).getTime();

        return dateB - dateA;
      })[0] || null;

    return {
      ...subscription,

      // IMPORTANT:
      // This is the actual billing record.
      billing: latestBill,
    };
  });
}

// ======================================
// Update Subscription Status
// ======================================
export async function updateSubscriptionStatus(
  id,
  status
) {
  const response = await putJSON(
    `${API_URL}/admin/subscriptions/${id}/status`,
    {
      status,
    }
  );

  return response.subscription;
}

// ======================================
// Get Delivery Summary
// ======================================
export async function getDeliverySummary(
  subscriptionId
) {
  const data =
    await fetchSubscriptionDeliverySummary(
      subscriptionId
    );

  return data.summary;
}