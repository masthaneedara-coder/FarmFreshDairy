export function sendMonthlyBillWhatsapp(details) {
  const { customer, bill } = details;

  const message = `🌿 *Farm Fresh Dairy*

Dear ${customer.full_name},

Your monthly bill for ${bill.month}/${bill.year} is ready.

💰 Total Amount: ₹${bill.total_amount}
📅 Delivered Days: ${bill.delivered_days}
❌ Missed Days: ${bill.missed_days}

Payment Status: ${bill.payment_status}

Thank you for choosing Farm Fresh Dairy.`;

  window.open(
    `https://wa.me/91${customer.phone}?text=${encodeURIComponent(message)}`,
    "_blank"
  );
}