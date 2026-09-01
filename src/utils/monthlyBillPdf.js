import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "../assets/logo.png";


export async function generateMonthlyBillPDF(
  details,
  action = "download"
) {
  const doc = new jsPDF("p", "mm", "a4");

  const {
    customer,
    subscription,
    bill,
    deliveries,
  } = details;

  // =====================================================
  // LOGO
  // =====================================================

  const img = new Image();
  img.src = logo;

  await new Promise((resolve) => {
    img.onload = resolve;
  });

  // =====================================================
  // PAGE SETTINGS
  // =====================================================

  const pageWidth =
    doc.internal.pageSize.getWidth();

  const pageHeight =
    doc.internal.pageSize.getHeight();

  const leftMargin = 15;
  const rightMargin = 15;

  // =====================================================
  // HEADER
  // =====================================================

  doc.addImage(
    img,
    "PNG",
    15,
    12,
    18,
    18
  );

  doc.setFontSize(20);
  doc.setTextColor(22, 101, 52);

  doc.text(
    "Farm Fresh Dairy",
    pageWidth / 2,
    18,
    {
      align: "center",
    }
  );

  doc.setFontSize(11);
  doc.setTextColor(100);

  doc.text(
    "Pure Fresh Buffalo Milk",
    pageWidth / 2,
    25,
    {
      align: "center",
    }
  );

  doc.setDrawColor(180);
  doc.line(
    leftMargin,
    30,
    pageWidth - rightMargin,
    30
  );

  // =====================================================
  // MONTHLY BILL
  // =====================================================

  doc.setFontSize(16);
  doc.setTextColor(0);

  doc.text(
    "MONTHLY BILL",
    leftMargin,
    40
  );

  doc.setFontSize(11);

  doc.text(
    `Month : ${bill.month}/${bill.year}`,
    leftMargin,
    48
  );

  doc.text(
    `Generated : ${new Date(
      bill.generated_at
    ).toLocaleDateString()}`,
    120,
    48
  );

  // =====================================================
  // CUSTOMER
  // =====================================================

  doc.setFontSize(13);
  doc.setTextColor(0);

  doc.text(
    "Customer",
    leftMargin,
    60
  );

  doc.setFontSize(10);

  doc.text(
    `Name : ${customer.full_name || "-"}`,
    leftMargin,
    67
  );

  doc.text(
    `Phone : ${customer.phone || "-"}`,
    leftMargin,
    73
  );

  doc.text(
    `Email : ${customer.email || "-"}`,
    leftMargin,
    79
  );

  // =====================================================
  // SUBSCRIPTION
  // =====================================================

  doc.setFontSize(13);

  doc.text(
    "Subscription",
    120,
    60
  );

  doc.setFontSize(10);

  doc.text(
    `Status : ${subscription.status || "-"}`,
    120,
    67
  );

  doc.text(
    `Frequency : ${subscription.frequency || "-"}`,
    120,
    73
  );

  doc.text(
    `Delivery : ${subscription.delivery_time || "-"}`,
    120,
    79
  );

  // =====================================================
  // DELIVERY TABLE DATA
  // =====================================================

  const rows = [];

  (deliveries || []).forEach((delivery) => {

    const items =
      delivery.subscription_delivery_items || [];

    items.forEach((item) => {

      rows.push([
        delivery.delivery_date
          ? new Date(
              delivery.delivery_date
            ).toLocaleDateString()
          : "-",

        item.products?.name || "-",

        item.size || "-",

        item.quantity ?? 0,

        `Rs. ${Number(
          item.unit_price || 0
        ).toFixed(2)}`,

        `Rs. ${Number(
          item.total_price || 0
        ).toFixed(2)}`,

        delivery.status || "-",
      ]);

    });

  });

  // =====================================================
  // DELIVERY TABLE
  // =====================================================

  autoTable(doc, {

    startY: 90,

    margin: {
      top: 12,
      right: rightMargin,
      bottom: 25,
      left: leftMargin,
    },

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

    theme: "grid",

    // -------------------------------------------------
    // IMPORTANT: TABLE WILL AUTOMATICALLY CONTINUE
    // TO NEW PAGES
    // -------------------------------------------------

    pageBreak: "auto",

    rowPageBreak: "avoid",

    showHead: "everyPage",

    styles: {
      fontSize: 9,
      cellPadding: 3,
      overflow: "linebreak",
      valign: "middle",
      textColor: [40, 40, 40],
    },

    headStyles: {
      fillColor: [22, 101, 52],
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: "bold",
      halign: "center",
      valign: "middle",
    },

    bodyStyles: {
      fontSize: 9,
    },

    alternateRowStyles: {
      fillColor: [245, 248, 246],
    },

    columnStyles: {

      // Date
      0: {
        cellWidth: 25,
        halign: "center",
      },

      // Product
      1: {
        cellWidth: 42,
      },

      // Size
      2: {
        cellWidth: 22,
        halign: "center",
      },

      // Quantity
      3: {
        cellWidth: 15,
        halign: "center",
      },

      // Rate
      4: {
        cellWidth: 25,
        halign: "right",
      },

      // Amount
      5: {
        cellWidth: 27,
        halign: "right",
      },

      // Status
      6: {
        cellWidth: 30,
        halign: "center",
      },
    },

    // =================================================
    // FOOTER ON EVERY PAGE
    // =================================================

    didDrawPage: function () {

      const currentPage =
        doc.internal.getNumberOfPages();

      doc.setFontSize(8);

      doc.setTextColor(120);

      doc.text(
        `Farm Fresh Dairy • Page ${currentPage}`,
        pageWidth / 2,
        pageHeight - 8,
        {
          align: "center",
        }
      );

    },

  });

  // =====================================================
  // BILL SUMMARY
  // =====================================================

  let y =
    doc.lastAutoTable.finalY + 10;

  // Calculate summary
  let deliveredDays = 0;
  let missedDays = 0;
  let subtotal = 0;

  (deliveries || []).forEach(
    (delivery) => {

      if (
        delivery.status ===
        "Delivered"
      ) {

        deliveredDays++;

        const items =
          delivery.subscription_delivery_items || [];

        items.forEach((item) => {

          subtotal += Number(
            item.total_price || 0
          );

        });

      }

      if (
        delivery.status ===
        "Missed"
      ) {

        missedDays++;

      }

    }
  );

  const discount =
    Number(bill.discount || 0);

  const grandTotal =
    subtotal - discount;

  // =====================================================
  // IMPORTANT:
  // IF SUMMARY DOES NOT FIT ON CURRENT PAGE,
  // CREATE NEW PAGE
  // =====================================================

  if (y > pageHeight - 65) {

    doc.addPage();

    y = 20;

  }

  // =====================================================
  // SUMMARY TITLE
  // =====================================================

  doc.setFontSize(14);
  doc.setTextColor(0);

  doc.text(
    "Bill Summary",
    leftMargin,
    y
  );

  y += 9;

  // =====================================================
  // SUMMARY DETAILS
  // =====================================================

  doc.setFontSize(10);
  doc.setTextColor(40);

  doc.text(
    `Delivered Days : ${deliveredDays}`,
    leftMargin,
    y
  );

  y += 6;

  doc.text(
    `Missed Days : ${missedDays}`,
    leftMargin,
    y
  );

  y += 6;

  doc.text(
    `Subtotal : Rs. ${subtotal.toFixed(2)}`,
    leftMargin,
    y
  );

  y += 6;

  doc.text(
    `Discount : Rs. ${discount.toFixed(2)}`,
    leftMargin,
    y
  );

  y += 8;

  // =====================================================
  // GRAND TOTAL
  // =====================================================

  doc.setFontSize(13);
  doc.setTextColor(
    22,
    101,
    52
  );

  doc.text(
    `Grand Total : Rs. ${grandTotal.toFixed(2)}`,
    leftMargin,
    y
  );

  y += 12;

  // =====================================================
  // PAYMENT
  // =====================================================

  doc.setFontSize(13);
  doc.setTextColor(0);

  doc.text(
    "Payment",
    leftMargin,
    y
  );

  y += 8;

  doc.setFontSize(10);

  doc.text(
    `Status : ${bill.payment_status || "-"}`,
    leftMargin,
    y
  );

  // =====================================================
  // THANK YOU
  // =====================================================

  y += 15;

  // Check again before placing thank-you text

  if (y > pageHeight - 15) {

    doc.addPage();

    y = 20;

  }

  doc.setFontSize(10);
  doc.setTextColor(120);

  doc.text(
    "Thank you for choosing Farm Fresh Dairy",
    pageWidth / 2,
    y,
    {
      align: "center",
    }
  );

  // =====================================================
  // FILE NAME
  // =====================================================

  const safeCustomerName =
    String(
      customer.full_name || "Customer"
    )
      .replace(
        /[^a-zA-Z0-9_-]/g,
        "_"
      );

  const fileName =
    `Monthly_Bill_${safeCustomerName}_${bill.month}_${bill.year}.pdf`;

  // =====================================================
  // DOWNLOAD
  // =====================================================

  if (action === "download") {

    doc.save(fileName);

    return;

  }

  // =====================================================
  // PRINT
  // =====================================================

  if (action === "print") {

    const blob =
      doc.output("blob");

    const url =
      URL.createObjectURL(blob);

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