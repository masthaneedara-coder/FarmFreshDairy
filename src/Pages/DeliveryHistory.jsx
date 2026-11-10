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
  ChevronDown,
  CheckCircle2,
  RefreshCw,
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
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;
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

  // Reset to the first page whenever search or date filters change.
  useEffect(() => {
    setCurrentPage(1);
  }, [search, fromDate, toDate]);

  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedHistory = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;
    return filteredHistory.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredHistory, safeCurrentPage]);

  const firstRecord = filteredHistory.length
    ? (safeCurrentPage - 1) * PAGE_SIZE + 1
    : 0;
  const lastRecord = Math.min(safeCurrentPage * PAGE_SIZE, filteredHistory.length);

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
      <div className="min-h-screen bg-[#f4f8f5] px-3 py-4 sm:px-6">
        <style>{`
          @keyframes historyPulse { 0%,100% { opacity:.45 } 50% { opacity:1 } }
          .history-skeleton { animation:historyPulse 1.35s ease-in-out infinite }
        `}</style>
        <div className="mx-auto max-w-6xl">
          <div className="mb-5 flex items-center gap-3 rounded-3xl bg-white p-4 shadow-sm">
            <div className="history-skeleton h-12 w-12 rounded-2xl bg-emerald-100" />
            <div className="flex-1 space-y-2">
              <div className="history-skeleton h-4 w-40 rounded bg-slate-200" />
              <div className="history-skeleton h-3 w-56 max-w-full rounded bg-slate-100" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {[1, 2, 3].map((item) => <div key={item} className="history-skeleton h-20 rounded-2xl bg-white" />)}
          </div>
          <div className="history-skeleton mt-4 h-28 rounded-3xl bg-white" />
          <div className="mt-4 space-y-3">
            {[1, 2, 3].map((item) => <div key={item} className="history-skeleton h-32 rounded-3xl bg-white" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="delivery-history-page min-h-screen overflow-x-hidden bg-[#f4f8f5] text-slate-900 pb-8">
      <style>{`
        @keyframes historyEnter { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
        @keyframes historyGlow { 0%,100% { transform:translate3d(0,0,0) scale(1) } 50% { transform:translate3d(-9px,7px,0) scale(1.06) } }
        @keyframes historyShine { 0% { transform:translateX(-150%) skewX(-18deg) } 100% { transform:translateX(420%) skewX(-18deg) } }
        .history-enter { animation:historyEnter .42s cubic-bezier(.22,1,.36,1) both }
        .history-glow { animation:historyGlow 7s ease-in-out infinite }
        .history-scroll::-webkit-scrollbar { height:4px }
        .history-scroll::-webkit-scrollbar-thumb { background:#cbd5e1; border-radius:99px }
        .history-button-shine { position:relative; overflow:hidden }
        .history-button-shine::after { content:""; position:absolute; inset:0 auto 0 -35%; width:25%; background:rgba(255,255,255,.24); transform:skewX(-18deg) }
        .history-button-shine:hover::after { animation:historyShine .75s ease }
        .delivery-history-page button:focus-visible,
        .delivery-history-page a:focus-visible,
        .delivery-history-page input:focus-visible,
        .delivery-history-page select:focus-visible { outline:3px solid rgba(16,185,129,.28); outline-offset:2px }
        @media (prefers-reduced-motion:reduce) {
          .history-enter,.history-glow,.history-skeleton { animation:none !important }
          .delivery-history-page * { scroll-behavior:auto !important; transition:none !important }
        }
      `}</style>

      <main className="mx-auto w-full max-w-6xl px-3 pt-3 sm:px-6 sm:pt-6 lg:px-8">
        {/* BRAND HEADER */}
        <header className="history-enter mb-4 flex items-center justify-between gap-3 rounded-[22px] border border-white bg-white px-3 py-3 shadow-[0_8px_28px_rgba(15,23,42,.05)] sm:mb-5 sm:rounded-[26px] sm:px-5 sm:py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-emerald-100 bg-emerald-50 p-1.5 sm:h-12 sm:w-12">
              <img src="/logo.png" alt="FarmFreshDairy logo" className="h-full w-full object-contain" onError={(e) => { e.currentTarget.style.display = "none"; }} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-black tracking-tight text-slate-900 sm:text-base">FarmFresh<span className="text-emerald-600">Dairy</span></p>
              <p className="mt-0.5 text-[10px] font-bold text-slate-400 sm:text-xs">Delivery partner workspace</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button type="button" onClick={loadHistory} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 active:scale-95" aria-label="Refresh delivery history" title="Refresh">
              <RefreshCw size={16} />
            </button>
            <button type="button" onClick={() => openPdfModal("")} className="history-button-shine flex min-h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-600 px-3.5 text-xs font-black text-white shadow-md shadow-emerald-200 transition hover:-translate-y-0.5 active:scale-95 sm:px-4 sm:text-sm">
              <FileDown size={16} /> <span>Monthly PDF</span>
            </button>
          </div>
        </header>

        {/* PAGE INTRO */}
        <section className="history-enter relative mb-4 overflow-hidden rounded-[24px] bg-gradient-to-br from-[#064e3b] via-[#047857] to-[#0f9f82] px-4 py-4 text-white shadow-lg shadow-emerald-900/10 sm:mb-5 sm:rounded-[30px] sm:px-6 sm:py-5" style={{ animationDelay: "50ms" }}>
          <div className="history-glow pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-emerald-200/15 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-20 left-1/3 h-40 w-40 rounded-full bg-teal-200/10 blur-3xl" />
          <div className="relative flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="mb-1.5 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[.16em] text-emerald-50 sm:text-[10px]">
                <HistoryIcon size={12} /> Delivery activity
              </div>
              <h1 className="text-[24px] font-black leading-tight tracking-tight sm:text-3xl">Delivery History</h1>
              <p className="mt-1 max-w-xl text-[11px] font-medium leading-5 text-emerald-50/80 sm:text-sm">Review completed drops, customer details, delivered items and monthly totals.</p>
            </div>
            <div className="hidden h-[66px] w-[66px] shrink-0 items-center justify-center rounded-[22px] border border-white/15 bg-white/10 text-emerald-50 sm:flex">
              <Truck size={31} strokeWidth={1.6} />
            </div>
          </div>
          <div className="relative mt-3 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/10 px-3 py-2.5 backdrop-blur sm:mt-4">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-100/70">Records in view</p>
              <p className="mt-0.5 text-base font-black sm:text-lg">{stats.total} deliveries</p>
            </div>
            <span className="h-7 w-px bg-white/15" />
            <div className="text-right">
              <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-100/70">Delivery value</p>
              <p className="mt-0.5 text-base font-black sm:text-lg">₹{stats.amount.toFixed(0)}</p>
            </div>
          </div>
        </section>

        {/* COMPACT KPI TAGS */}
        <section className="mb-4 grid grid-cols-3 gap-2 sm:mb-5 sm:gap-3">
          <StatCard icon={<PackageCheck size={17} />} label="Completed" value={stats.total} helper="Filtered records" tone="green" delay="90ms" />
          <StatCard icon={<Clock3 size={17} />} label="Today" value={stats.today} helper="Completed today" tone="blue" delay="140ms" />
          <StatCard icon={<IndianRupee size={17} />} label="Total value" value={`₹${stats.amount.toFixed(0)}`} helper="Delivered orders" tone="amber" delay="190ms" />
        </section>

        {/* SEARCH + FILTERS */}
        <section className="history-enter mb-4 rounded-[22px] border border-slate-200/80 bg-white p-3 shadow-sm sm:mb-5 sm:rounded-[26px] sm:p-4" style={{ animationDelay: "120ms" }}>
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-black text-slate-900 sm:text-base">Find deliveries</h2>
              <p className="mt-0.5 text-[10px] font-semibold text-slate-400 sm:text-xs">Search a customer or choose a date range</p>
            </div>
            {hasFilters && <button type="button" onClick={clearFilters} className="rounded-xl bg-slate-100 px-3 py-2 text-[10px] font-black text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-700 active:scale-95">Clear filters</button>}
          </div>
          <div className="relative">
            <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search customer, phone or delivery number..." value={search} onChange={(e) => setSearch(e.target.value)} className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-10 text-xs font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-50 sm:min-h-12 sm:rounded-2xl sm:text-sm" />
            {search && <button type="button" onClick={() => setSearch("")} className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200" aria-label="Clear search"><X size={15} /></button>}
          </div>
          <div className="history-scroll mt-2.5 flex gap-1.5 overflow-x-auto pb-1">
            <button type="button" onClick={() => setQuickRange("today")} className="min-h-8 shrink-0 rounded-full border border-emerald-100 bg-emerald-50 px-3 text-[10px] font-black text-emerald-700 transition hover:bg-emerald-100 active:scale-95">Today</button>
            <button type="button" onClick={() => setQuickRange("7days")} className="min-h-8 shrink-0 rounded-full border border-blue-100 bg-blue-50 px-3 text-[10px] font-black text-blue-700 transition hover:bg-blue-100 active:scale-95">Last 7 days</button>
            <button type="button" onClick={() => setQuickRange("month")} className="min-h-8 shrink-0 rounded-full border border-violet-100 bg-violet-50 px-3 text-[10px] font-black text-violet-700 transition hover:bg-violet-100 active:scale-95">This month</button>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <label className="block min-w-0">
              <span className="mb-1 block text-[9px] font-black uppercase tracking-wider text-slate-400">From date</span>
              <span className="relative block"><CalendarDays size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input type="date" value={fromDate} max={toDate || undefined} onChange={(e) => handleFromDateChange(e.target.value)} className="min-h-10 w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-2 text-[11px] font-bold text-slate-700 outline-none focus:border-emerald-400 focus:bg-white sm:min-h-11 sm:text-xs" /></span>
            </label>
            <label className="block min-w-0">
              <span className="mb-1 block text-[9px] font-black uppercase tracking-wider text-slate-400">To date</span>
              <span className="relative block"><CalendarDays size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input type="date" value={toDate} min={fromDate || undefined} onChange={(e) => handleToDateChange(e.target.value)} className="min-h-10 w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-2 text-[11px] font-bold text-slate-700 outline-none focus:border-emerald-400 focus:bg-white sm:min-h-11 sm:text-xs" /></span>
            </label>
          </div>
          <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-slate-100 pt-2.5">
            <p className="text-[10px] font-semibold text-slate-500 sm:text-xs">Showing <strong className="text-slate-900">{filteredHistory.length}</strong> of {history.length} deliveries</p>
            <span className="max-w-[48%] truncate rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-black text-slate-500">{dateRangeLabel}</span>
          </div>
        </section>

        {/* DELIVERY HISTORY LIST */}
        <section>
          <div className="mb-2.5 flex items-center justify-between gap-2 px-1">
            <div>
              <h2 className="text-base font-black text-slate-900 sm:text-lg">Completed deliveries</h2>
              <p className="text-[10px] font-semibold text-slate-400">Tap a record to view full details</p>
            </div>
            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-black text-emerald-700">{filteredHistory.length} records</span>
          </div>

          {filteredHistory.length === 0 ? (
            <div className="history-enter rounded-[24px] border border-slate-200 bg-white px-5 py-12 text-center shadow-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"><PackageCheck size={31} /></div>
              <h3 className="mt-4 text-base font-black text-slate-900">No delivery history found</h3>
              <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-slate-500">{hasFilters ? "No completed deliveries match your search or selected dates." : "Completed deliveries will appear here."}</p>
              {hasFilters && <button type="button" onClick={clearFilters} className="mt-4 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white shadow-md shadow-emerald-100 active:scale-95">Clear filters</button>}
            </div>
          ) : (
            <div className="space-y-2.5 sm:space-y-3">
              {paginatedHistory.map((delivery, index) => (
                <DeliveryHistoryCard
                  key={`${delivery.type}-${delivery.id}`}
                  delivery={delivery}
                  index={index}
                  formatDate={formatDate}
                  formatTime={formatTime}
                  onDownloadCustomerPdf={() => {
                    const customer = delivery.customer;
                    const id = customer?.id || customer?.phone || customer?.full_name || "";
                    openPdfModal(id);
                  }}
                />
              ))}
            </div>
          )}

          {/* PAGINATION */}
          {filteredHistory.length > 0 && (
            <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-4">
              <p className="text-center text-[10px] font-semibold text-slate-500 sm:text-left sm:text-xs">
                Showing <strong className="text-slate-900">{firstRecord}-{lastRecord}</strong> of{" "}
                <strong className="text-slate-900">{filteredHistory.length}</strong> records
                <span className="mx-1.5 text-slate-300">·</span>
                Page {safeCurrentPage} of {totalPages}
              </p>

              <div className="flex items-center justify-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage(1)}
                  disabled={safeCurrentPage === 1}
                  className="min-h-9 rounded-lg border border-slate-200 px-2.5 text-[10px] font-black text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="First page"
                >
                  First
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={safeCurrentPage === 1}
                  className="min-h-9 rounded-lg border border-slate-200 px-3 text-[10px] font-black text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="flex h-9 min-w-9 items-center justify-center rounded-lg bg-emerald-600 px-3 text-xs font-black text-white">
                  {safeCurrentPage}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  disabled={safeCurrentPage === totalPages}
                  className="min-h-9 rounded-lg border border-slate-200 px-3 text-[10px] font-black text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={safeCurrentPage === totalPages}
                  className="min-h-9 rounded-lg border border-slate-200 px-2.5 text-[10px] font-black text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Last page"
                >
                  Last
                </button>
              </div>
            </div>
          )}
        </section>

        {/* MONTHLY PDF DIALOG */}
        {pdfOpen && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/55 p-2 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) setPdfOpen(false); }}>
            <div className="history-enter max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-[26px] bg-white shadow-2xl sm:rounded-[28px]">
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-4 py-3.5 backdrop-blur sm:px-5">
                <div><p className="text-sm font-black text-slate-900 sm:text-base">Monthly delivery PDF</p><p className="mt-0.5 text-[10px] font-semibold text-slate-400">Customer-wise report for a selected month</p></div>
                <button type="button" onClick={() => setPdfOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 active:scale-95" aria-label="Close PDF dialog"><X size={17} /></button>
              </div>
              <div className="space-y-3 p-4 sm:p-5">
                <label className="block"><span className="mb-1.5 block text-[9px] font-black uppercase tracking-wider text-slate-400">Customer</span><div className="relative"><UserRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><select value={pdfCustomerId} onChange={(e) => setPdfCustomerId(e.target.value)} className="min-h-11 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs font-bold text-slate-700 outline-none focus:border-emerald-400 focus:bg-white sm:text-sm"><option value="">All customers</option>{pdfCustomers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}{customer.phone ? ` • ${customer.phone}` : ""}</option>)}</select></div></label>
                <label className="block"><span className="mb-1.5 block text-[9px] font-black uppercase tracking-wider text-slate-400">Month</span><div className="relative"><CalendarDays size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input type="month" value={pdfMonth} onChange={(e) => setPdfMonth(e.target.value)} className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs font-bold text-slate-700 outline-none focus:border-emerald-400 focus:bg-white sm:text-sm" /></div></label>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3"><p className="text-xs font-black text-emerald-900">{selectedPdfCustomer?.name || "All customers"}</p><p className="mt-1 text-[10px] font-semibold text-emerald-700">{formatPdfMonth(pdfMonth)} · {getPdfDeliveries().length} deliveries</p></div>
                <button type="button" onClick={downloadCustomerMonthlyPdf} disabled={pdfGenerating || !pdfMonth} className="history-button-shine flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-600 px-4 text-xs font-black text-white shadow-md shadow-emerald-100 transition active:scale-[.98] disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-300 disabled:shadow-none sm:text-sm">
                  {pdfGenerating ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />Generating PDF...</> : <><Download size={16} />Download PDF</>}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({ icon, label, value, helper, delay = "0ms", tone = "green" }) {
  const tones = {
    green: "bg-emerald-50 text-emerald-700 border-emerald-100",
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
  };
  return (
    <div className="history-enter min-w-0 rounded-2xl border border-white bg-white p-2.5 shadow-[0_5px_18px_rgba(15,23,42,.045)] transition duration-300 hover:-translate-y-0.5 hover:shadow-md sm:rounded-[22px] sm:p-3.5" style={{ animationDelay: delay }}>
      <div className="flex min-w-0 items-center gap-2">
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${tones[tone]}`}>{icon}</span>
        <div className="min-w-0"><p className="truncate text-[8px] font-black uppercase tracking-wider text-slate-400 sm:text-[10px]">{label}</p><p className="mt-0.5 truncate text-base font-black leading-tight text-slate-900 sm:text-xl">{value}</p><p className="mt-0.5 hidden truncate text-[9px] font-semibold text-slate-400 sm:block">{helper}</p></div>
      </div>
    </div>
  );
}

function DeliveryHistoryCard({ delivery, index, formatDate, formatTime, onDownloadCustomerPdf }) {
  const [expanded, setExpanded] = useState(false);
  const customerName = delivery.customer?.full_name || "Customer";
  const phone = delivery.customer?.phone || "";
  const address = [delivery.address?.house_no, delivery.address?.street, delivery.address?.area, delivery.address?.city].filter(Boolean).join(", ");
  const pincode = delivery.address?.pincode;
  const items = Array.isArray(delivery.items) ? delivery.items : [];
  const amount = Number(delivery.total_amount || items.reduce((sum, item) => sum + Number(item.total_price || 0), 0));
  const itemSummary = items.map((item) => `${item.quantity || 0} × ${item.size || "item"}`).slice(0, 2).join(" · ");

  return (
    <article className="history-enter overflow-hidden rounded-[21px] border border-slate-200/80 bg-white shadow-[0_5px_18px_rgba(15,23,42,.045)] transition duration-300 hover:-translate-y-0.5 hover:shadow-lg sm:rounded-[25px]" style={{ animationDelay: `${Math.min(index * 35, 350)}ms` }}>
      <div className="p-3 sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><PackageCheck size={17} /></div>
            <div className="min-w-0"><p className="truncate text-[9px] font-black uppercase tracking-wider text-slate-400">Delivery record</p><h3 className="truncate text-sm font-black text-slate-900 sm:text-base">{delivery.number || "—"}</h3></div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-2 py-1 text-[8px] font-black text-emerald-700 sm:text-[9px]"><CheckCircle2 size={10} />Delivered</span>
            <span className="hidden rounded-full border border-blue-100 bg-blue-50 px-2 py-1 text-[9px] font-black text-blue-700 sm:inline-flex">{delivery.type || "Delivery"}</span>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-2.5 py-2">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-teal-50 text-xs font-black text-emerald-700">{customerName.charAt(0).toUpperCase()}</div>
            <div className="min-w-0"><p className="truncate text-xs font-black text-slate-800">{customerName}</p><p className="mt-0.5 truncate text-[9px] font-semibold text-slate-400">{formatDate(delivery.date)}{formatTime(delivery.date) ? ` · ${formatTime(delivery.date)}` : ""}</p></div>
          </div>
          {phone ? <a href={`tel:${phone}`} className="inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-2.5 text-[10px] font-black text-emerald-700 shadow-sm transition hover:bg-emerald-50 active:scale-95"><Phone size={12} />Call</a> : <span className="text-[9px] font-semibold text-slate-400">No phone</span>}
        </div>

        <div className="mt-2.5 grid grid-cols-[1fr_auto] items-center gap-2">
          <div className="min-w-0"><p className="truncate text-[10px] font-semibold text-slate-500">{itemSummary || `${items.length} delivered items`}</p><p className="mt-0.5 truncate text-[9px] font-medium text-slate-400">{address || "Address not available"}{pincode ? ` · ${pincode}` : ""}</p></div>
          <div className="text-right"><p className="text-[8px] font-black uppercase tracking-wider text-slate-400">Total</p><p className="text-sm font-black text-emerald-700">₹{amount.toFixed(0)}</p></div>
        </div>

        <button type="button" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded} className="mt-3 flex min-h-9 w-full items-center justify-between rounded-xl border border-slate-100 bg-white px-3 text-[10px] font-black text-slate-500 transition hover:border-emerald-100 hover:bg-emerald-50/60 hover:text-emerald-700 active:scale-[.99]">
          <span>{expanded ? "Hide delivery details" : "View delivery details"}</span><ChevronDown size={15} className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
        </button>
      </div>

      {expanded && (
        <div className="history-enter border-t border-slate-100 bg-[#fbfdfb] p-3 sm:p-4">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <InfoPanel icon={<User size={15} />} title="Customer" iconClass="bg-emerald-50 text-emerald-600">
              <p className="text-xs font-black text-slate-800">{customerName}</p>
              {phone ? <a href={`tel:${phone}`} className="mt-2 inline-flex min-h-8 items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 text-[10px] font-black text-emerald-700"><Phone size={12} />{phone}</a> : <p className="mt-1 text-[10px] text-slate-400">Phone unavailable</p>}
              <button type="button" onClick={onDownloadCustomerPdf} className="mt-2 inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-2.5 text-[10px] font-black text-emerald-700 transition hover:bg-emerald-50 active:scale-95"><Download size={12} />Customer monthly PDF</button>
            </InfoPanel>
            <InfoPanel icon={<MapPin size={15} />} title="Delivery address" iconClass="bg-blue-50 text-blue-600">
              <p className="text-[11px] font-semibold leading-5 text-slate-700">{address || "Address unavailable"}{pincode ? ` - ${pincode}` : ""}</p>
            </InfoPanel>
          </div>

          <div className="mt-3">
            <div className="mb-2 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-slate-400"><Milk size={13} className="text-emerald-600" />Delivered items <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-emerald-700">{items.length}</span></div>
            {items.length ? <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {items.map((item, itemIndex) => <div key={item.id || `${delivery.id}-item-${itemIndex}`} className={`flex min-w-0 items-center justify-between gap-2 rounded-xl border p-2.5 ${item.is_extra ? "border-orange-200 bg-orange-50/70" : "border-slate-200 bg-white"}`}>
                <div className="flex min-w-0 items-center gap-2">
                  {item.products?.image ? <img src={item.products.image} alt={item.products?.name || "Product"} className="h-9 w-9 shrink-0 rounded-lg border border-white object-cover" /> : <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700"><Milk size={17} /></div>}
                  <div className="min-w-0"><p className="truncate text-[11px] font-black text-slate-800">{item.products?.name || "Milk"}</p><p className="mt-0.5 text-[9px] font-semibold text-slate-500">{item.quantity} × {item.size}</p></div>
                </div>
                <div className="shrink-0 text-right"><p className="text-[11px] font-black text-emerald-700">₹{Number(item.total_price || 0).toFixed(0)}</p>{item.is_extra && <span className="text-[8px] font-black uppercase text-orange-600">Extra</span>}</div>
              </div>)}
            </div> : <p className="rounded-xl bg-white p-3 text-[10px] text-slate-400">No item details available.</p>}
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-emerald-100 bg-emerald-50/80 px-3 py-2.5">
            <div><p className="text-[8px] font-black uppercase tracking-wider text-emerald-700/70">Payment method</p><p className="mt-0.5 text-[11px] font-black text-slate-800">{delivery.payment_method || "Monthly Billing"}</p></div>
            <div className="text-right"><p className="text-[8px] font-black uppercase tracking-wider text-emerald-700/70">Delivery total</p><p className="mt-0.5 text-base font-black text-emerald-700">₹{amount.toFixed(2)}</p></div>
          </div>
        </div>
      )}
    </article>
  );
}

function InfoPanel({ icon, title, iconClass, children }) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-3">
      <div className="flex items-center gap-2"><span className={`flex h-7 w-7 items-center justify-center rounded-lg ${iconClass}`}>{icon}</span><span className="text-[9px] font-black uppercase tracking-wider text-slate-400">{title}</span></div>
      <div className="mt-2">{children}</div>
    </div>
  );
}
