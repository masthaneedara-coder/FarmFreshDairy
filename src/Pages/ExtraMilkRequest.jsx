import { useEffect, useState } from "react";
import {
  createExtraMilkRequest,
  getCustomerExtraMilk,
  cancelExtraMilkRequest,
  fetchProducts,
  fetchCustomerSubscriptions,
} from "../config/api";
import ExtraMilkForm from "../Components/extraMilk/ExtraMilkForm";
import ExtraMilkHistory from "../Components/extraMilk/ExtraMilkHistory";
export default function ExtraMilkRequest() {

  const customer = JSON.parse(
    localStorage.getItem("customer")
  );

  const [products, setProducts] = useState([]);
  const [history, setHistory] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    product_id: "",
    quantity: 1,
    size: "500ml",
    from_date: "",
    to_date: "",
    remarks: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {

    try {

      const p = await fetchProducts();

     setProducts(p);

const s = await fetchCustomerSubscriptions(customer.id);

console.log("Subscription API Response:", s);

if (
  s.success &&
  s.subscription &&
  s.subscription.status === "Active"
) {
  setSubscription(s.subscription);
  console.log("Active Subscription:", s.subscription);
} else {
  setSubscription(null);
}

     

      const h = await getCustomerExtraMilk(customer.id);

      setHistory(h.requests || []);

    } catch (err) {

      console.error(err);

    }

  }

async function handleSubmit(data) {
  try {
    if (!customer?.id) {
      alert("Please login again.");
      return;
    }

    if (!subscription?.id) {
      alert("No active milk subscription found.");
      return;
    }

    setLoading(true);

    const payload = {
      customer_id: customer.id,
      subscription_id: subscription.id,
      product_id: data.product_id,
      size: data.size,
      quantity: Number(data.quantity),
      from_date: data.from_date,
      to_date: data.to_date,
      remarks: data.remarks || "",

      // IMPORTANT
      estimated_amount: Number(data.estimated_amount || 0),
    };

    console.log("=================================");
    console.log("FINAL EXTRA MILK PAYLOAD:", payload);
    console.log("Estimated Amount:", payload.estimated_amount);
    console.log("=================================");

    const response = await createExtraMilkRequest(payload);

    console.log("Extra Milk API Response:", response);

    alert(
      "✅ Extra milk request submitted successfully!"
    );

    await loadHistory();

  } catch (error) {
    console.error(
      "Extra Milk Request Error:",
      error
    );

    alert(
      error?.message ||
        "❌ Failed to submit extra milk request."
    );

  } finally {
    setLoading(false);
  }
}
async function loadHistory() {

  const res = await getCustomerExtraMilk(customer.id);

  setHistory(res.requests || []);

}


 
async function handleCancel(id) {
  try {
    if (!id) {
      alert("Invalid request ID.");
      return;
    }

    const ok = window.confirm(
      "Are you sure you want to cancel this extra milk request?"
    );

    if (!ok) return;

    setLoading(true);

    console.log("Cancelling Extra Milk Request:", id);

    const response = await cancelExtraMilkRequest(id);

    console.log(
      "Cancel API Response:",
      response
    );

    alert(
      "✅ Extra milk request cancelled successfully."
    );

    await loadHistory();

  } catch (error) {
    console.error(
      "Cancel Extra Milk Error:",
      error
    );

    alert(
      error?.message ||
        "❌ Unable to cancel extra milk request."
    );

  } finally {
    setLoading(false);
  }
}
// useEffect(() => {

//   loadProducts();

//   loadSubscription();

//   loadHistory();

// }, []);
  return (

    <div className="max-w-5xl mx-auto p-6">

      <h1 className="text-3xl font-bold mb-6">

        Extra Milk Request

      </h1>

      <ExtraMilkForm
        products={products}
        loading={loading}
        form={form}
        setForm={setForm}
        onSubmit={handleSubmit}
        />

        <ExtraMilkHistory
            requests={history}
            onCancel={handleCancel}
        />

    </div>

  )

}