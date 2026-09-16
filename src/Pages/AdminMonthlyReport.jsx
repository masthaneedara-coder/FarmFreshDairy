import { useEffect, useMemo, useState } from "react";

import MonthlyBillDrawer from "../Components/admin/MonthlyBillDrawer";

import { generateMonthlyBillPDF } from "../utils/monthlyBillPdf";
import { sendMonthlyBillWhatsapp } from "../utils/whatsappBill";

import {
  getMonthlyDeliveryReport,
  getMonthlyBillDetails,
  markMonthlyBillPaid,
} from "../config/api";

export default function AdminMonthlyReport() {
  const today = new Date();

  const [month, setMonth] = useState(
    today.getMonth() + 1
  );

  const [year, setYear] = useState(
    today.getFullYear()
  );

  const [loading, setLoading] = useState(false);

  const [customers, setCustomers] = useState([]);

  const [selectedBill, setSelectedBill] =
    useState(null);

  const [drawerOpen, setDrawerOpen] =
    useState(false);

  // ==========================================
  // LOAD REPORT
  // ==========================================

  useEffect(() => {
    loadReport();
  }, [month, year]);

  async function loadReport() {
    try {
      setLoading(true);

      const res =
        await getMonthlyDeliveryReport(
          month,
          year
        );

      setCustomers(res.customers || []);
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  // ==========================================
  // STATISTICS
  // ==========================================

  const totalCustomers =
    customers.length;

  const totalDelivered =
    customers.reduce(
      (sum, c) =>
        sum + Number(c.deliveredDays || 0),
      0
    );

  const totalMissed =
    customers.reduce(
      (sum, c) =>
        sum + Number(c.missedDays || 0),
      0
    );

  const totalRevenue =
    customers.reduce(
      (sum, c) =>
        sum + Number(c.billAmount || 0),
      0
    );

  // ==========================================
  // VIEW BILL
  // ==========================================

  async function handleViewBill(
    subscriptionId
  ) {
    try {
      const data =
        await getMonthlyBillDetails(
          subscriptionId,
          month,
          year
        );

      if (!data.success) {
        alert(data.message);
        return;
      }

      setSelectedBill({
        bill: data.bill,
        customer: data.customer,
        subscription:
          data.subscription,
        deliveries:
          data.deliveries,
      });

      setDrawerOpen(true);
    } catch (err) {
      console.error(err);
      alert(
        "Failed to load bill details."
      );
    }
  }

  // ==========================================
  // DOWNLOAD
  // ==========================================

  async function handleDownloadInvoice(
    subscriptionId
  ) {
    try {
      const data =
        await getMonthlyBillDetails(
          subscriptionId,
          month,
          year
        );

      if (!data.success) {
        alert(data.message);
        return;
      }

      await generateMonthlyBillPDF(
        {
          bill: data.bill,
          customer: data.customer,
          subscription:
            data.subscription,
          deliveries:
            data.deliveries,
        },
        "download"
      );
    } catch (err) {
      console.error(err);
      alert(
        "Failed to generate invoice."
      );
    }
  }

  // ==========================================
  // PRINT
  // ==========================================

  async function handlePrintInvoice(
    subscriptionId
  ) {
    try {
      const data =
        await getMonthlyBillDetails(
          subscriptionId,
          month,
          year
        );

      if (!data.success) {
        alert(data.message);
        return;
      }

      await generateMonthlyBillPDF(
        data,
        "print"
      );
    } catch (err) {
      console.error(err);
      alert(
        "Failed to print invoice."
      );
    }
  }

  // ==========================================
  // WHATSAPP
  // ==========================================

  async function handleWhatsappInvoice(
    subscriptionId
  ) {
    try {
      const data =
        await getMonthlyBillDetails(
          subscriptionId,
          month,
          year
        );

      if (!data.success) {
        alert(data.message);
        return;
      }

      sendMonthlyBillWhatsapp(data);
    } catch (err) {
      console.error(err);
      alert(
        "Failed to send invoice."
      );
    }
  }

  // ==========================================
  // MARK PAID
  // ==========================================

  async function handleMarkPaid(
    billId
  ) {
    if (!billId) {
      alert("Bill ID not found.");
      return;
    }

    try {
      await markMonthlyBillPaid(
        billId
      );

      alert(
        "Bill marked as Paid successfully."
      );

      await loadReport();

      setDrawerOpen(false);
    } catch (err) {
      console.error(err);

      alert(
        "Failed to mark bill as paid."
      );
    }
  }

  // ==========================================
  // MARK SUBSCRIPTION PAID
  // Fetch actual bill first
  // ==========================================

  async function handleMarkSubscriptionPaid(
    subscriptionId
  ) {
    try {
      const data =
        await getMonthlyBillDetails(
          subscriptionId,
          month,
          year
        );

      if (!data.success) {
        alert(data.message);
        return;
      }

      const billId =
        data.bill?.id;

      if (!billId) {
        alert(
          "Monthly bill record not found."
        );
        return;
      }

      await handleMarkPaid(
        billId
      );
    } catch (err) {
      console.error(err);

      alert(
        "Failed to update payment."
      );
    }
  }

  // ==========================================
  // MONTH NAME
  // ==========================================

  const monthName = new Date(
    year,
    month - 1
  ).toLocaleString("default", {
    month: "long",
  });

  // ==========================================
  // SORT / DISPLAY
  // ==========================================

  const reportCustomers = useMemo(
    () => customers,
    [customers]
  );

  return (
    <div className="min-h-screen bg-slate-50 p-3 sm:p-5 lg:p-6">

      {/* ========================================
          ANIMATIONS
      ======================================== */}

      <style>{`
        @keyframes reportFadeUp {
          from {
            opacity: 0;
            transform: translateY(18px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes reportHeader {
          from {
            opacity: 0;
            transform: translateY(-12px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes reportNumber {
          from {
            opacity: 0;
            transform: scale(.92);
          }

          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .report-fade {
          animation: reportFadeUp .45s ease-out both;
        }

        .report-header {
          animation: reportHeader .45s ease-out both;
        }

        .report-number {
          animation: reportNumber .4s ease-out both;
        }
      `}</style>

      <div className="max-w-[1600px] mx-auto">

        {/* ========================================
            HEADER
        ======================================== */}

        <div className="report-header mb-5">

          <div className="
            flex
            flex-col
            lg:flex-row
            lg:items-center
            lg:justify-between
            gap-4
          ">

            <div>

              <div className="flex items-center gap-3">

                <div className="
                  w-12 h-12
                  sm:w-14 sm:h-14
                  rounded-2xl
                  bg-green-100
                  flex items-center justify-center
                  text-2xl sm:text-3xl
                ">
                  📊
                </div>

                <div>

                  <h1 className="
                    text-2xl
                    sm:text-3xl
                    lg:text-4xl
                    font-black
                    text-gray-900
                  ">
                    Monthly Delivery Report
                  </h1>

                  <p className="
                    text-sm
                    sm:text-base
                    text-gray-500
                    mt-1
                  ">
                    Customer Delivery Summary
                  </p>

                </div>

              </div>

            </div>

            {/* Month / Year */}

            <div className="
              grid
              grid-cols-2
              gap-2
              sm:flex
            ">

              <select
                value={month}
                onChange={(e) =>
                  setMonth(
                    Number(e.target.value)
                  )
                }
                className="
                  border
                  border-gray-200
                  bg-white
                  rounded-2xl
                  px-4
                  py-3
                  outline-none
                  font-semibold
                  shadow-sm
                  focus:border-green-500
                  focus:ring-4
                  focus:ring-green-100
                "
              >
                {[
                  "January",
                  "February",
                  "March",
                  "April",
                  "May",
                  "June",
                  "July",
                  "August",
                  "September",
                  "October",
                  "November",
                  "December",
                ].map((m, index) => (
                  <option
                    key={index}
                    value={index + 1}
                  >
                    {m}
                  </option>
                ))}
              </select>

              <input
                type="number"
                value={year}
                onChange={(e) =>
                  setYear(
                    Number(e.target.value)
                  )
                }
                className="
                  w-full
                  sm:w-32
                  border
                  border-gray-200
                  bg-white
                  rounded-2xl
                  px-4
                  py-3
                  outline-none
                  font-semibold
                  shadow-sm
                  focus:border-green-500
                  focus:ring-4
                  focus:ring-green-100
                "
              />

            </div>

          </div>

        </div>

        {/* ========================================
            STATS
        ======================================== */}

        <div className="
          grid
          grid-cols-2
          lg:grid-cols-4
          gap-3
          sm:gap-4
          mb-5
        ">

          <ReportStat
            icon="👥"
            label="Customers"
            value={totalCustomers}
            delay="0ms"
            iconBg="bg-green-50"
            valueColor="text-green-700"
          />

          <ReportStat
            icon="🚚"
            label="Delivered"
            value={totalDelivered}
            delay="60ms"
            iconBg="bg-blue-50"
            valueColor="text-blue-700"
          />

          <ReportStat
            icon="❌"
            label="Missed"
            value={totalMissed}
            delay="120ms"
            iconBg="bg-red-50"
            valueColor="text-red-600"
          />

          <ReportStat
            icon="💰"
            label="Revenue"
            value={`₹${totalRevenue.toLocaleString(
              "en-IN"
            )}`}
            delay="180ms"
            iconBg="bg-emerald-50"
            valueColor="text-emerald-700"
          />

        </div>

        {/* ========================================
            REPORT PERIOD
        ======================================== */}

        <div className="
          report-fade
          bg-white
          rounded-3xl
          border border-gray-100
          shadow-sm
          px-4 py-3
          mb-5
          flex
          items-center
          justify-between
          gap-3
        ">

          <div>

            <p className="
              text-xs
              uppercase
              tracking-wide
              text-gray-400
              font-bold
            ">
              Report Period
            </p>

            <p className="
              text-base
              sm:text-lg
              font-black
              text-gray-900
              mt-0.5
            ">
              {monthName} {year}
            </p>

          </div>

          <div className="
            px-3 py-1.5
            rounded-full
            bg-green-100
            text-green-700
            text-xs
            sm:text-sm
            font-black
          ">
            {reportCustomers.length} Records
          </div>

        </div>

        {/* ========================================
            LOADING
        ======================================== */}

        {loading && (
          <div className="
            bg-white
            rounded-3xl
            border border-gray-100
            shadow-sm
            p-6
          ">

            <div className="
              flex
              flex-col
              items-center
              justify-center
              py-12
            ">

              <div className="
                animate-spin
                rounded-full
                h-12
                w-12
                border-4
                border-green-200
                border-t-green-600
              " />

              <p className="
                mt-4
                text-gray-500
                font-semibold
              ">
                Loading Monthly Report...
              </p>

            </div>

          </div>
        )}

        {/* ========================================
            EMPTY
        ======================================== */}

        {!loading &&
          customers.length === 0 && (
            <EmptyReport />
          )}

        {/* ========================================
            MOBILE CARDS
        ======================================== */}

        {!loading &&
          customers.length > 0 && (

          <div className="
            md:hidden
            space-y-4
          ">

            {reportCustomers.map(
              (c, index) => (

                <MobileReportCard
                  key={c.subscriptionId}
                  customer={c}
                  index={index}
                  onView={
                    handleViewBill
                  }
                  onDownload={
                    handleDownloadInvoice
                  }
                  onPrint={
                    handlePrintInvoice
                  }
                  onWhatsapp={
                    handleWhatsappInvoice
                  }
                  onPaid={
                    handleMarkSubscriptionPaid
                  }
                />

              )
            )}

          </div>
        )}

        {/* ========================================
            DESKTOP TABLE
        ======================================== */}

        {!loading &&
          customers.length > 0 && (

          <div className="
            hidden
            md:block
            bg-white
            rounded-3xl
            border border-gray-100
            shadow-sm
            overflow-hidden
          ">

            <div className="overflow-x-auto">

              <table className="w-full">

                <thead className="
                  bg-gradient-to-r
                  from-green-600
                  to-green-700
                  text-white
                ">

                  <tr>

                    <th className="px-4 py-4 text-left">
                      Customer
                    </th>

                    <th className="px-4 py-4 text-left">
                      Product
                    </th>

                    <th className="px-4 py-4 text-center">
                      Qty
                    </th>

                    <th className="px-4 py-4 text-center">
                      Delivered
                    </th>

                    <th className="px-4 py-4 text-center">
                      Missed
                    </th>

                    <th className="px-4 py-4 text-center">
                      Daily Rate
                    </th>

                    <th className="px-4 py-4 text-center">
                      Bill Amount
                    </th>

                    <th className="px-4 py-4 text-center">
                      Payment
                    </th>

                    <th className="px-4 py-4 text-center">
                      Subscription
                    </th>

                    <th className="px-4 py-4 text-center">
                      Actions
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {reportCustomers.map(
                    (c, index) => (

                      <tr
                        key={
                          c.subscriptionId
                        }
                        className="
                          report-fade
                          border-b
                          border-gray-100
                          transition-all
                          duration-200
                          hover:bg-green-50/60
                        "
                        style={{
                          animationDelay:
                            `${index * 40}ms`,
                        }}
                      >

                        <td className="px-4 py-4">

                          <div className="font-black text-gray-900">
                            {c.customerName}
                          </div>

                          <div className="text-sm text-gray-500 mt-1">
                            {c.phone}
                          </div>

                        </td>

                        <td className="px-4 py-4">

                          <div className="flex items-center gap-2">

                            <span className="text-xl">
                              🥛
                            </span>

                            <span className="font-semibold">
                              {c.product}
                            </span>

                          </div>

                        </td>

                        <td className="px-4 py-4 text-center font-bold">
                          {c.quantity}
                        </td>

                        <td className="px-4 py-4 text-center">

                          <span className="
                            inline-flex
                            items-center
                            justify-center
                            min-w-9
                            px-2
                            py-1
                            rounded-full
                            bg-green-100
                            text-green-700
                            font-black
                          ">
                            {c.deliveredDays}
                          </span>

                        </td>

                        <td className="px-4 py-4 text-center">

                          <span className="
                            inline-flex
                            items-center
                            justify-center
                            min-w-9
                            px-2
                            py-1
                            rounded-full
                            bg-red-100
                            text-red-600
                            font-black
                          ">
                            {c.missedDays}
                          </span>

                        </td>

                        <td className="px-4 py-4 text-center whitespace-nowrap">
                          ₹
                          {Number(
                            c.dailyRate
                          ).toFixed(2)}
                        </td>

                        <td className="
                          px-4
                          py-4
                          text-center
                          font-black
                          text-green-700
                          whitespace-nowrap
                        ">
                          ₹
                          {Number(
                            c.billAmount
                          ).toFixed(2)}
                        </td>

                        <td className="px-4 py-4 text-center">

                          <PaymentBadge
                            status={
                              c.paymentStatus
                            }
                          />

                        </td>

                        <td className="px-4 py-4 text-center">

                          <SubscriptionBadge
                            status={c.status}
                          />

                        </td>

                        <td className="px-4 py-4">

                          <div className="
                            flex
                            flex-wrap
                            justify-center
                            gap-2
                          ">

                            <ActionButton
                              label="View"
                              icon="👁"
                              onClick={() =>
                                handleViewBill(
                                  c.subscriptionId
                                )
                              }
                              className="
                                bg-gray-100
                                text-gray-700
                                hover:bg-gray-200
                              "
                            />

                            <ActionButton
                              label="PDF"
                              icon="📄"
                              onClick={() =>
                                handleDownloadInvoice(
                                  c.subscriptionId
                                )
                              }
                              className="
                                bg-red-600
                                text-white
                                hover:bg-red-700
                              "
                            />

                            <ActionButton
                              label="Print"
                              icon="🖨"
                              onClick={() =>
                                handlePrintInvoice(
                                  c.subscriptionId
                                )
                              }
                              className="
                                bg-indigo-600
                                text-white
                                hover:bg-indigo-700
                              "
                            />

                            <ActionButton
                              label="WhatsApp"
                              icon="📲"
                              onClick={() =>
                                handleWhatsappInvoice(
                                  c.subscriptionId
                                )
                              }
                              className="
                                bg-green-600
                                text-white
                                hover:bg-green-700
                              "
                            />

                            {c.paymentStatus !==
                              "Paid" && (
                              <ActionButton
                                label="Paid"
                                icon="✓"
                                onClick={() =>
                                  handleMarkSubscriptionPaid(
                                    c.subscriptionId
                                  )
                                }
                                className="
                                  bg-emerald-700
                                  text-white
                                  hover:bg-emerald-800
                                "
                              />
                            )}

                          </div>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          </div>
        )}

      </div>

      {/* ========================================
          DRAWER
      ======================================== */}

      <MonthlyBillDrawer
        open={drawerOpen}
        details={selectedBill}
        month={month}
        year={year}
        onMarkPaid={
          handleMarkPaid
        }
        onClose={() =>
          setDrawerOpen(false)
        }
      />

    </div>
  );
}

// ==================================================
// MOBILE REPORT CARD
// ==================================================

function MobileReportCard({
  customer,
  index,
  onView,
  onDownload,
  onPrint,
  onWhatsapp,
  onPaid,
}) {
  const c = customer;

  return (
    <div
      className="
        report-fade
        bg-white
        rounded-3xl
        border border-gray-100
        shadow-sm
        overflow-hidden
        transition-all
        duration-300
        active:scale-[0.99]
      "
      style={{
        animationDelay:
          `${index * 60}ms`,
      }}
    >

      {/* Card Header */}

      <div className="
        p-4
        border-b
        border-gray-100
      ">

        <div className="
          flex
          items-start
          justify-between
          gap-3
        ">

          <div className="
            flex
            items-center
            gap-3
            min-w-0
          ">

            <div className="
              w-12 h-12
              rounded-2xl
              bg-green-100
              flex
              items-center
              justify-center
              text-xl
              flex-shrink-0
            ">
              👤
            </div>

            <div className="min-w-0">

              <h2 className="
                font-black
                text-gray-900
                truncate
              ">
                {c.customerName}
              </h2>

              <p className="
                text-sm
                text-gray-500
                mt-0.5
              ">
                📞 {c.phone}
              </p>

            </div>

          </div>

          <SubscriptionBadge
            status={c.status}
          />

        </div>

      </div>

      {/* Product */}

      <div className="p-4">

        <div className="
          bg-green-50
          border border-green-100
          rounded-2xl
          p-4
        ">

          <div className="
            flex
            items-center
            gap-3
          ">

            <div className="
              w-11 h-11
              rounded-xl
              bg-white
              flex
              items-center
              justify-center
              text-2xl
              shadow-sm
            ">
              🥛
            </div>

            <div className="min-w-0">

              <p className="
                text-xs
                uppercase
                tracking-wide
                text-green-600
                font-black
              ">
                Product
              </p>

              <p className="
                font-black
                text-gray-900
                mt-1
                truncate
              ">
                {c.product}
              </p>

            </div>

          </div>

        </div>

        {/* Metrics */}

        <div className="
          grid
          grid-cols-2
          gap-3
          mt-3
        ">

          <Metric
            label="Quantity"
            value={c.quantity}
            icon="📦"
          />

          <Metric
            label="Delivered"
            value={`${c.deliveredDays} days`}
            icon="🚚"
            positive
          />

          <Metric
            label="Missed"
            value={`${c.missedDays} days`}
            icon="❌"
            negative
          />

          <Metric
            label="Daily Rate"
            value={`₹${Number(
              c.dailyRate
            ).toFixed(2)}`}
            icon="💵"
          />

        </div>

        {/* Bill */}

        <div className="
          mt-3
          rounded-2xl
          bg-emerald-50
          border border-emerald-100
          p-4
        ">

          <div className="
            flex
            items-center
            justify-between
            gap-3
          ">

            <div>

              <p className="
                text-xs
                uppercase
                tracking-wide
                text-gray-500
                font-bold
              ">
                Bill Amount
              </p>

              <p className="
                text-2xl
                font-black
                text-green-700
                mt-1
              ">
                ₹
                {Number(
                  c.billAmount
                ).toFixed(2)}
              </p>

            </div>

            <PaymentBadge
              status={
                c.paymentStatus
              }
            />

          </div>

        </div>

      </div>

      {/* Actions */}

      <div className="
        p-4
        bg-gray-50
        border-t border-gray-100
      ">

        <div className="
          grid
          grid-cols-2
          gap-2
        ">

          <ActionButton
            label="View Bill"
            icon="👁"
            onClick={() =>
              onView(
                c.subscriptionId
              )
            }
            className="
              bg-white
              border
              border-gray-200
              text-gray-700
              hover:bg-gray-100
            "
          />

          <ActionButton
            label="PDF"
            icon="📄"
            onClick={() =>
              onDownload(
                c.subscriptionId
              )
            }
            className="
              bg-red-600
              text-white
              hover:bg-red-700
            "
          />

          <ActionButton
            label="Print"
            icon="🖨"
            onClick={() =>
              onPrint(
                c.subscriptionId
              )
            }
            className="
              bg-indigo-600
              text-white
              hover:bg-indigo-700
            "
          />

          <ActionButton
            label="WhatsApp"
            icon="📲"
            onClick={() =>
              onWhatsapp(
                c.subscriptionId
              )
            }
            className="
              bg-green-600
              text-white
              hover:bg-green-700
            "
          />

        </div>

        {c.paymentStatus !==
          "Paid" && (
          <button
            type="button"
            onClick={() =>
              onPaid(
                c.subscriptionId
              )
            }
            className="
              w-full
              mt-2
              py-3
              rounded-xl
              bg-emerald-700
              hover:bg-emerald-800
              active:scale-95
              text-white
              font-black
              transition-all
            "
          >
            ✓ Mark as Paid
          </button>
        )}

      </div>

    </div>
  );
}

// ==================================================
// STAT
// ==================================================

function ReportStat({
  icon,
  label,
  value,
  delay,
  iconBg,
  valueColor,
}) {
  return (
    <div
      className="
        report-fade
        bg-white
        rounded-3xl
        border border-gray-100
        shadow-sm
        p-4
        sm:p-5
        transition-all
        duration-300
        hover:-translate-y-1
        hover:shadow-lg
      "
      style={{
        animationDelay: delay,
      }}
    >

      <div className="
        flex
        items-center
        justify-between
        gap-2
      ">

        <div className="min-w-0">

          <p className="
            text-xs
            sm:text-sm
            text-gray-500
            font-semibold
          ">
            {label}
          </p>

          <p className={`
            report-number
            text-2xl
            sm:text-3xl
            font-black
            mt-1
            truncate
            ${valueColor}
          `}>
            {value}
          </p>

        </div>

        <div className={`
          w-11 h-11
          sm:w-14 sm:h-14
          rounded-2xl
          flex
          items-center
          justify-center
          text-2xl
          sm:text-3xl
          flex-shrink-0
          ${iconBg}
        `}>
          {icon}
        </div>

      </div>

    </div>
  );
}

// ==================================================
// METRIC
// ==================================================

function Metric({
  label,
  value,
  icon,
  positive,
  negative,
}) {
  return (
    <div className="
      bg-gray-50
      border border-gray-100
      rounded-2xl
      p-3
    ">

      <div className="
        flex
        items-center
        gap-2
      ">

        <span className="text-lg">
          {icon}
        </span>

        <p className="
          text-xs
          text-gray-500
          font-semibold
        ">
          {label}
        </p>

      </div>

      <p className={`
        mt-1
        font-black
        ${
          positive
            ? "text-green-600"
            : negative
            ? "text-red-600"
            : "text-gray-900"
        }
      `}>
        {value}
      </p>

    </div>
  );
}

// ==================================================
// PAYMENT BADGE
// ==================================================

function PaymentBadge({
  status,
}) {
  const paid =
    status === "Paid";

  return (
    <span className={`
      inline-flex
      items-center
      gap-1.5
      px-3
      py-1.5
      rounded-full
      text-xs
      font-black
      ${
        paid
          ? "bg-green-100 text-green-700"
          : "bg-amber-100 text-amber-700"
      }
    `}>
      <span>
        {paid ? "✓" : "●"}
      </span>

      {status || "Pending"}
    </span>
  );
}

// ==================================================
// SUBSCRIPTION BADGE
// ==================================================

function SubscriptionBadge({
  status,
}) {
  const active =
    status === "Active";

  return (
    <span className={`
      inline-flex
      items-center
      gap-1.5
      px-2.5
      py-1.5
      rounded-full
      text-xs
      font-black
      whitespace-nowrap
      ${
        active
          ? "bg-green-100 text-green-700"
          : "bg-red-100 text-red-700"
      }
    `}>
      <span>
        {active ? "●" : "●"}
      </span>

      {status || "-"}
    </span>
  );
}

// ==================================================
// ACTION BUTTON
// ==================================================

function ActionButton({
  label,
  icon,
  onClick,
  className,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        px-3
        py-2.5
        rounded-xl
        text-sm
        font-bold
        transition-all
        duration-200
        active:scale-95
        ${className}
      `}
    >
      {icon} {label}
    </button>
  );
}

// ==================================================
// EMPTY
// ==================================================

function EmptyReport() {
  return (
    <div className="
      report-fade
      bg-white
      rounded-3xl
      border border-gray-100
      shadow-sm
      p-10
      sm:p-16
      text-center
    ">

      <div className="
        text-6xl
        sm:text-7xl
      ">
        📊
      </div>

      <h2 className="
        text-xl
        sm:text-2xl
        font-black
        text-gray-800
        mt-4
      ">
        No Report Found
      </h2>

      <p className="
        text-gray-500
        mt-2
      ">
        No delivery records found for
      </p>

      <p className="
        text-lg
        font-black
        text-green-700
        mt-1
      ">
        No data for the selected month
      </p>

    </div>
  );
}