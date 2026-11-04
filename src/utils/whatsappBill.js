
export function sendMonthlyBillWhatsapp(details) {
  const { customer, bill, calculation, subscriptions, bills } = details;

  if (!customer || !bill) {
    throw new Error("Customer or combined bill details are missing.");
  }

  // Normalize Indian phone number.
  let phone = String(customer.phone || "").replace(/\D/g, "");

  if (phone.startsWith("0")) {
    phone = phone.slice(1);
  }

  if (phone.length === 10) {
    phone = `91${phone}`;
  }

  if (phone.length !== 12 || !phone.startsWith("91")) {
    throw new Error("Invalid customer WhatsApp number.");
  }

  // Combined invoice values.
  const totalAmount = Number(
    bill.total_amount ?? calculation?.totalAmount ?? 0
  );

  const deliveredDays = Number(
    calculation?.deliveredDays ?? bill.delivered_days ?? 0
  );

  const missedDays = Number(
    calculation?.missedDays ?? bill.missed_days ?? 0
  );

  const paymentStatus = String(
    bill.payment_status || "Pending"
  );

  const subscriptionCount = Array.isArray(subscriptions)
    ? subscriptions.length
    : Array.isArray(bills)
      ? bills.length
      : 1;

  const message = `🌿 *Farm Fresh Dairy*

Dear ${customer.full_name || customer.name || "Customer"},

Your combined monthly bill is ready.

📅 Billing Period: ${bill.month}/${bill.year}
📦 Total Subscriptions: ${subscriptionCount}

🚚 Delivered Days: ${deliveredDays}
❌ Missed Days: ${missedDays}

💰 *Total Amount: ₹${totalAmount.toFixed(2)}*

Payment Status: *${paymentStatus}*

Thank you for choosing Farm Fresh Dairy.`;

  const whatsappUrl =
    `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

  window.open(whatsappUrl, "_blank", "noopener,noreferrer");
}
