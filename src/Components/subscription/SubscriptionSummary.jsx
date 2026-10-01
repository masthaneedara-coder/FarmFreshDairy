import { CalendarDays, Clock3, CreditCard, Milk } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "../../context/SubscriptionContext";
import { fetchCustomerSubscriptions } from "../../config/api";

export default function SubscriptionSummary() {
  const {
    selectedProduct,
    deliveryOptions,
  } = useSubscription();

  const navigate = useNavigate();

  const [checkingExistingSubscription, setCheckingExistingSubscription] =
    useState(false);

  const [showExistingSubscriptionModal, setShowExistingSubscriptionModal] =
    useState(false);

  const quantity = selectedProduct?.quantity || 1;

  const unitPrice =
    selectedProduct?.unit_price ??
    selectedProduct?.price ??
    0;

  const total = useMemo(
    () =>
      Number(unitPrice) *
      Number(quantity) *
      Number(deliveryOptions?.duration || 30),
    [unitPrice, quantity, deliveryOptions?.duration]
  );

  /*
   * Get logged-in customer
   */
  const getCustomer = () => {
    try {
      const customer = JSON.parse(
        localStorage.getItem("customer") || "null"
      );

      if (customer?.id) {
        return customer;
      }

      const customerId = localStorage.getItem("customerId");

      if (customerId) {
        return {
          id: customerId,
        };
      }

      return null;
    } catch (error) {
      console.error("Unable to read customer:", error);
      return null;
    }
  };

  /*
   * Navigate to Review Subscription page
   */
  const goToReviewSubscription = () => {
    if (!selectedProduct) {
      alert("Please select a product.");
      return;
    }

    const reviewState = {
      product: selectedProduct,

      form: {
        addressId: null,

        quantity: quantity,

        size:
          selectedProduct?.size ||
          selectedProduct?.product_size ||
          "1L",

        frequency:
          deliveryOptions?.frequency ||
          "Daily",

        deliveryTime:
          deliveryOptions?.deliveryTime ||
          "Morning",

        startDate:
          deliveryOptions?.startDate ||
          "",

        duration:
          deliveryOptions?.duration ||
          30,
      },

      /*
       * Your current SubscriptionSummary does not have
       * address information, so we keep this empty.
       */
      addresses: [],

      monthlyAmount: total,
    };

    navigate("/subscription/review", {
      state: reviewState,
    });
  };

  /*
   * Check whether customer already has an active subscription
   */
  const handleReviewSubscription = async () => {
    const customer = getCustomer();

    if (!customer?.id) {
      alert("Please login first.");
      return;
    }

    if (!selectedProduct) {
      alert("Please select a product.");
      return;
    }

    try {
      setCheckingExistingSubscription(true);

      const response = await fetchCustomerSubscriptions(customer.id);

      /*
       * Normalize API response
       */
      let subscriptions = [];

      if (Array.isArray(response)) {
        subscriptions = response;
      } else if (Array.isArray(response?.subscriptions)) {
        subscriptions = response.subscriptions;
      } else if (Array.isArray(response?.data)) {
        subscriptions = response.data;
      } else if (response?.subscription) {
        subscriptions = [response.subscription];
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      /*
       * Active subscription:
       *
       * - status must be Active
       * - subscription must not be paused
       * - end date must be today or future
       */
      const activeSubscription = subscriptions.find((item) => {
        if (!item) return false;

        const status = String(item.status || "").toLowerCase();

        if (status !== "active") {
          return false;
        }

        if (item.is_paused === true) {
          return false;
        }

        if (!item.end_date) {
          return true;
        }

        const endDate = new Date(`${item.end_date}T00:00:00`);

        if (Number.isNaN(endDate.getTime())) {
          return false;
        }

        return endDate >= today;
      });

      if (activeSubscription) {
        /*
         * Customer already has an active subscription.
         * Show confirmation popup before going to review.
         */
        setShowExistingSubscriptionModal(true);
        return;
      }

      /*
       * No active subscription.
       * Directly open Review Subscription page.
       */
      goToReviewSubscription();
    } catch (error) {
      console.error(
        "Error checking existing subscription:",
        error
      );

      /*
       * If checking fails, do not create anything.
       * Let customer continue to Review page.
       */
      goToReviewSubscription();
    } finally {
      setCheckingExistingSubscription(false);
    }
  };

  /*
   * User clicked "Yes, Continue"
   */
  const continueWithNewSubscription = () => {
    setShowExistingSubscriptionModal(false);

    goToReviewSubscription();
  };

  /*
   * No product selected
   */
  if (!selectedProduct) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <Milk className="h-6 w-6 text-green-600" />

          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Subscription Summary
            </h3>

            <p className="text-sm text-gray-500">
              Please select a milk product to continue.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* =========================================================
          SUBSCRIPTION SUMMARY
      ========================================================== */}

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50">
            <Milk className="h-5 w-5 text-green-600" />
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Subscription Summary
            </h3>

            <p className="text-sm text-gray-500">
              Review your subscription details before continuing.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Product */}
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <p className="text-sm text-gray-500">
                Product
              </p>

              <p className="font-medium text-gray-900">
                {selectedProduct.name ||
                  selectedProduct.product_name ||
                  "Milk"}
              </p>
            </div>

            <div className="text-right">
              <p className="text-sm text-gray-500">
                Size
              </p>

              <p className="font-medium text-gray-900">
                {selectedProduct.size ||
                  selectedProduct.product_size ||
                  "1L"}
              </p>
            </div>
          </div>

          {/* Quantity */}
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <p className="text-sm text-gray-500">
                Quantity
              </p>

              <p className="font-medium text-gray-900">
                {quantity}
              </p>
            </div>

            <div className="text-right">
              <p className="text-sm text-gray-500">
                Unit Price
              </p>

              <p className="font-medium text-gray-900">
                ₹{Number(unitPrice).toFixed(2)}
              </p>
            </div>
          </div>

          {/* Frequency */}
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-green-600" />

              <div>
                <p className="text-sm text-gray-500">
                  Frequency
                </p>

                <p className="font-medium text-gray-900">
                  {deliveryOptions?.frequency || "Daily"}
                </p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-sm text-gray-500">
                Duration
              </p>

              <p className="font-medium text-gray-900">
                {deliveryOptions?.duration || 30} days
              </p>
            </div>
          </div>

          {/* Delivery time */}
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2">
              <Clock3 className="h-5 w-5 text-green-600" />

              <div>
                <p className="text-sm text-gray-500">
                  Delivery Time
                </p>

                <p className="font-medium text-gray-900">
                  {deliveryOptions?.deliveryTime || "Morning"}
                </p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-sm text-gray-500">
                Start Date
              </p>

              <p className="font-medium text-gray-900">
                {deliveryOptions?.startDate || "Not selected"}
              </p>
            </div>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between rounded-xl bg-green-50 p-4">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-green-600" />

              <span className="font-semibold text-gray-900">
                Subscription Amount
              </span>
            </div>

            <span className="text-xl font-bold text-green-700">
              ₹{Number(total).toFixed(2)}
            </span>
          </div>
        </div>

        {/* =======================================================
            REVIEW BUTTON
        ======================================================== */}

        <button
          type="button"
          onClick={handleReviewSubscription}
          disabled={checkingExistingSubscription}
          className="mt-6 w-full rounded-xl bg-green-600 px-5 py-3 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {checkingExistingSubscription
            ? "Checking Subscription..."
            : "Review Subscription"}
        </button>
      </div>

      {/* =========================================================
          EXISTING SUBSCRIPTION POPUP
      ========================================================== */}

      {showExistingSubscriptionModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="existing-subscription-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            {/* Header */}
            <div className="mb-4 flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-100">
                <CalendarDays className="h-5 w-5 text-amber-600" />
              </div>

              <div>
                <h2
                  id="existing-subscription-title"
                  className="text-lg font-bold text-gray-900"
                >
                  You already have an active subscription
                </h2>

                <p className="mt-1 text-sm text-gray-600">
                  You are about to create another subscription.
                  Would you like to continue?
                </p>
              </div>
            </div>

            {/* Information */}
            <div className="mb-5 rounded-xl bg-amber-50 p-4">
              <p className="text-sm text-amber-800">
                Your existing subscription will remain unchanged.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() =>
                  setShowExistingSubscriptionModal(false)
                }
                className="w-full rounded-xl border border-gray-300 px-5 py-3 font-medium text-gray-700 transition hover:bg-gray-50 sm:w-auto"
              >
                No, Cancel
              </button>

              <button
                type="button"
                onClick={continueWithNewSubscription}
                className="w-full rounded-xl bg-green-600 px-5 py-3 font-semibold text-white transition hover:bg-green-700 sm:w-auto"
              >
                Yes, Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}