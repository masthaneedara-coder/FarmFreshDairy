import {
  fetchCustomerSubscription,
  createSubscription,
  updateSubscription,
  pauseSubscriptionApi,
resumeSubscriptionApi,  
  renewSubscription,
  deleteSubscription,
  fetchSubscriptionHistory,
  fetchBillingSummary,
  fetchUpcomingDelivery,
  fetchSubscriptionDeliverySummary,
} from "../config/api";



/* ==========================================================
   Get Active Subscription
========================================================== */

export async function getActiveSubscription(customerId) {
  return await fetchCustomerSubscription(customerId);
}

/* ==========================================================
   Create Subscription
========================================================== */

export async function createNewSubscription(data) {
  return await createSubscription(data);
}

/* ==========================================================
   Update Subscription
========================================================== */

export async function editSubscription(id, data) {
  return await updateSubscription(id, data);
}

/* ==========================================================
   Pause Subscription
========================================================== */

export async function pauseSubscription(
  id,
  pauseFrom,
  pauseTo
) {
  return await pauseSubscriptionApi(id, {
    pause_from: pauseFrom,
    pause_to: pauseTo,
  });
}

/* ==========================================================
   Resume Subscription
========================================================== */

export async function resumeSubscription(id) {
  return await resumeSubscriptionApi(id);
}

/* ==========================================================
   Cancel Subscription
========================================================== */

export async function cancelSubscription(id) {
  return await updateSubscriptionStatus(id, "Cancelled");
}

/* ==========================================================
   Renew Subscription
========================================================== */

export async function renewCustomerSubscription(
  id,
  endDate,
  totalAmount
) {
  return await renewSubscription(id, {
    end_date: endDate,
    total_amount: totalAmount,
  });
}

/* ==========================================================
   Subscription History
========================================================== */

export async function getSubscriptionHistory(customerId) {
  return await fetchSubscriptionHistory(customerId);
}

/* ==========================================================
   Billing Summary
========================================================== */

export async function getBillingSummary(customerId) {
  return await fetchBillingSummary(customerId);
}

/* ==========================================================
   Upcoming Delivery
========================================================== */

export async function getUpcomingDelivery(customerId) {
  return await fetchUpcomingDelivery(customerId);
}

/* ==========================================================
   Delete Subscription
========================================================== */

export async function removeSubscription(id) {
  return await deleteSubscription(id);
}

/* ==========================================================
   Delivery Summary
========================================================== */

export async function getSubscriptionDeliverySummary(
  subscriptionId
) {
  const response =
    await fetchSubscriptionDeliverySummary(
      subscriptionId
    );

  return response.summary;
}