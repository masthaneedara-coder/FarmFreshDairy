import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "../assets/logo.png";

export async function generateMonthlyBillPDF(
  details,
  action = "download"
) {
  const doc = new jsPDF("p", "mm", "a4");

  const {
    customer = {},
    subscription = {},
    bill = {},
    deliveries = [],
  } = details || {};

  // =====================================================
  // PAGE SETTINGS
  // =====================================================

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  // Farm Fresh colors
  const GREEN = [22, 101, 52];
  const DARK_GREEN = [20, 83, 45];
  const LIGHT_GREEN = [220, 252, 231];
  const VERY_LIGHT_GREEN = [240, 253, 244];

  const DARK = [31, 41, 55];
  const GRAY = [107, 114, 128];
  const LIGHT_GRAY = [243, 244, 246];
  const BORDER = [229, 231, 235];
  const WHITE = [255, 255, 255];

  // =====================================================
  // LOGO
  // =====================================================

  const img = new Image();
  img.src = logo;

  await new Promise((resolve) => {
    img.onload = resolve;
    img.onerror = resolve;
  });

  // =====================================================
  // HELPERS
  // =====================================================

  const money = (value) =>
    `Rs. ${Number(value || 0).toFixed(2)}`;

  const formatDate = (value) => {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return date.toLocaleDateString("en-IN");
  };

  const normalizeSize = (value) => {
    const size = String(value || "").trim();

    const normalized = size
      .toLowerCase()
      .replace(/\s+/g, "");

    if (
      normalized === "1l" ||
      normalized === "1ltr" ||
      normalized === "1liter" ||
      normalized === "1litre"
    ) {
      return "1 Ltr";
    }

    if (
      normalized === "500ml" ||
      normalized === "500milliliter" ||
      normalized === "500milliliters"
    ) {
      return "500 ml";
    }

    if (
      normalized === "2l" ||
      normalized === "2ltr"
    ) {
      return "2 Ltr";
    }

    if (
      normalized === "5l" ||
      normalized === "5ltr"
    ) {
      return "5 Ltr";
    }

    if (
      normalized === "20l" ||
      normalized === "20ltr"
    ) {
      return "20 Ltr";
    }

    return size || "-";
  };

  const drawRoundedCard = (
    x,
    y,
    width,
    height,
    fillColor = WHITE,
    borderColor = BORDER,
    radius = 3
  ) => {
    doc.setFillColor(...fillColor);
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.3);

    doc.roundedRect(
      x,
      y,
      width,
      height,
      radius,
      radius,
      "FD"
    );
  };

  const drawLabelValue = (
    label,
    value,
    x,
    y,
    valueX = x + 28
  ) => {
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...GRAY);

    doc.text(label, x, y);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...DARK);

    doc.text(
      String(value || "-"),
      valueX,
      y
    );
  };

  // =====================================================
  // HEADER
  // =====================================================

  doc.setFillColor(...GREEN);

  doc.roundedRect(
    margin,
    10,
    contentWidth,
    27,
    5,
    5,
    "F"
  );

  // Logo white area
  doc.setFillColor(...WHITE);

  doc.circle(
    margin + 14,
    23.5,
    9,
    "F"
  );

  if (img.width && img.height) {
    doc.addImage(
      img,
      "PNG",
      margin + 6,
      15.5,
      16,
      16
    );
  }

  // Brand
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...WHITE);

  doc.text(
    "Farm Fresh Dairy",
    margin + 28,
    21
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);

  doc.setTextColor(
    220,
    252,
    231
  );

  doc.text(
    "Pure Fresh Buffalo Milk",
    margin + 28,
    27
  );

  // Invoice badge
  doc.setFillColor(...WHITE);

  doc.roundedRect(
    pageWidth - margin - 39,
    16,
    32,
    15,
    3,
    3,
    "F"
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...GREEN);

  doc.text(
    "MONTHLY BILL",
    pageWidth - margin - 23,
    22,
    { align: "center" }
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);

  doc.text(
    `${bill.month}/${bill.year}`,
    pageWidth - margin - 23,
    27,
    { align: "center" }
  );

  // =====================================================
  // BILL INFORMATION
  // =====================================================

  let y = 45;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(...DARK);

  doc.text(
    "Monthly Billing Statement",
    margin,
    y
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);

  doc.text(
    `Generated on ${formatDate(bill.generated_at)}`,
    pageWidth - margin,
    y,
    { align: "right" }
  );

  y += 7;

  doc.setDrawColor(...BORDER);
  doc.line(
    margin,
    y,
    pageWidth - margin,
    y
  );

  y += 7;

  // =====================================================
  // CUSTOMER CARD
  // =====================================================

  const cardGap = 6;
  const cardWidth =
    (contentWidth - cardGap) / 2;

  const cardHeight = 42;

  drawRoundedCard(
    margin,
    y,
    cardWidth,
    cardHeight,
    WHITE,
    BORDER
  );

  drawRoundedCard(
    margin + cardWidth + cardGap,
    y,
    cardWidth,
    cardHeight,
    VERY_LIGHT_GREEN,
    [187, 247, 208]
  );

  // Customer title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...GREEN);

  doc.text(
    "CUSTOMER",
    margin + 7,
    y + 9
  );

  // Customer data
  drawLabelValue(
    "Name",
    customer.full_name,
    margin + 7,
    y + 17,
    margin + 30
  );

  drawLabelValue(
    "Phone",
    customer.phone,
    margin + 7,
    y + 24,
    margin + 30
  );

  drawLabelValue(
    "Email",
    customer.email,
    margin + 7,
    y + 31,
    margin + 30
  );

  // Subscription card
  const subscriptionX =
    margin + cardWidth + cardGap;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...GREEN);

  doc.text(
    "SUBSCRIPTION",
    subscriptionX + 7,
    y + 9
  );

  drawLabelValue(
    "Status",
    subscription.status,
    subscriptionX + 7,
    y + 17,
    subscriptionX + 35
  );

  drawLabelValue(
    "Frequency",
    subscription.frequency,
    subscriptionX + 7,
    y + 24,
    subscriptionX + 35
  );

  drawLabelValue(
    "Delivery",
    subscription.delivery_time,
    subscriptionX + 7,
    y + 31,
    subscriptionX + 35
  );

  y += cardHeight + 9;

  // =====================================================
  // DELIVERY DATA
  // =====================================================

  const rows = [];

  deliveries.forEach((delivery) => {
    const items =
      delivery.subscription_delivery_items || [];

    items.forEach((item) => {
      rows.push([
        formatDate(
          delivery.delivery_date
        ),

        item.products?.name || "-",

        normalizeSize(item.size),

        Number(item.quantity || 0),

        money(item.unit_price),

        money(item.total_price),

        delivery.status || "-",
      ]);
    });
  });

  // =====================================================
  // DELIVERY SECTION TITLE
  // =====================================================

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...DARK);

  doc.text(
    "Delivery Details",
    margin,
    y
  );

  y += 4;

  // =====================================================
  // DELIVERY TABLE
  // =====================================================

  autoTable(doc, {
    startY: y,

    margin: {
      left: margin,
      right: margin,
    },

    tableWidth: contentWidth,

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

    styles: {
      font: "helvetica",
      fontSize: 7.5,
      cellPadding: 2.4,
      textColor: DARK,
      lineColor: BORDER,
      lineWidth: 0.25,
      valign: "middle",
    },

    headStyles: {
      fillColor: GREEN,
      textColor: WHITE,
      fontStyle: "bold",
      fontSize: 7.5,
      halign: "center",
      lineColor: GREEN,
    },

    bodyStyles: {
      minCellHeight: 7,
    },

    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },

    columnStyles: {
      0: {
        cellWidth: 24,
        halign: "center",
      },

      1: {
        cellWidth: 39,
      },

      2: {
        cellWidth: 20,
        halign: "center",
      },

      3: {
        cellWidth: 13,
        halign: "center",
      },

      4: {
        cellWidth: 23,
        halign: "right",
      },

      5: {
        cellWidth: 25,
        halign: "right",
      },

      6: {
        cellWidth: 25,
        halign: "center",
      },
    },

    didParseCell(data) {
      if (
        data.section === "body" &&
        data.column.index === 6
      ) {
        const status =
          String(data.cell.raw || "")
            .toLowerCase();

        if (status === "delivered") {
          data.cell.styles.textColor =
            GREEN;
          data.cell.styles.fontStyle =
            "bold";
        }

        if (status === "missed") {
          data.cell.styles.textColor =
            [185, 28, 28];
          data.cell.styles.fontStyle =
            "bold";
        }
      }
    },
  });

  // =====================================================
  // BILL SUMMARY CALCULATION
  // =====================================================

  let deliveredDays = 0;
  let missedDays = 0;
  let subtotal = 0;

  const sizeSummaryMap =
    new Map();

  deliveries.forEach((delivery) => {

    if (delivery.status === "Delivered") {

      deliveredDays++;

      const items =
        delivery.subscription_delivery_items || [];

      items.forEach((item) => {

        const quantity =
          Number(item.quantity || 0);

        const rate =
          Number(item.unit_price || 0);

        const amount =
          Number(item.total_price || 0);

        subtotal += amount;

        const size =
          normalizeSize(item.size);

        const key =
          `${size}_${rate}`;

        if (!sizeSummaryMap.has(key)) {

          sizeSummaryMap.set(key, {
            size,
            quantity: 0,
            rate,
            amount: 0,
          });

        }

        const summary =
          sizeSummaryMap.get(key);

        summary.quantity += quantity;
        summary.amount += amount;

      });
    }

    if (delivery.status === "Missed") {
      missedDays++;
    }

  });

  const sizeSummary =
    Array.from(
      sizeSummaryMap.values()
    );

  // Sort by size
  sizeSummary.sort((a, b) => {

    const sizeToMl = (size) => {

      const normalized =
        String(size)
          .toLowerCase()
          .replace(/\s+/g, "");

      if (normalized === "500ml") {
        return 500;
      }

      if (normalized === "1ltr") {
        return 1000;
      }

      if (normalized === "2ltr") {
        return 2000;
      }

      if (normalized === "5ltr") {
        return 5000;
      }

      if (normalized === "20ltr") {
        return 20000;
      }

      return 999999;
    };

    return (
      sizeToMl(a.size) -
      sizeToMl(b.size)
    );
  });

  const discount =
    Number(bill.discount || 0);

  const grandTotal =
    subtotal - discount;

  // =====================================================
  // SUMMARY POSITION
  // =====================================================

  y =
    doc.lastAutoTable.finalY + 10;

  // Enough space for summary
  const summaryHeight =
    65 +
    sizeSummary.length * 7;

  if (
    y + summaryHeight >
    pageHeight - 20
  ) {
    doc.addPage();

    y = 20;
  }

  // =====================================================
  // SUMMARY HEADER
  // =====================================================

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...DARK);

  doc.text(
    "Billing Summary",
    margin,
    y
  );

  y += 7;

  // =====================================================
  // SUMMARY CARD
  // =====================================================

  const summaryCardHeight =
    48 +
    sizeSummary.length * 7;

  drawRoundedCard(
    margin,
    y,
    contentWidth,
    summaryCardHeight,
    WHITE,
    BORDER
  );

  let summaryY = y + 9;

  // Delivered / Missed
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);

  doc.text(
    "Delivered Days",
    margin + 7,
    summaryY
  );

  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK);

  doc.text(
    String(deliveredDays),
    margin + 47,
    summaryY
  );

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GRAY);

  doc.text(
    "Missed Days",
    margin + 65,
    summaryY
  );

  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK);

  doc.text(
    String(missedDays),
    margin + 100,
    summaryY
  );

  summaryY += 8;

  // Divider
  doc.setDrawColor(...BORDER);

  doc.line(
    margin + 7,
    summaryY - 3,
    pageWidth - margin - 7,
    summaryY - 3
  );

  // =====================================================
  // SIZE-WISE BILLING
  // =====================================================

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...GREEN);

  doc.text(
    "SIZE-WISE BILLING",
    margin + 7,
    summaryY + 3
  );

  summaryY += 10;

  sizeSummary.forEach((item) => {

    // Size
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...DARK);

    doc.text(
      item.size,
      margin + 7,
      summaryY
    );

    // Quantity
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...GRAY);

    doc.text(
      `${item.quantity} × ${money(item.rate)}`,
      margin + 50,
      summaryY
    );

    // Amount
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DARK);

    doc.text(
      money(item.amount),
      pageWidth - margin - 8,
      summaryY,
      { align: "right" }
    );

    summaryY += 7;
  });

  // Divider
  doc.setDrawColor(...BORDER);

  doc.line(
    margin + 7,
    summaryY - 3,
    pageWidth - margin - 7,
    summaryY - 3
  );

  summaryY += 5;

  // Subtotal
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);

  doc.text(
    "Subtotal",
    pageWidth - margin - 55,
    summaryY
  );

  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK);

  doc.text(
    money(subtotal),
    pageWidth - margin - 8,
    summaryY,
    { align: "right" }
  );

  summaryY += 6;

  // Discount
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GRAY);

  doc.text(
    "Discount",
    pageWidth - margin - 55,
    summaryY
  );

  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK);

  doc.text(
    money(discount),
    pageWidth - margin - 8,
    summaryY,
    { align: "right" }
  );

  // =====================================================
  // GRAND TOTAL CARD
  // =====================================================

  summaryY += 7;

  doc.setFillColor(...GREEN);

  doc.roundedRect(
    margin + 5,
    summaryY - 4,
    contentWidth - 10,
    15,
    3,
    3,
    "F"
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...WHITE);

  doc.text(
    "GRAND TOTAL",
    margin + 12,
    summaryY + 5
  );

  doc.setFontSize(14);

  doc.text(
    money(grandTotal),
    pageWidth - margin - 12,
    summaryY + 5,
    { align: "right" }
  );

  y =
    summaryY + 19;

  // =====================================================
  // PAYMENT STATUS
  // =====================================================

  if (
    y + 25 >
    pageHeight - 20
  ) {
    doc.addPage();

    y = 20;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...DARK);

  doc.text(
    "Payment",
    margin,
    y
  );

  y += 7;

  const paymentStatus =
    String(
      bill.payment_status || "Pending"
    );

  const isPaid =
    paymentStatus.toLowerCase() ===
    "paid";

  const statusWidth = 35;

  doc.setFillColor(
    ...(isPaid
      ? LIGHT_GREEN
      : [254, 249, 195])
  );

  doc.setDrawColor(
    ...(isPaid
      ? [187, 247, 208]
      : [253, 230, 138])
  );

  doc.roundedRect(
    margin,
    y - 5,
    statusWidth,
    10,
    4,
    4,
    "FD"
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);

  doc.setTextColor(
    ...(isPaid
      ? GREEN
      : [161, 98, 7])
  );

  doc.text(
    isPaid
      ? "● PAID"
      : "● PENDING",
    margin + statusWidth / 2,
    y + 1,
    { align: "center" }
  );

  // =====================================================
  // FOOTER
  // =====================================================

  const footerY =
    pageHeight - 15;

  doc.setDrawColor(...BORDER);

  doc.line(
    margin,
    footerY - 5,
    pageWidth - margin,
    footerY - 5
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...GRAY);

  doc.text(
    "Thank you for choosing Farm Fresh Dairy",
    pageWidth / 2,
    footerY,
    { align: "center" }
  );

  doc.setFontSize(6.5);

  doc.text(
    "Freshness delivered to your doorstep",
    pageWidth / 2,
    footerY + 4,
    { align: "center" }
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