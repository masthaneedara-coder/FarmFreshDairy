// src/utils/razorpay.js

export function loadRazorpayScript() {
  return new Promise((resolve) => {
    // Already loaded
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existingScript = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(true));
      existingScript.addEventListener("error", () => resolve(false));
      return;
    }

    const script = document.createElement("script");

    script.src =
      "https://checkout.razorpay.com/v1/checkout.js";

    script.async = true;

    script.onload = () => {
      console.log("Razorpay SDK loaded");
      resolve(true);
    };

    script.onerror = () => {
      console.error("Unable to load Razorpay SDK");
      resolve(false);
    };

    document.body.appendChild(script);
  });
}

export async function openRazorpayCheckout({
  order,
  customer,
  key,
}) {
  const sdkLoaded = await loadRazorpayScript();

  if (!sdkLoaded) {
    throw new Error(
      "Unable to load Razorpay payment gateway."
    );
  }

  if (!window.Razorpay) {
    throw new Error(
      "Razorpay SDK is not available."
    );
  }

  if (!order?.id) {
    throw new Error(
      "Razorpay order ID is missing."
    );
  }

  if (!key) {
    throw new Error(
      "Razorpay key is missing."
    );
  }

  if (!customer?.phone) {
    throw new Error(
      "Customer phone number is required."
    );
  }

  return new Promise((resolve, reject) => {
    const options = {
      key,

      amount: order.amount,

      currency: order.currency || "INR",

      name: "Farm Fresh Dairy",

      description: "Wallet Recharge",

      order_id: order.id,

      prefill: {
        name:
          customer.name ||
          customer.full_name ||
          "",

        email: customer.email || "",

        contact: customer.phone || "",
      },

      notes: {
        customer_id: customer.id || "",
        payment_type: "WALLET_RECHARGE",
      },

      theme: {
        color: "#059669",
      },

      handler(response) {
        console.log(
          "Razorpay payment response:",
          response
        );

        if (
          !response?.razorpay_order_id ||
          !response?.razorpay_payment_id ||
          !response?.razorpay_signature
        ) {
          reject(
            new Error(
              "Incomplete Razorpay payment response."
            )
          );

          return;
        }

        resolve(response);
      },

      modal: {
        ondismiss() {
          reject(
            new Error(
              "Payment cancelled by customer."
            )
          );
        },
      },
    };

    try {
      const razorpay =
        new window.Razorpay(options);

      razorpay.on(
        "payment.failed",
        (response) => {
          console.error(
            "Razorpay payment failed:",
            response
          );

          reject(
            new Error(
              response?.error?.description ||
                "Razorpay payment failed."
            )
          );
        }
      );

      razorpay.open();
    } catch (error) {
      console.error(
        "Razorpay open error:",
        error
      );

      reject(error);
    }
  });
}