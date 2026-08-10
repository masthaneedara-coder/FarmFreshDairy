import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "../assets/logo.png";


export async function generateMonthlyBillPDF(
  details,
  action = "download"
) {
  const doc = new jsPDF("p", "mm", "a4");

  const { customer, subscription, bill, deliveries } = details;
  const img = new Image();
        img.src = logo;

        await new Promise(resolve => {
            img.onload = resolve;
        });

doc.addImage(img, "PNG", 15, 12, 18, 18);

  // ==========================
  // Header
  // ==========================
  doc.setFontSize(20);
  doc.setTextColor(22, 101, 52);
  doc.text("Farm Fresh Dairy", 105, 18, {
    align: "center",
  });

  doc.setFontSize(11);
  doc.setTextColor(100);

  doc.text(
    "Pure Fresh Buffalo Milk",
    105,
    25,
    { align: "center" }
  );

  doc.line(15, 30, 195, 30);

  // ==========================
  // Invoice
  // ==========================

  doc.setFontSize(16);
  doc.setTextColor(0);

  doc.text("MONTHLY BILL", 15, 40);

  doc.setFontSize(11);

  doc.text(
    `Month : ${bill.month}/${bill.year}`,
    15,
    48
  );

  doc.text(
    `Generated : ${new Date(
      bill.generated_at
    ).toLocaleDateString()}`,
    120,
    48
  );

  // ==========================
  // Customer
  // ==========================

  doc.setFontSize(13);

  doc.text("Customer", 15, 60);

  doc.setFontSize(10);

  doc.text(
    `Name : ${customer.full_name}`,
    15,
    67
  );

  doc.text(
    `Phone : ${customer.phone}`,
    15,
    73
  );

  doc.text(
    `Email : ${customer.email || "-"}`,
    15,
    79
  );

  // ==========================
  // Subscription
  // ==========================

  doc.setFontSize(13);

  doc.text("Subscription", 120, 60);

  doc.setFontSize(10);

  doc.text(
    `Status : ${subscription.status}`,
    120,
    67
  );

  doc.text(
    `Frequency : ${subscription.frequency}`,
    120,
    73
  );

  doc.text(
    `Delivery : ${subscription.delivery_time}`,
    120,
    79
  );

  // ==========================
  // Delivery Table
  // ==========================

  const rows = [];

  deliveries.forEach((delivery) => {
    delivery.subscription_delivery_items.forEach(
      (item) => {
        rows.push([
          new Date(
            delivery.delivery_date
          ).toLocaleDateString(),

          item.products.name,

          item.size,

          item.quantity,

          `Rs. ${item.unit_price}`,

          `Rs. ${item.total_price}`,

          delivery.status,
        ]);
      }
    );
  });

  autoTable(doc, {
    startY: 90,

    head: [[
      "Date",
      "Product",
      "Size",
      "Qty",
      "Rate",
      "Amount",
      "Status",
    ]],

    body: rows,

    styles: {
      fontSize: 9,
    },

    headStyles: {
      fillColor: [22, 101, 52],
    },
  });

  // ==========================
  // Summary
  // ==========================

// ==========================
// Summary
// ==========================

let y = doc.lastAutoTable.finalY + 10;

let deliveredDays = 0;
let missedDays = 0;
let subtotal = 0;

deliveries.forEach((delivery) => {
  if (delivery.status === "Delivered") {
    deliveredDays++;

    delivery.subscription_delivery_items.forEach((item) => {
      subtotal += Number(item.total_price);
    });
  }

  if (delivery.status === "Missed") {
    missedDays++;
  }
});

const grandTotal = subtotal - Number(bill.discount || 0);

doc.setFontSize(13);
doc.setTextColor(0);
doc.text("Bill Summary", 15, y);

y += 10;

doc.setFontSize(10);

doc.text(`Delivered Days : ${deliveredDays}`, 15, y);

y += 6;
doc.text(`Missed Days : ${missedDays}`, 15, y);

y += 6;
doc.text(`Subtotal : Rs. ${subtotal}`, 15, y);

y += 6;
doc.text(`Discount : Rs. ${bill.discount}`, 15, y);

y += 6;

doc.setFontSize(12);
doc.setTextColor(22, 101, 52);

doc.text(`Grand Total : Rs. ${grandTotal}`, 15, y);
y += 12;

doc.setFontSize(13);
doc.setTextColor(0);
doc.text("Payment", 15, y);

y += 8;

doc.setFontSize(10);
doc.text(`Status : ${bill.payment_status}`, 15, y);

  // ==========================
  // Footer
  // ==========================

  doc.setFontSize(10);

  doc.setTextColor(120);

  doc.text(
    "Thank you for choosing Farm Fresh Dairy",
    105,
    285,
    {
      align: "center",
    }
  );

 const fileName =
  `Monthly_Bill_${customer.full_name}_${bill.month}_${bill.year}.pdf`;

if (action === "download") {

  doc.save(fileName);

  return;

}

if (action === "print") {

  const blob = doc.output("blob");

  const url = URL.createObjectURL(blob);

  const printWindow =
    window.open(url);

  if (printWindow) {

    printWindow.onload = () => {

      printWindow.focus();

      printWindow.print();

    };

  }

}
}