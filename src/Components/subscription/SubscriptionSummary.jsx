import { CalendarDays, Clock3, CreditCard, Milk } from "lucide-react";
import { useMemo } from "react";
import { useSubscription } from "../../context/SubscriptionContext";


export default function SubscriptionSummary() {
  const {
    selectedProduct,
    deliveryOptions,
    createSubscription,
  } = useSubscription();
const customerId = localStorage.getItem("customerId");
  
const handleCreateSubscription = async () => {
  if (!customerId) {
    alert("Please login first.");
    return;
  }

  if (!selectedProduct) {
    alert("Please select a product.");
    return;
  }

  try {
    const payload = {
      customer_id: customerId,
      address_id: null,
      start_date: deliveryOptions.startDate,
      delivery_time: deliveryOptions.deliveryTime,
      frequency: deliveryOptions.frequency,
      total_amount: total,
      products: [
        {
          product_id: selectedProduct.id,
          quantity: selectedProduct.quantity || 1,
          price:
            selectedProduct.unit_price ??
            selectedProduct.price,
        },
      ],
    };

    await createSubscription(payload);

    alert("Subscription created successfully.");
  } catch (err) {
    console.error(err);
    alert("Failed to create subscription.");
  }
};

  const quantity = selectedProduct?.quantity || 1;
  const unitPrice =
    selectedProduct?.unit_price ||
    selectedProduct?.price ||
    0;

  const total = useMemo(() => {
    return unitPrice * quantity * deliveryOptions.duration;
  }, [unitPrice, quantity, deliveryOptions.duration]);

  if (!selectedProduct) {
    return (
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">

        <h2 className="text-2xl font-bold mb-4">
          Subscription Summary
        </h2>

        <div className="text-center py-10">

          <Milk
            size={60}
            className="mx-auto text-gray-300"
          />

          <h3 className="mt-4 text-xl font-semibold">
            Select a Product
          </h3>

          <p className="text-gray-500 mt-2">
            Choose a product to see your subscription summary.
          </p>

        </div>

      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-green-100 overflow-hidden">

      {/* Header */}

      <div className="bg-gradient-to-r from-green-600 to-emerald-500 text-white p-6">

        <h2 className="text-2xl font-bold">
          Subscription Summary
        </h2>

        <p className="opacity-90">
          Review your monthly plan
        </p>

      </div>

      <div className="p-6 space-y-5">

        <SummaryRow
          label="Product"
          value={selectedProduct.name}
        />

        <SummaryRow
          label="Size"
          value={selectedProduct.size || "1 L"}
        />

        <SummaryRow
          label="Quantity"
          value={quantity}
        />

        <SummaryRow
          label="Frequency"
          value={deliveryOptions.frequency}
        />

        <SummaryRow
          label="Duration"
          value={`${deliveryOptions.duration} Days`}
        />

        <SummaryRow
          icon={<Clock3 size={18} />}
          label="Delivery Time"
          value={deliveryOptions.deliveryTime}
        />

        <SummaryRow
          icon={<CalendarDays size={18} />}
          label="Start Date"
          value={deliveryOptions.startDate || "-"}
        />

        <hr />

        <SummaryRow
          icon={<CreditCard size={18} />}
          label="Price / Day"
          value={`₹${unitPrice}`}
        />

        <SummaryRow
          label="Estimated Total"
          value={`₹${total.toFixed(2)}`}
          highlight
        />

      </div>
      <button
            onClick={handleCreateSubscription}
            className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white py-4 rounded-2xl font-semibold transition"
            >
            Create Subscription
            </button>
    </div>
  );
}

function SummaryRow({
  icon,
  label,
  value,
  highlight = false,
}) {
  return (
    <div className="flex justify-between items-center">

      <div className="flex items-center gap-2">

        {icon}

        <span className="text-gray-600">
          {label}
        </span>

      </div>

      <span
        className={`font-semibold ${
          highlight
            ? "text-green-700 text-lg"
            : ""
        }`}
      >
        {value}
      </span>

    </div>
  );
}