/* ==========================================================
   Load Razorpay SDK
========================================================== */

export function loadRazorpayScript() {
  return new Promise((resolve) => {
    // Already Loaded
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");

    script.src = "https://checkout.razorpay.com/v1/checkout.js";

    script.onload = () => resolve(true);

    script.onerror = () => resolve(false);

    document.body.appendChild(script);
  });
}

/* ==========================================================
   Open Razorpay Checkout
========================================================== */

export async function openRazorpayCheckout({
  order,
  customer,
  key,
}) {
  const sdkLoaded = await loadRazorpayScript();

  if (!sdkLoaded) {
    throw new Error("Unable to load Razorpay SDK.");
  }

  return new Promise((resolve, reject) => {
    const options = {
      key,

      amount: order.amount,

      currency: order.currency,

      name: "Farm Fresh Dairy",

      description: "Milk Subscription Payment",

      order_id: order.id,

      prefill: {
        name: customer.name,
        email: customer.email || "",
        contact: customer.phone,
      },

      theme: {
        color: "#2E7D32",
      },

      handler(response) {
        resolve(response);
      },

      modal: {
        ondismiss() {
          reject(new Error("Payment cancelled by customer."));
        },
      },
    };

    const paymentObject = new window.Razorpay(options);

    paymentObject.open();
  });
}