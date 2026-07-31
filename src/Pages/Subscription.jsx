import { useEffect } from "react";

import SubscriptionHeader from "../components/subscription/SubscriptionHeader";
import ActiveSubscriptionCard from "../components/subscription/ActiveSubscriptionCard";
import ProgressCard from "../components/subscription/ProgressCard";
import BillingCard from "../components/subscription/BillingCard";
import ProductSelector from "../components/subscription/ProductSelector";
import DeliveryOptions from "../components/subscription/DeliveryOptions";
import SubscriptionSummary from "../components/subscription/SubscriptionSummary";
import UpcomingDelivery from "../components/subscription/UpcomingDelivery";
import SubscriptionHistory from "../components/subscription/SubscriptionHistory";
import SubscriptionActions from "../components/subscription/SubscriptionActions";
import SubscriptionStatistics from "../components/subscription/SubscriptionStatistics";
import NextDeliveryCard from "../components/subscription/NextDeliveryCard";
import SubscriptionTimeline from "../components/subscription/SubscriptionTimeline";


import { getCustomerId } from "../config/auth";
import { useSubscription } from "../context/SubscriptionContext";

export default function Subscription() {
  const customerId = getCustomerId();

 const {
  subscription,
  history,
  billing,
  upcomingDelivery,
  deliverySummary,

  selectedProduct,
  setSelectedProduct,

  deliveryOptions,
  setDeliveryOptions,

  loading,
  loadSubscriptionData,

  pause,
  resume,
  cancel,
  renew,
} = useSubscription();

  useEffect(() => {
    if (!customerId) return;

    loadSubscriptionData(customerId);
  }, [customerId, loadSubscriptionData]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xl font-semibold">
        Loading Subscription...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">

      <SubscriptionHeader />

      <div className="max-w-7xl mx-auto px-4 py-6">

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* Left Section */}

          <div className="xl:col-span-2 space-y-6">

            <ProductSelector
              selectedProduct={selectedProduct}
              onSelectProduct={setSelectedProduct}
            />

            <DeliveryOptions
              options={deliveryOptions}
              onChange={setDeliveryOptions}
            />

            <SubscriptionSummary
              subscription={subscription}
              product={selectedProduct}
              quantity={
                subscription?.subscription_items?.[0]?.quantity ??
                selectedProduct?.quantity ??
                1
              }
              size={
                subscription?.subscription_items?.[0]?.size ??
                selectedProduct?.size ??
                "1L"
              }
              frequency={
                subscription?.frequency ??
                deliveryOptions.frequency
              }
              deliveryTime={
                subscription?.delivery_time ??
                deliveryOptions.deliveryTime
              }
              duration={deliveryOptions.duration}
              amount={
                subscription?.total_amount ?? 0
              }
            />

          </div>

          {/* Right Section */}

          <div className="space-y-6">

            <ActiveSubscriptionCard
              subscription={subscription}
            />

            <ProgressCard
              remainingDays={21}
              totalDays={30}
            />

            <BillingCard
              billing={billing}
            />

            <SubscriptionActions
              subscription={subscription}
              onPause={pause}
              onResume={resume}
              onCancel={cancel}
              onRenew={() =>
                renew(
                  subscription?.id,
                  subscription?.end_date,
                  subscription?.total_amount
                )
              }
            />

            <SubscriptionStatistics
              subscription={subscription}
              summary={deliverySummary}
            />

            <NextDeliveryCard
              subscription={subscription}
            />

            <SubscriptionTimeline
              subscription={subscription}
            />

          </div>

        </div>

        <div className="mt-6">
          <UpcomingDelivery
            delivery={upcomingDelivery}
          />
        </div>

        <div className="mt-6">
          <SubscriptionHistory
            subscriptions={history}
          />
        </div>

      </div>

    </div>
  );
}