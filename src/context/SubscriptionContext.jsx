import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  getActiveSubscription,
  getSubscriptionHistory,
  getBillingSummary,
  getUpcomingDelivery,
  createNewSubscription,
  editSubscription,
  pauseSubscription,
  resumeSubscription,
  cancelSubscription,
  renewCustomerSubscription,
  getSubscriptionDeliverySummary
} from "../services/subscriptionService";
// import { getMySubscriptions } from "../services/subscriptionService";

const SubscriptionContext = createContext();



export function SubscriptionProvider({ children }) {
  const [subscription, setSubscription] = useState(null);
  const [history, setHistory] = useState([]);
  const [billing, setBilling] = useState(null);
  const [upcomingDelivery, setUpcomingDelivery] = useState(null);

  const [selectedProduct, setSelectedProduct] = useState(null);

  const [deliveryOptions, setDeliveryOptions] = useState({
    frequency: "Daily",
    deliveryTime: "Morning",
    duration: 30,
    startDate: "",
    notes: "",
  });
  const [deliverySummary, setDeliverySummary] = useState({
    delivered: 0,
    outForDelivery: 0,
    pending: 0,
    missed: 0,
    total: 0,
  });
   

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load everything for one customer
  const loadSubscriptionData = async (customerId) => {
    if (!customerId) return;

    try {
      setLoading(true);
      setError(null);

      const [
            active,
            historyData,
            billingData,
            upcomingData,
          ] = await Promise.all([
            getActiveSubscription(customerId),
            getSubscriptionHistory(customerId),
            getBillingSummary(customerId),
            getUpcomingDelivery(customerId),
          ]);

          setSubscription(active || null);
          setHistory(historyData || []);
          setBilling(billingData || null);
          setUpcomingDelivery(upcomingData || null);

          // Load Delivery Summary
          if (active?.id) {

            const summary =
              await getSubscriptionDeliverySummary(
                active.id
              );

            setDeliverySummary(summary);

          } else {

            setDeliverySummary({
              delivered: 0,
              outForDelivery: 0,
              pending: 0,
              missed: 0,
              total: 0,
            });

          }

    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load subscription data.");
    } finally {
      setLoading(false);
    }
  };

  // Actions

  const createSubscription = async (payload) => {
    const result = await createNewSubscription(payload);

    if (payload.customer_id) {
      await loadSubscriptionData(payload.customer_id);
    }

    return result;
  };
  

  const updateSubscription = async (id, payload) => {
    const result = await editSubscription(id, payload);

    if (subscription?.customer_id) {
      await loadSubscriptionData(subscription.customer_id);
    }

    return result;
  };

  const pause = async (
  pauseFrom,
  pauseTo
) => {

  if (!subscription) return;

  await pauseSubscription(
    subscription.id,
    pauseFrom,
    pauseTo
  );

  await loadSubscriptionData(
    subscription.customer_id
  );
};

  const resume = async () => {
    if (!subscription) return;

    await resumeSubscription(subscription.id);
    await loadSubscriptionData(subscription.customer_id);
  };

  const cancel = async () => {
    if (!subscription) return;

    await cancelSubscription(subscription.id);
    await loadSubscriptionData(subscription.customer_id);
  };

  const renew = async (endDate, totalAmount) => {
    if (!subscription) return;

    await renewCustomerSubscription(
      subscription.id,
      endDate,
      totalAmount
    );

    await loadSubscriptionData(subscription.customer_id);
  };
  

  return (
    <SubscriptionContext.Provider
      value={{
          subscription,
          history,
          billing,
          upcomingDelivery,
          deliverySummary,

          selectedProduct,
          deliveryOptions,
          loading,
          error,

          setSelectedProduct,
          setDeliveryOptions,

          loadSubscriptionData,

          createSubscription,
          updateSubscription,
          pause,
          resume,
          cancel,
          renew,
        }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  return useContext(SubscriptionContext);
}