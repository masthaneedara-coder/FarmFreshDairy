import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getDeliveryBoyHistory,
} from "../config/deliveryBoyApi";

import {
  Search,
  CalendarDays,
  PackageCheck,
  User,
  Phone,
  MapPin,
  Milk,
  IndianRupee,
  Clock3,
  ChevronRight,
  History as HistoryIcon,
  X,
  Truck,
  FileDown,
  Download,
  UserRound,
} from "lucide-react";

export default function DeliveryHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [pdfOpen, setPdfOpen] = useState(false);
  const [pdfCustomerId, setPdfCustomerId] = useState("");
  const [pdfMonth, setPdfMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [pdfGenerating, setPdfGenerating] = useState(false);

  const deliveryBoy = JSON.parse(
    localStorage.getItem("deliveryBoy") || "null"
  );

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    try {
      if (!deliveryBoy?.id) {
        console.error("Delivery Boy ID not found");
        setHistory([]);
        return;
      }

      setLoading(true);

      const data = await getDeliveryBoyHistory(deliveryBoy.id);
      setHistory(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("History Error:", error);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }

  const filteredHistory = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return history.filter((delivery) => {
      const customerName =
        delivery.customer?.full_name?.toLowerCase() || "";

      const phone =
        delivery.customer?.phone?.toString() || "";

      const number =
        delivery.number?.toLowerCase() || "";

      const matchesSearch =
        !keyword ||
        customerName.includes(keyword) ||
        phone.includes(keyword) ||
        number.includes(keyword);

      const deliveryDate = delivery.date
        ? new Date(delivery.date).toISOString().split("T")[0]
        : "";

      // Inclusive date-range filtering: From and To dates are both included.
      const matchesFromDate =
        !fromDate || (deliveryDate && deliveryDate >= fromDate);

      const matchesToDate =
        !toDate || (deliveryDate && deliveryDate <= toDate);

      return (
        matchesSearch &&
        matchesFromDate &&
        matchesToDate
      );
    });
  }, [history, search, fromDate, toDate]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];

    const todayDeliveries = filteredHistory.filter((delivery) => {
      if (!delivery.date) return false;
      return (
        new Date(delivery.date).toISOString().split("T")[0] === today
      );
    }).length;

    const totalAmount = filteredHistory.reduce(
      (sum, delivery) =>
        sum + Number(delivery.total_amount || 0),
      0
    );

    return {
      total: filteredHistory.length,
      today: todayDeliveries,
      amount: totalAmount,
    };
  }, [filteredHistory]);

  function formatDate(date) {
    if (!date) return "-";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) return "-";

    return parsed.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function formatTime(date) {
    if (!date) return "";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) return "";

    return parsed.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const pdfCustomers = useMemo(() => {
    const map = new Map();

    history.forEach((delivery) => {
      const customer = delivery.customer;
      const id =
        customer?.id ||
        customer?.phone ||
        customer?.full_name ||
        "unknown";

      if (!map.has(id)) {
        map.set(id, {
          id,
          name: customer?.full_name || "Unknown Customer",
          phone: customer?.phone || "",
        });
      }
    });

    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [history]);

  const selectedPdfCustomer = pdfCustomers.find(
    (customer) =>
      String(customer.id) === String(pdfCustomerId)
  );

  function openPdfModal(customerId = "") {
    setPdfCustomerId(customerId);
    setPdfMonth(
      new Date().toISOString().slice(0, 7)
    );
    setPdfOpen(true);
  }

  function formatPdfMonth(value) {
    if (!value) return "";

    const [year, month] = value.split("-");

    return new Date(
      Number(year),
      Number(month) - 1,
      1
    ).toLocaleDateString("en-IN", {
      month: "long",
      year: "numeric",
    });
  }

  function getPdfDeliveries() {
    return history
      .filter((delivery) => {
        if (!delivery.date) return false;

        const deliveryMonth = new Date(
          delivery.date
        )
          .toISOString()
          .slice(0, 7);

        if (deliveryMonth !== pdfMonth) {
          return false;
        }

        if (!pdfCustomerId) {
          return true;
        }

        const customer = delivery.customer;

        const id =
          customer?.id ||
          customer?.phone ||
          customer?.full_name ||
          "unknown";

        return (
          String(id) === String(pdfCustomerId)
        );
      })
      .sort(
        (a, b) =>
          new Date(a.date).getTime() -
          new Date(b.date).getTime()
      );
  }

  async function downloadCustomerMonthlyPdf() {
    const deliveries = getPdfDeliveries();

    if (!deliveries.length) {
      alert(
        pdfCustomerId
          ? `No completed deliveries found for ${
              selectedPdfCustomer?.name || "this customer"
            } in ${formatPdfMonth(pdfMonth)}.`
          : `No completed deliveries found in ${formatPdfMonth(
              pdfMonth
            )}.`
      );
      return;
    }

    try {
      setPdfGenerating(true);

      const { jsPDF } = await import("jspdf");

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      const margin = 14;
      const contentWidth = pageWidth - margin * 2;
      let y = 18;

      const customer =
        selectedPdfCustomer ||
        deliveries[0]?.customer ||
        {};

      const customerName =
        customer.name ||
        customer.full_name ||
        "Customer";

      const customerPhone =
        customer.phone || "-";

      const customerEmail =
        customer.email || "-";

      const firstDelivery =
        deliveries[0] || {};

      const subscription =
        firstDelivery.subscription ||
        firstDelivery.subscriptions ||
        {};

      const subscriptionStatus =
        subscription?.status ||
        firstDelivery.subscription_status ||
        "-";

      const frequency =
        subscription?.frequency ||
        firstDelivery.frequency ||
        "-";

      const deliveryTime =
        subscription?.delivery_time ||
        firstDelivery.delivery_time ||
        firstDelivery.delivery_slot ||
        "-";

      const paymentMethod =
        firstDelivery.payment_method ||
        "Monthly Billing";

      const formatMoney = (value) =>
        `Rs. ${Number(value || 0).toFixed(2)}`;

      const getDeliveryTotal = (delivery) => {
        const direct = Number(
          delivery.total_amount || 0
        );

        if (direct > 0) return direct;

        return (delivery.items || []).reduce(
          (sum, item) =>
            sum + Number(item.total_price || 0),
          0
        );
      };

      const totalAmount = deliveries.reduce(
        (sum, delivery) =>
          sum + getDeliveryTotal(delivery),
        0
      );

      const totalItems = deliveries.reduce(
        (sum, delivery) =>
          sum +
          (delivery.items || []).reduce(
            (itemSum, item) =>
              itemSum + Number(item.quantity || 0),
            0
          ),
        0
      );

      const deliveredDays = new Set(
        deliveries
          .map((delivery) => {
            if (!delivery.date) return null;

            return new Date(delivery.date)
              .toISOString()
              .split("T")[0];
          })
          .filter(Boolean)
      ).size;

      const safeText = (value) =>
        value === undefined ||
        value === null ||
        value === ""
          ? "-"
          : String(value);

      async function loadLogo() {
        try {
          const response = await fetch("/logo.png");
          if (!response.ok) return null;

          const blob = await response.blob();

          return await new Promise((resolve) => {
            const reader = new FileReader();

            reader.onloadend = () =>
              resolve(reader.result);

            reader.onerror = () =>
              resolve(null);

            reader.readAsDataURL(blob);
          });
        } catch {
          return null;
        }
      }

      const logoData = await loadLogo();

      const addPageHeader = () => {
        // Green header like the reference bill.
        doc.setFillColor(22, 101, 52);

        doc.roundedRect(
          margin,
          10,
          contentWidth,
          32,
          5,
          5,
          "F"
        );

        if (logoData) {
          try {
            doc.addImage(
              logoData,
              "PNG",
              margin + 6,
              14,
              22,
              24
            );
          } catch {
            // Continue without logo if image format is unsupported.
          }
        }

        const logoOffset = logoData ? 31 : 7;

        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);

        doc.text(
          "Farm Fresh Dairy",
          margin + logoOffset,
          22
        );

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);

        doc.text(
          "Pure Fresh Buffalo Milk",
          margin + logoOffset,
          29
        );

        // Month badge.
        doc.setFillColor(255, 255, 255);

        doc.roundedRect(
          pageWidth - margin - 47,
          15,
          40,
          22,
          4,
          4,
          "F"
        );

        doc.setTextColor(22, 101, 52);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);

        doc.text(
          "MONTHLY BILL",
          pageWidth - margin - 27,
          23,
          { align: "center" }
        );

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);

        doc.text(
          pdfMonth.replace("-", "/"),
          pageWidth - margin - 27,
          30,
          { align: "center" }
        );
      };

      const addFooter = () => {
        doc.setDrawColor(225, 229, 234);

        doc.line(
          margin,
          pageHeight - 14,
          pageWidth - margin,
          pageHeight - 14
        );

        doc.setTextColor(120, 128, 138);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);

        doc.text(
          `Generated on ${new Date().toLocaleDateString(
            "en-IN"
          )}`,
          margin,
          pageHeight - 7
        );

        doc.text(
          `Page ${doc.getNumberOfPages()}`,
          pageWidth - margin,
          pageHeight - 7,
          { align: "right" }
        );
      };

      const addNewPage = () => {
        addFooter();
        doc.addPage();
        addPageHeader();
        y = 51;
      };

      const ensureSpace = (height = 20) => {
        if (y + height > pageHeight - 20) {
          addNewPage();
        }
      };

      const drawSectionTitle = (title) => {
        ensureSpace(12);

        doc.setTextColor(31, 41, 55);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);

        doc.text(title, margin, y);

        y += 7;
      };

      const drawInfoBox = ({
        x,
        width,
        title,
        rows,
        green = false,
      }) => {
        const rowHeight = 8;
        const height = 12 + rows.length * rowHeight + 5;

        doc.setFillColor(
          green ? 239 : 255,
          green ? 250 : 255,
          green ? 244 : 255
        );

        doc.setDrawColor(
          green ? 167 : 220,
          green ? 243 : 230,
          green ? 194 : 235
        );

        doc.roundedRect(
          x,
          y,
          width,
          height,
          4,
          4,
          "FD"
        );

        doc.setTextColor(22, 101, 52);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);

        doc.text(
          title,
          x + 7,
          y + 10
        );

        let rowY = y + 18;

        rows.forEach(([label, value]) => {
          doc.setTextColor(107, 114, 128);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(7.8);

          doc.text(
            label,
            x + 7,
            rowY
          );

          doc.setTextColor(31, 41, 55);
          doc.setFont("helvetica", "normal");

          const lines = doc.splitTextToSize(
            safeText(value),
            width - 45
          );

          doc.text(
            lines,
            x + 31,
            rowY
          );

          rowY += rowHeight;
        });

        return height;
      };

      // ------------------------------
      // PAGE HEADER
      // ------------------------------
      addPageHeader();

      y = 52;

      doc.setTextColor(31, 41, 55);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(17);

      doc.text(
        "Monthly Billing Statement",
        margin,
        y
      );

      doc.setTextColor(107, 114, 128);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);

      doc.text(
        `Generated on ${new Date().toLocaleDateString(
          "en-IN"
        )}`,
        pageWidth - margin,
        y,
        { align: "right" }
      );

      y += 8;

      doc.setDrawColor(225, 229, 234);

      doc.line(
        margin,
        y,
        pageWidth - margin,
        y
      );

      y += 12;

      // ------------------------------
      // CUSTOMER / SUBSCRIPTION
      // ------------------------------
      const boxGap = 7;
      const boxWidth =
        (contentWidth - boxGap) / 2;

      const customerBoxHeight =
        drawInfoBox({
          x: margin,
          width: boxWidth,
          title: "CUSTOMER",
          rows: [
            ["Name", customerName],
            ["Phone", customerPhone],
            ["Email", customerEmail],
          ],
        });

      const subscriptionBoxHeight =
        drawInfoBox({
          x: margin + boxWidth + boxGap,
          width: boxWidth,
          title: "SUBSCRIPTION",
          green: true,
          rows: [
            [
              "Status",
              subscriptionStatus,
            ],
            [
              "Frequency",
              frequency,
            ],
            [
              "Delivery",
              deliveryTime,
            ],
          ],
        });

      y +=
        Math.max(
          customerBoxHeight,
          subscriptionBoxHeight
        ) + 12;

      // ------------------------------
      // DELIVERY DETAILS TABLE
      // ------------------------------
      drawSectionTitle("Delivery Details");

      const cols = [
        {
          title: "Date",
          width: 25,
        },
        {
          title: "Product",
          width: 42,
        },
        {
          title: "Size",
          width: 20,
        },
        {
          title: "Qty",
          width: 13,
        },
        {
          title: "Rate",
          width: 25,
        },
        {
          title: "Amount",
          width: 27,
        },
        {
          title: "Status",
          width:
            contentWidth -
            (25 + 42 + 20 + 13 + 25 + 27),
        },
      ];

      const headerHeight = 10;
      const rowHeight = 9;

      const drawTableHeader = () => {
        let x = margin;

        doc.setFillColor(22, 101, 52);
        doc.rect(
          margin,
          y,
          contentWidth,
          headerHeight,
          "F"
        );

        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);

        cols.forEach((col) => {
          doc.text(
            col.title,
            x + col.width / 2,
            y + 6.5,
            { align: "center" }
          );

          x += col.width;
        });

        y += headerHeight;
      };

      drawTableHeader();

      deliveries.forEach((delivery) => {
        const items =
          delivery.items || [];

        if (!items.length) {
          items.push({
            id: `${delivery.id}-empty`,
            products: {
              name: "-",
            },
            size: "-",
            quantity: 0,
            total_price:
              getDeliveryTotal(delivery),
            unit_price:
              getDeliveryTotal(delivery),
          });
        }

        items.forEach((item) => {
          if (
            y + rowHeight >
            pageHeight - 20
          ) {
            addNewPage();
            drawSectionTitle(
              "Delivery Details (continued)"
            );
            drawTableHeader();
          }

          const quantity = Number(
            item.quantity || 0
          );

          const amount = Number(
            item.total_price || 0
          );

          const rate =
            Number(item.unit_price || 0) ||
            (quantity > 0
              ? amount / quantity
              : amount);

          const productName =
            item.products?.name ||
            "-";

          const extra =
            item.is_extra
              ? " (Extra)"
              : "";

          const dateText =
            delivery.date
              ? new Date(
                  delivery.date
                ).toLocaleDateString(
                  "en-IN"
                )
              : "-";

          const values = [
            dateText,
            `${productName}${extra}`,
            safeText(item.size),
            String(quantity),
            formatMoney(rate),
            formatMoney(amount),
            "Delivered",
          ];

          let x = margin;

          doc.setDrawColor(
            220,
            225,
            230
          );

          doc.setFillColor(
            255,
            255,
            255
          );

          doc.setTextColor(
            31,
            41,
            55
          );

          doc.setFont(
            "helvetica",
            "normal"
          );
          doc.setFontSize(7.2);

          cols.forEach(
            (col, index) => {
              doc.rect(
                x,
                y,
                col.width,
                rowHeight
              );

              const lines =
                doc.splitTextToSize(
                  values[index],
                  col.width - 3
                );

              const textY =
                y +
                (lines.length > 1
                  ? 4
                  : 5.7);

              doc.text(
                lines,
                x + col.width / 2,
                textY,
                {
                  align: "center",
                }
              );

              x += col.width;
            }
          );

          // Green delivered status.
          const statusX =
            margin +
            contentWidth -
            cols[6].width;

          doc.setTextColor(
            22,
            101,
            52
          );

          doc.setFont(
            "helvetica",
            "bold"
          );

          doc.text(
            "Delivered",
            statusX +
              cols[6].width / 2,
            y + 5.7,
            { align: "center" }
          );

          y += rowHeight;
        });
      });

      y += 10;

      // ------------------------------
      // BILLING SUMMARY
      // ------------------------------
      drawSectionTitle(
        "Billing Summary"
      );

      ensureSpace(43);

      doc.setFillColor(
        255,
        255,
        255
      );

      doc.setDrawColor(
        220,
        225,
        230
      );

      doc.roundedRect(
        margin,
        y,
        contentWidth,
        36,
        4,
        4,
        "FD"
      );

      const half =
        contentWidth / 2;

      const summaryRows = [
        [
          "Delivered Days",
          String(deliveredDays),
          "Delivery Records",
          String(deliveries.length),
        ],
        [
          "Total Items",
          String(totalItems),
          "Payment",
          paymentMethod,
        ],
      ];

      let sy = y + 10;

      summaryRows.forEach(
        ([label1, value1, label2, value2]) => {
          doc.setFontSize(8);
          doc.setFont(
            "helvetica",
            "normal"
          );

          doc.setTextColor(
            107,
            114,
            128
          );

          doc.text(
            label1,
            margin + 7,
            sy
          );

          doc.setTextColor(
            31,
            41,
            55
          );

          doc.setFont(
            "helvetica",
            "bold"
          );

          doc.text(
            value1,
            margin + 46,
            sy
          );

          doc.setTextColor(
            107,
            114,
            128
          );

          doc.setFont(
            "helvetica",
            "normal"
          );

          doc.text(
            label2,
            margin + half + 3,
            sy
          );

          doc.setTextColor(
            31,
            41,
            55
          );

          doc.setFont(
            "helvetica",
            "bold"
          );

          doc.text(
            value2,
            margin + half + 42,
            sy
          );

          sy += 12;
        }
      );

      y += 46;

      // ------------------------------
      // TOTAL CARD
      // ------------------------------
      ensureSpace(38);

      doc.setFillColor(
        239,
        250,
        244
      );

      doc.setDrawColor(
        167,
        243,
        194
      );

      doc.roundedRect(
        margin,
        y,
        contentWidth,
        30,
        5,
        5,
        "FD"
      );

      doc.setTextColor(
        22,
        101,
        52
      );

      doc.setFont(
        "helvetica",
        "bold"
      );

      doc.setFontSize(10);

      doc.text(
        "MONTHLY TOTAL",
        margin + 8,
        y + 10
      );

      doc.setTextColor(
        6,
        78,
        59
      );

      doc.setFontSize(20);

      doc.text(
        formatMoney(totalAmount),
        pageWidth - margin - 8,
        y + 13,
        { align: "right" }
      );

      doc.setTextColor(
        107,
        114,
        128
      );

      doc.setFont(
        "helvetica",
        "normal"
      );

      doc.setFontSize(8);

      doc.text(
        `${deliveries.length} completed delivery records`,
        margin + 8,
        y + 21
      );

      y += 40;

      // ------------------------------
      // THANK YOU
      // ------------------------------
      ensureSpace(25);

      doc.setTextColor(
        22,
        101,
        52
      );

      doc.setFont(
        "helvetica",
        "bold"
      );

      doc.setFontSize(10);

      doc.text(
        "Thank you for choosing Farm Fresh Dairy!",
        pageWidth / 2,
        y,
        { align: "center" }
      );

      doc.setTextColor(
        107,
        114,
        128
      );

      doc.setFont(
        "helvetica",
        "normal"
      );

      doc.setFontSize(8);

      doc.text(
        "Freshness delivered daily.",
        pageWidth / 2,
        y + 6,
        { align: "center" }
      );

      addFooter();

      const safeCustomer =
        customerName
          .replace(/[^a-z0-9]+/gi, "-")
          .replace(/^-+|-+$/g, "")
          .toLowerCase() ||
        "customer";

      doc.save(
        `Monthly_Bill_${safeCustomer}_${pdfMonth}.pdf`
      );

      setPdfOpen(false);
    } catch (error) {
      console.error(
        "Monthly PDF Error:",
        error
      );

      alert(
        "Unable to generate PDF. Please make sure jspdf is installed."
      );
    } finally {
      setPdfGenerating(false);
    }
  }

  function clearFilters() {
    setSearch("");
    setFromDate("");
    setToDate("");
  }

  function setQuickRange(type) {
    const now = new Date();
    const today = now.toISOString().split("T")[0];

    if (type === "today") {
      setFromDate(today);
      setToDate(today);
      return;
    }

    if (type === "7days") {
      const start = new Date(now);
      start.setDate(start.getDate() - 6);
      setFromDate(start.toISOString().split("T")[0]);
      setToDate(today);
      return;
    }

    if (type === "month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      setFromDate(start.toISOString().split("T")[0]);
      setToDate(today);
    }
  }

  function handleFromDateChange(value) {
    setFromDate(value);

    if (toDate && value && value > toDate) {
      setToDate(value);
    }
  }

  function handleToDateChange(value) {
    setToDate(value);

    if (fromDate && value && value < fromDate) {
      setFromDate(value);
    }
  }

  const hasFilters =
    search.trim() || fromDate || toDate;

  const dateRangeLabel = fromDate && toDate
    ? `${formatDate(fromDate)} – ${formatDate(toDate)}`
    : fromDate
      ? `From ${formatDate(fromDate)}`
      : toDate
        ? `Until ${formatDate(toDate)}`
        : "All dates";

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <style>{`
          @keyframes historyPulse {
            0%, 100% { opacity: .45; }
            50% { opacity: 1; }
          }

          @keyframes historyFloat {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-5px); }
          }

          .history-skeleton {
            animation: historyPulse 1.4s ease-in-out infinite;
          }
        `}</style>

        <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="h-44 rounded-[30px] bg-slate-200 history-skeleton" />

          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-24 rounded-3xl bg-white shadow-sm history-skeleton"
              />
            ))}
          </div>

          <div className="mt-5 h-28 rounded-3xl bg-white shadow-sm history-skeleton" />

          <div className="mt-5 space-y-4">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-72 rounded-[28px] bg-white shadow-sm history-skeleton"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50">
      <style>{`
        @keyframes historyFadeUp {
          from {
            opacity: 0;
            transform: translateY(18px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes historyHero {
          from {
            opacity: 0;
            transform: translateY(-14px) scale(.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes historyFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-5px) rotate(2deg); }
        }

        .history-fade-up {
          animation: historyFadeUp .45s ease-out both;
        }

        .history-hero {
          animation: historyHero .55s ease-out both;
        }

        .history-float {
          animation: historyFloat 3s ease-in-out infinite;
        }

        .history-scrollbar::-webkit-scrollbar {
          height: 5px;
        }

        .history-scrollbar::-webkit-scrollbar-thumb {
          border-radius: 999px;
          background: #cbd5e1;
        }
      `}</style>

      <main className="mx-auto max-w-6xl px-2.5 pb-24 pt-3 sm:px-6 sm:pb-10 sm:pt-6 lg:px-8">
        {/* HERO */}
        <section className="history-hero relative overflow-hidden rounded-[24px] bg-gradient-to-br from-emerald-950 via-emerald-800 to-teal-700 px-4 py-5 text-white shadow-xl shadow-emerald-900/10 sm:rounded-[30px] sm:px-7 sm:py-8">
          <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-24 left-1/3 h-52 w-52 rounded-full bg-emerald-300/10 blur-3xl" />

          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-emerald-50 backdrop-blur">
                <HistoryIcon size={14} />
                DELIVERY ACTIVITY
              </div>

              <h1 className="text-[27px] font-black leading-tight tracking-tight sm:text-4xl">
                Delivery History
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-emerald-50/80 sm:text-base">
                Review your completed deliveries, customer details,
                delivered items and payment information.
              </p>
            </div>

            <button
              type="button"
              onClick={() => openPdfModal("")}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 text-sm font-black text-white shadow-lg backdrop-blur transition hover:bg-white/15 active:scale-[.98] md:w-auto"
            >
              <FileDown size={18} />
              Monthly PDF
            </button>

            <div className="history-float hidden h-24 w-24 shrink-0 items-center justify-center rounded-[28px] border border-white/15 bg-white/10 backdrop-blur md:flex">
              <Truck size={42} strokeWidth={1.7} />
            </div>
          </div>
        </section>

        {/* STATS */}
        <section className="mt-3 grid grid-cols-2 gap-2.5 sm:mt-4 sm:gap-3 md:grid-cols-3">
          <StatCard
            icon={<PackageCheck size={20} />}
            label="Completed"
            value={stats.total}
            helper="All deliveries"
            delay="60ms"
          />

          <StatCard
            icon={<Clock3 size={20} />}
            label="Today"
            value={stats.today}
            helper="Completed today"
            delay="120ms"
          />

          <StatCard
            icon={<IndianRupee size={20} />}
            label="Total Value"
            value={`₹${stats.amount.toFixed(0)}`}
            helper="Delivered orders"
            delay="180ms"
            fullWidth
          />
        </section>

        {/* FILTERS */}
        <section className="history-fade-up mt-4 rounded-[24px] border border-slate-200/80 bg-white p-2.5 shadow-sm sm:mt-5 sm:rounded-[28px] sm:p-4">
          <div className="mb-2.5 flex items-center justify-between px-1 sm:hidden">
            <div>
              <p className="text-sm font-black text-slate-900">Find deliveries</p>
              <p className="text-[10px] font-semibold text-slate-400">
                Search or choose a date range
              </p>
            </div>
            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-xl bg-slate-100 px-3 py-2 text-[10px] font-black text-slate-600 active:scale-95"
              >
                Reset
              </button>
            )}
          </div>

          <div className="flex flex-col gap-2.5 lg:flex-row">
            <div className="relative flex-1">
              <Search
                size={19}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                placeholder="Search customer, phone or delivery number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-11 text-[13px] font-medium text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100 sm:text-base"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-slate-200 text-slate-500 transition hover:bg-slate-300"
                  aria-label="Clear search"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <div className="lg:w-[430px]">
              <div className="mb-2 flex gap-2 overflow-x-auto pb-0.5 history-scrollbar">
                <button
                  type="button"
                  onClick={() => setQuickRange("today")}
                  className="min-h-9 shrink-0 rounded-xl border border-emerald-100 bg-emerald-50 px-3 text-[10px] font-black text-emerald-700 active:scale-95"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setQuickRange("7days")}
                  className="min-h-9 shrink-0 rounded-xl border border-slate-200 bg-slate-50 px-3 text-[10px] font-black text-slate-600 active:scale-95"
                >
                  Last 7 Days
                </button>
                <button
                  type="button"
                  onClick={() => setQuickRange("month")}
                  className="min-h-9 shrink-0 rounded-xl border border-slate-200 bg-slate-50 px-3 text-[10px] font-black text-slate-600 active:scale-95"
                >
                  This Month
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
              <label className="relative block">
                <CalendarDays
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <span className="pointer-events-none absolute left-11 top-1.5 text-[9px] font-black uppercase tracking-wider text-slate-400">
                  From Date
                </span>
                <input
                  type="date"
                  value={fromDate}
                  max={toDate || undefined}
                  onChange={(e) => handleFromDateChange(e.target.value)}
                  className="min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-3 pt-3 text-sm font-bold text-slate-700 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                />
              </label>

              <label className="relative block">
                <CalendarDays
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <span className="pointer-events-none absolute left-11 top-1.5 text-[9px] font-black uppercase tracking-wider text-slate-400">
                  To Date
                </span>
                <input
                  type="date"
                  value={toDate}
                  min={fromDate || undefined}
                  onChange={(e) => handleToDateChange(e.target.value)}
                  className="min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-3 pt-3 text-sm font-bold text-slate-700 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                />
              </label>
              </div>
            </div>

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="hidden min-h-12 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-600 transition hover:bg-slate-50 active:scale-95 lg:block"
              >
                Clear
              </button>
            )}
          </div>

          <div className="mt-2.5 flex items-center justify-between gap-2 px-1 sm:mt-3 sm:gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-400 sm:text-sm">
                Showing{" "}
                <span className="font-black text-slate-800">
                  {filteredHistory.length}
                </span>{" "}
                deliveries
              </p>
              {(fromDate || toDate) && (
                <p className="mt-1 truncate text-[10px] font-black uppercase tracking-wide text-emerald-600 sm:text-xs">
                  {dateRangeLabel}
                </p>
              )}
            </div>

            {hasFilters && (
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-700">
                Filter Active
              </span>
            )}
          </div>
        </section>

        {/* EMPTY */}
        {filteredHistory.length === 0 ? (
          <section className="history-fade-up mt-5 rounded-[30px] border border-slate-200 bg-white px-5 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[26px] bg-emerald-50 text-emerald-600">
              <PackageCheck size={38} strokeWidth={1.7} />
            </div>

            <h2 className="mt-5 text-xl font-black text-slate-900 sm:text-2xl">
              No delivery history
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              {hasFilters
                ? "No completed deliveries match your current search or selected date range."
                : "Completed deliveries will appear here."}
            </p>

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-5 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700 active:scale-95"
              >
                Clear Filters
              </button>
            )}
          </section>
        ) : (
          <section className="mt-5 space-y-4">
            {filteredHistory.map((delivery, index) => (
              <DeliveryHistoryCard
                key={`${delivery.type}-${delivery.id}`}
                delivery={delivery}
                index={index}
                formatDate={formatDate}
                formatTime={formatTime}
                onDownloadCustomerPdf={() => {
                  const customer = delivery.customer;
                  const id =
                    customer?.id ||
                    customer?.phone ||
                    customer?.full_name ||
                    "";
                  openPdfModal(id);
                }}
              />
            ))}
          </section>
        )}

        {pdfOpen && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/50 p-2 backdrop-blur-sm sm:items-center sm:p-4">
            <div className="history-fade-up w-full max-w-md overflow-hidden rounded-[28px] bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4 sm:px-5">
                <div>
                  <p className="text-base font-black text-slate-900">
                    Monthly Delivery PDF
                  </p>
                  <p className="mt-0.5 text-[11px] font-semibold text-slate-400">
                    Customer-wise report for a selected month
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setPdfOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500 active:scale-95"
                  aria-label="Close PDF dialog"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3 p-4 sm:p-5">
                <label className="block">
                  <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Customer
                  </span>

                  <div className="relative">
                    <UserRound
                      size={17}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <select
                      value={pdfCustomerId}
                      onChange={(e) =>
                        setPdfCustomerId(e.target.value)
                      }
                      className="min-h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm font-bold text-slate-700 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                    >
                      <option value="">
                        All Customers
                      </option>

                      {pdfCustomers.map((customer) => (
                        <option
                          key={customer.id}
                          value={customer.id}
                        >
                          {customer.name}
                          {customer.phone
                            ? ` • ${customer.phone}`
                            : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Month
                  </span>

                  <div className="relative">
                    <CalendarDays
                      size={17}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type="month"
                      value={pdfMonth}
                      onChange={(e) =>
                        setPdfMonth(e.target.value)
                      }
                      className="min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm font-bold text-slate-700 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                    />
                  </div>
                </label>

                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3">
                  <p className="text-xs font-black text-emerald-900">
                    {selectedPdfCustomer?.name ||
                      "All Customers"}
                  </p>
                  <p className="mt-1 text-[11px] font-semibold text-emerald-700">
                    {formatPdfMonth(pdfMonth)}
                    {" • "}
                    {getPdfDeliveries().length} deliveries
                  </p>
                </div>

                <button
                  type="button"
                  onClick={downloadCustomerMonthlyPdf}
                  disabled={
                    pdfGenerating || !pdfMonth
                  }
                  className="flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 text-sm font-black text-white shadow-lg shadow-emerald-200 transition active:scale-[.98] disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-300 disabled:shadow-none"
                >
                  {pdfGenerating ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Creating PDF...
                    </>
                  ) : (
                    <>
                      <Download size={18} />
                      Download PDF
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  helper,
  delay,
  fullWidth = false,
}) {
  return (
    <div
      className={`history-fade-up rounded-[22px] border border-slate-200/80 bg-white p-3 shadow-sm sm:rounded-[26px] sm:p-4 ${
        fullWidth ? "col-span-2 md:col-span-1" : ""
      }`}
      style={{ animationDelay: delay }}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            {label}
          </p>

          <p className="mt-0.5 truncate text-xl font-black text-slate-900 sm:text-2xl">
            {value}
          </p>

          <p className="mt-0.5 text-[10px] font-semibold text-slate-400">
            {helper}
          </p>
        </div>
      </div>
    </div>
  );
}

function DeliveryHistoryCard({
  delivery,
  index,
  formatDate,
  formatTime,
  onDownloadCustomerPdf,
}) {
  const customerName =
    delivery.customer?.full_name || "-";

  const phone =
    delivery.customer?.phone || "";

  const addressParts = [
    delivery.address?.house_no,
    delivery.address?.street,
    delivery.address?.area,
    delivery.address?.city,
  ].filter(Boolean);

  const address = addressParts.join(", ");

  const pincode = delivery.address?.pincode;

  return (
    <article
      className="history-fade-up overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-lg sm:rounded-[30px]"
      style={{
        animationDelay: `${Math.min(index * 45, 450)}ms`,
      }}
    >
      {/* CARD HEADER */}
      <div className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white px-3.5 py-3.5 sm:px-6 sm:py-4">
        <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-emerald-100/60 blur-2xl" />

        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <PackageCheck size={21} />
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Delivery
                </p>

                <h2 className="truncate text-lg font-black text-slate-900 sm:text-xl">
                  {delivery.number || "-"}
                </h2>
              </div>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 pl-14 text-xs font-semibold text-slate-400">
              <span>{formatDate(delivery.date)}</span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <Clock3 size={12} />
                {formatTime(delivery.date)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:justify-end">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Delivered
            </span>

            <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700">
              {delivery.type || "Delivery"}
            </span>
          </div>
        </div>
      </div>

      {/* CUSTOMER + ADDRESS */}
      <div className="grid grid-cols-1 gap-2.5 p-3 sm:gap-3 sm:p-6 lg:grid-cols-2">
        <InfoPanel
          icon={<User size={18} />}
          title="Customer"
          iconClass="bg-emerald-50 text-emerald-600"
        >
          <p className="text-base font-black text-slate-900">
            {customerName}
          </p>

          {phone ? (
            <a
              href={`tel:${phone}`}
              className="mt-2 inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100 active:scale-95"
            >
              <Phone size={15} />
              {phone}
            </a>
          ) : (
            <p className="mt-2 text-sm text-slate-400">
              Phone number unavailable
            </p>
          )}

          <button
            type="button"
            onClick={onDownloadCustomerPdf}
            className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-black text-emerald-700 transition hover:bg-emerald-100 active:scale-[.98] sm:w-auto"
          >
            <Download size={15} />
            Customer Monthly PDF
          </button>
        </InfoPanel>

        <InfoPanel
          icon={<MapPin size={18} />}
          title="Delivery Address"
          iconClass="bg-blue-50 text-blue-600"
        >
          <p className="text-sm font-semibold leading-6 text-slate-700">
            {address || "Address unavailable"}
            {pincode ? ` - ${pincode}` : ""}
          </p>
        </InfoPanel>
      </div>

      {/* ITEMS */}
      <div className="px-3 pb-3 sm:px-6 sm:pb-5">
        <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
          <Milk size={16} className="text-emerald-600" />
          Delivered Items
        </div>

        <div className="history-scrollbar flex gap-3 overflow-x-auto pb-1">
          {(delivery.items || []).map((item) => (
            <div
              key={item.id}
              className={`flex min-w-[270px] flex-1 items-center justify-between gap-3 rounded-2xl border p-3 ${
                item.is_extra
                  ? "border-orange-200 bg-orange-50/70"
                  : "border-slate-200 bg-slate-50/60"
              }`}
            >
              <div className="flex min-w-0 items-center gap-3">
                {item.products?.image ? (
                  <img
                    src={item.products.image}
                    alt={item.products?.name || "Product"}
                    className="h-12 w-12 shrink-0 rounded-xl border border-white object-cover shadow-sm"
                  />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                    <Milk size={22} />
                  </div>
                )}

                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-slate-900">
                    {item.products?.name || "-"}
                  </p>

                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {item.quantity} × {item.size}
                  </p>

                  {item.is_extra && (
                    <span className="mt-1 inline-flex rounded-full bg-orange-500 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-white">
                      Extra
                    </span>
                  )}
                </div>
              </div>

              <div className="shrink-0 text-right">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Amount
                </p>
                <p className="mt-0.5 text-sm font-black text-emerald-600">
                  ₹{Number(item.total_price || 0).toFixed(0)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* TOTAL */}
      <div className="mx-3 mb-3 flex flex-col gap-3 rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 p-3.5 sm:mx-6 sm:mb-6 sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
            Total Amount
          </p>

          <div className="mt-1 flex items-center gap-1 text-2xl font-black text-emerald-700">
            <IndianRupee size={20} strokeWidth={2.5} />
            {Number(delivery.total_amount || 0).toFixed(0)}
          </div>
        </div>

        <div className="sm:text-right">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Payment
          </p>

          <p className="mt-1 text-sm font-black text-slate-800">
            {delivery.payment_method || "Monthly Billing"}
          </p>
        </div>

        {phone && (
          <a
            href={`tel:${phone}`}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700 active:scale-95 sm:hidden"
          >
            <Phone size={16} />
            Call Customer
            <ChevronRight size={15} />
          </a>
        )}
      </div>
    </article>
  );
}

function InfoPanel({
  icon,
  title,
  iconClass,
  children,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 sm:p-4">
      <div className="flex items-center gap-2">
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconClass}`}
        >
          {icon}
        </span>

        <span className="text-xs font-black uppercase tracking-widest text-slate-400">
          {title}
        </span>
      </div>

      <div className="mt-3">{children}</div>
    </div>
  );
}
