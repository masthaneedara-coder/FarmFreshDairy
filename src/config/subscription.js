// src/config/subscription.js

const PENDING_SUBSCRIPTION_KEY = "pendingSubscription";

/* ---------------------------------------
   SAVE PENDING SUBSCRIPTION
--------------------------------------- */
export function savePendingSubscription(data) {
  localStorage.setItem(PENDING_SUBSCRIPTION_KEY, JSON.stringify(data));
}

/* ---------------------------------------
   GET PENDING SUBSCRIPTION
--------------------------------------- */
export function getPendingSubscription() {
  try {
    const data = JSON.parse(
      localStorage.getItem(PENDING_SUBSCRIPTION_KEY) || "null"
    );
    return data;
  } catch {
    return null;
  }
}

/* ---------------------------------------
   CLEAR PENDING SUBSCRIPTION
--------------------------------------- */
export function clearPendingSubscription() {
  localStorage.removeItem(PENDING_SUBSCRIPTION_KEY);
}