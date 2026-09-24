import jsPDF from "jspdf";
import html2canvas from "html2canvas";

import logo from "../assets/logo.png";

// ==========================================
// Helpers
// ==========================================

function money(value) {
  const amount = Number(value || 0);

  return `₹${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatShortDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// ==========================================
// Invoice Number
// ==========================================

function getInvoiceNumber(bill) {
  return (
    bill?.invoice_number ||
    bill?.invoiceNumber ||
    `INV-${String(
      bill?.id || ""
    ).slice(0, 8)}`
  );
}

// ==========================================
// Payment
// ==========================================

function getPaymentStatus(bill) {
  return (
    bill?.payment_status ||
    bill?.paymentStatus ||
    "Pending"
  );
}

function getPaymentMethod(bill) {
  return (
    bill?.payment_method ||
    bill?.paymentMethod ||
    "COD"
  );
}

// ==========================================
// Billing Calculations
// ==========================================

function getDeliveredDays(bill) {
  return Number(
    bill?.calculated_delivered_days ??
      bill?.delivered_days ??
      0
  );
}

function getDeliveredAmount(bill) {
  return Number(
    bill?.calculated_delivery_amount ??
      bill?.subtotal ??
      0
  );
}

function getTotalAmount(bill) {
  return Number(
    bill?.calculated_total_amount ??
      bill?.total_amount ??
      0
  );
}

// ==========================================
// Original Subscription Amount
// ==========================================

function getOriginalPlanAmount(bill) {
  return Number(
    bill?.original_plan_amount ??
      bill?.subscription_total_amount ??
      bill?.total_amount ??
      0
  );
}

// ==========================================
// GST / Discount
// ==========================================

function getGstAmount(bill) {
  return Number(
    bill?.gst_amount || 0
  );
}

function getDiscount(bill) {
  return Number(
    bill?.discount || 0
  );
}

function getGstPercent(bill) {
  return Number(
    bill?.gst_percent || 0
  );
}

// ==========================================
// Delivery Status Style
// ==========================================

function getStatusStyle(status) {
  const value = String(
    status || ""
  )
    .trim()
    .toLowerCase();

  if (value === "delivered") {
    return {
      background: "#dcfce7",
      color: "#166534",
    };
  }

  if (value === "assigned") {
    return {
      background: "#fef3c7",
      color: "#92400e",
    };
  }

  if (
    value === "cancelled" ||
    value === "missed"
  ) {
    return {
      background: "#fee2e2",
      color: "#991b1b",
    };
  }

  return {
    background: "#f1f5f9",
    color: "#475569",
  };
}

// ==========================================
// Billing Period
// ==========================================

function getBillingPeriod(bill) {
  const month = Number(
    bill?.billing_month || 0
  );

  const year = Number(
    bill?.billing_year || 0
  );

  if (
    month >= 1 &&
    month <= 12 &&
    year
  ) {
    const date = new Date(
      year,
      month - 1,
      1
    );

    return date.toLocaleDateString(
      "en-IN",
      {
        month: "long",
        year: "numeric",
      }
    );
  }

  if (
    bill?.start_date &&
    bill?.end_date
  ) {
    return `${formatDate(
      bill.start_date
    )} - ${formatDate(
      bill.end_date
    )}`;
  }

  return "-";
}

// ==========================================
// Delivery Rows
// ==========================================

function getDeliveryRows(bill) {
  if (
    !Array.isArray(
      bill?.delivery_rows
    )
  ) {
    return [];
  }

  return bill.delivery_rows;
}
// ==========================================
// Build Invoice HTML
// ==========================================

function buildInvoiceHTML(bill) {
  // ========================================
  // Basic Invoice Information
  // ========================================

  const invoiceNumber =
    getInvoiceNumber(bill);

  const customerName =
    bill?.customer_name || "-";

  const customerPhone =
    bill?.customer_phone || "-";

  const customerEmail =
    bill?.customer_email || "-";

  const productName =
    bill?.product_name ||
    bill?.product ||
    "-";

  const size =
    bill?.size || "-";

  const quantity =
    bill?.quantity ?? 0;

  const frequency =
    bill?.frequency || "-";

  const deliveryTime =
    bill?.delivery_time || "-";

  const paymentMethod =
    getPaymentMethod(bill);

  const paymentStatus =
    getPaymentStatus(bill);

  // ========================================
  // Billing Calculations
  // ========================================

  const deliveredDays =
    getDeliveredDays(bill);

  const deliveredAmount =
    getDeliveredAmount(bill);

  const dailyRate =
    Number(
      bill?.daily_rate ??
        bill?.unit_price ??
        0
    );

  const originalPlanAmount =
    getOriginalPlanAmount(bill);

  const subtotal =
    Number(
      bill?.subtotal ??
        deliveredAmount ??
        0
    );

  const discount =
    getDiscount(bill);

  const gstPercent =
    getGstPercent(bill);

  const gstAmount =
    getGstAmount(bill);

  const totalAmount =
    getTotalAmount(bill);

  // ========================================
  // Address
  // ========================================

  const address =
    bill?.address || null;

  const addressText = address
    ? [
        address.house_no,
        address.street,
        address.area,
        address.city,
        address.state,
        address.pincode,
      ]
        .filter(Boolean)
        .join(", ")
    : bill?.customer_address ||
      "-";

  // ========================================
  // Delivery Rows
  // ========================================

  const deliveryRows =
    getDeliveryRows(bill);

  const deliveryTableRows =
    deliveryRows.length
      ? deliveryRows
          .map((row) => {
            const statusStyle =
              getStatusStyle(
                row.status
              );

            return `
              <tr>

                <td class="delivery-date">
                  ${escapeHtml(
                    formatShortDate(
                      row.delivery_date
                    )
                  )}
                </td>

                <td class="delivery-product">
                  ${escapeHtml(
                    row.product_name ||
                      productName
                  )}

                  ${
                    row.is_extra
                      ? `
                        <span
                          class="extra-badge"
                        >
                          EXTRA
                        </span>
                      `
                      : ""
                  }
                </td>

                <td class="center">
                  ${escapeHtml(
                    row.size || "-"
                  )}
                </td>

                <td class="center">
                  ${escapeHtml(
                    row.quantity ?? 0
                  )}
                </td>

                <td class="right">
                  ${escapeHtml(
                    money(row.rate)
                  )}
                </td>

                <td class="right">
                  ${escapeHtml(
                    money(row.amount)
                  )}
                </td>

                <td class="center">
                  <span
                    class="status-badge"
                    style="
                      background:${statusStyle.background};
                      color:${statusStyle.color};
                    "
                  >
                    ${escapeHtml(
                      row.status ||
                        "Pending"
                    )}
                  </span>
                </td>

              </tr>
            `;
          })
          .join("")
      : `
          <tr>

            <td
              colspan="7"
              class="empty-row"
            >
              No delivery records found
            </td>

          </tr>
        `;

  // ========================================
  // Invoice HTML
  // ========================================

  return `
    <div
      id="farm-fresh-invoice"
      style="
        width:794px;
        min-height:1123px;
        max-width:794px;
        background:#ffffff;
        color:#172033;
        font-family:Arial,Helvetica,sans-serif;
        box-sizing:border-box;
        overflow:hidden;
      "
    >

      <!-- ==================================
           HEADER
      =================================== -->

      <div
        class="invoice-header"
      >

        <div
          class="brand-section"
        >

          <div
            class="logo-container"
          >

            <img
              src="${logo}"
              alt="Farm Fresh Dairy"
            />

          </div>

          <div>

            <div
              class="brand-name"
            >
              FARM FRESH DAIRY
            </div>

            <div
              class="brand-tagline"
            >
              Fresh Buffalo Milk &amp;
              Dairy Products
            </div>

          </div>

        </div>

        <div
          class="invoice-heading"
        >

          <div>
            INVOICE
          </div>

          <span>
            ${escapeHtml(
              invoiceNumber
            )}
          </span>

        </div>

      </div>

      <!-- ==================================
           MAIN BODY
      =================================== -->

      <div
        class="invoice-content"
      >

        <!-- ==================================
             CUSTOMER + BILLING
        =================================== -->

        <div
          class="customer-billing-grid"
        >

          <!-- BILL TO -->

          <div
            class="information-card"
          >

            <div
              class="section-title"
            >
              BILL TO
            </div>

            <div
              class="customer-name"
            >
              ${escapeHtml(
                customerName
              )}
            </div>

            <div
              class="information-line"
            >
              <strong>
                Mobile:
              </strong>

              <span>
                ${escapeHtml(
                  customerPhone
                )}
              </span>
            </div>

            <div
              class="information-line"
            >
              <strong>
                Email:
              </strong>

              <span>
                ${escapeHtml(
                  customerEmail
                )}
              </span>
            </div>

            <div
              class="information-line address"
            >
              <strong>
                Address:
              </strong>

              <span>
                ${escapeHtml(
                  addressText
                )}
              </span>
            </div>

          </div>


          <!-- BILLING DETAILS -->

          <div
            class="information-card"
          >

            <div
              class="section-title"
            >
              BILLING DETAILS
            </div>

            <div
              class="billing-line"
            >

              <span>
                Invoice Date
              </span>

              <strong>
                ${escapeHtml(
                  formatDate(
                    bill?.invoice_date
                  )
                )}
              </strong>

            </div>

            <div
              class="billing-line"
            >

              <span>
                Billing Period
              </span>

              <strong>
                ${escapeHtml(
                  getBillingPeriod(
                    bill
                  )
                )}
              </strong>

            </div>

            <div
              class="billing-line"
            >

              <span>
                Payment Method
              </span>

              <strong>
                ${escapeHtml(
                  paymentMethod
                )}
              </strong>

            </div>

            <div
              class="billing-line"
            >

              <span>
                Payment Status
              </span>

              <strong
                class="payment-status"
              >
                ${escapeHtml(
                  paymentStatus
                )}
              </strong>

            </div>

          </div>

        </div>


        <!-- ==================================
             SUBSCRIPTION DETAILS
        =================================== -->

        <div
          class="section-container"
        >

          <div
            class="section-heading"
          >
            SUBSCRIPTION DETAILS
          </div>

          <div
            class="subscription-grid"
          >

            <div
              class="subscription-item product-item"
            >

              <span>
                PRODUCT
              </span>

              <strong>
                ${escapeHtml(
                  productName
                )}
              </strong>

            </div>

            <div
              class="subscription-item"
            >

              <span>
                SIZE
              </span>

              <strong>
                ${escapeHtml(
                  size
                )}
              </strong>

            </div>

            <div
              class="subscription-item"
            >

              <span>
                QUANTITY
              </span>

              <strong>
                ${escapeHtml(
                  quantity
                )}
              </strong>

            </div>

            <div
              class="subscription-item"
            >

              <span>
                DAILY RATE
              </span>

              <strong>
                ${escapeHtml(
                  money(
                    dailyRate
                  )
                )}
              </strong>

            </div>

            <div
              class="subscription-item"
            >

              <span>
                FREQUENCY
              </span>

              <strong>
                ${escapeHtml(
                  frequency
                )}
              </strong>

            </div>

            <div
              class="subscription-item"
            >

              <span>
                DELIVERY
              </span>

              <strong>
                ${escapeHtml(
                  deliveryTime
                )}
              </strong>

            </div>

            <div
              class="subscription-item"
            >

              <span>
                START DATE
              </span>

              <strong>
                ${escapeHtml(
                  formatDate(
                    bill?.start_date
                  )
                )}
              </strong>

            </div>

            <div
              class="subscription-item"
            >

              <span>
                END DATE
              </span>

              <strong>
                ${escapeHtml(
                  formatDate(
                    bill?.end_date
                  )
                )}
              </strong>

            </div>

          </div>

        </div>


        <!-- ==================================
             DELIVERY DETAILS
        =================================== -->

        <div
          class="section-container delivery-container"
        >

          <div
            class="section-heading"
          >
            DELIVERY DETAILS
          </div>

          <table
            class="delivery-table"
          >

            <thead>

              <tr>

                <th>
                  DATE
                </th>

                <th>
                  PRODUCT
                </th>

                <th>
                  SIZE
                </th>

                <th>
                  QTY
                </th>

                <th>
                  RATE
                </th>

                <th>
                  AMOUNT
                </th>

                <th>
                  STATUS
                </th>

              </tr>

            </thead>

            <tbody>

              ${deliveryTableRows}

            </tbody>

          </table>

        </div>


        <!-- ==================================
             BILLING SUMMARY
        =================================== -->

        <div
          class="billing-summary-container"
        >

          <div
            class="billing-summary"
          >

            <div
              class="summary-row"
            >

              <span>
                Delivered Days
              </span>

              <strong>
                ${escapeHtml(
                  deliveredDays
                )}
              </strong>

            </div>

            <div
              class="summary-row"
            >

              <span>
                Delivered Amount
              </span>

              <strong>
                ${escapeHtml(
                  money(
                    deliveredAmount
                  )
                )}
              </strong>

            </div>

            <div
              class="summary-row"
            >

              <span>
                Subtotal
              </span>

              <strong>
                ${escapeHtml(
                  money(
                    subtotal
                  )
                )}
              </strong>

            </div>

            ${
              discount > 0
                ? `
                  <div
                    class="summary-row"
                  >

                    <span>
                      Discount
                    </span>

                    <strong>
                      -${escapeHtml(
                        money(
                          discount
                        )
                      )}
                    </strong>

                  </div>
                `
                : ""
            }

            ${
              gstAmount > 0
                ? `
                  <div
                    class="summary-row"
                  >

                    <span>
                      GST ${
                        gstPercent
                          ? `(${escapeHtml(
                              gstPercent
                            )}%)`
                          : ""
                      }
                    </span>

                    <strong>
                      ${escapeHtml(
                        money(
                          gstAmount
                        )
                      )}
                    </strong>

                  </div>
                `
                : ""
            }


            <!-- CURRENT OUTSTANDING -->

            <div
              class="current-outstanding"
            >

              <span>
                CURRENT OUTSTANDING
              </span>

              <strong>
                ${escapeHtml(
                  money(
                    totalAmount
                  )
                )}
              </strong>

            </div>

          </div>

        </div>


        <!-- ==================================
             PLAN INFORMATION
        =================================== -->

        <div
          class="plan-information"
        >

          <div
            class="plan-title"
          >
            SUBSCRIPTION PLAN INFORMATION
          </div>

          <div
            class="plan-amount"
          >

            Original subscription
            plan amount:

            <strong>
              ${escapeHtml(
                money(
                  originalPlanAmount
                )
              )}
            </strong>

          </div>

          <div
            class="plan-description"
          >

            Postpaid billing is calculated
            only from successfully delivered
            quantities. Pending and assigned
            deliveries are not included in the
            current outstanding amount.

          </div>

        </div>

      </div>


      <!-- ==================================
           FOOTER
      =================================== -->

      <div
        class="invoice-footer"
      >

        <strong>
          Thank you for choosing
          Farm Fresh Dairy!
        </strong>

        <span>
          Fresh • Pure • Delivered Daily
        </span>

        <span>
          This is a computer-generated invoice.
        </span>

      </div>


      <!-- ==================================
           STYLES
      =================================== -->

      <style>

        * {
          box-sizing: border-box;
        }

        #farm-fresh-invoice {
          width: 794px;
          min-height: 1123px;
          max-width: 794px;
          overflow: hidden;
          background: #ffffff;
        }

        /* ================================
           HEADER
        ================================= */

        .invoice-header {
          width: 794px;
          height: 118px;

          padding: 20px 30px;

          background: #15803d;
          color: #ffffff;

          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .brand-section {
          display: flex;
          align-items: center;
          gap: 15px;

          min-width: 0;
        }

        .logo-container {
          width: 66px;
          height: 66px;

          flex: 0 0 66px;

          border-radius: 11px;

          background: #ffffff;

          display: flex;
          align-items: center;
          justify-content: center;

          overflow: hidden;
        }

        .logo-container img {
          width: 56px;
          height: 56px;

          object-fit: contain;
        }

        .brand-name {
          font-size: 25px;
          font-weight: 800;

          letter-spacing: -0.4px;

          white-space: nowrap;
        }

        .brand-tagline {
          margin-top: 5px;

          font-size: 11px;

          opacity: 0.92;
        }

        .invoice-heading {
          flex: 0 0 150px;

          text-align: right;

          font-size: 24px;
          font-weight: 800;
        }

        .invoice-heading span {
          display: block;

          margin-top: 7px;

          font-size: 11px;
          font-weight: 500;
        }


        /* ================================
           CONTENT
        ================================= */

        .invoice-content {
          width: 794px;

          padding: 18px 30px 16px;
        }


        /* ================================
           CUSTOMER / BILLING
        ================================= */

        .customer-billing-grid {
          width: 100%;

          display: grid;

          grid-template-columns:
            1fr 1fr;

          gap: 16px;
        }

        .information-card {
          min-height: 126px;

          padding: 12px 14px;

          border:
            1px solid #dbe3ea;

          border-radius: 9px;

          background: #f8fafc;
        }

        .section-title {
          margin-bottom: 7px;

          color: #15803d;

          font-size: 10px;

          font-weight: 800;

          letter-spacing: 0.65px;
        }

        .customer-name {
          margin-bottom: 7px;

          color: #172033;

          font-size: 15px;
          font-weight: 800;
        }

        .information-line {
          display: flex;

          gap: 5px;

          color: #475569;

          font-size: 10px;

          line-height: 1.55;
        }

        .information-line strong {
          flex: 0 0 auto;

          color: #172033;
        }

        .information-line.address {
          align-items: flex-start;
        }

        .information-line.address span {
          overflow-wrap: anywhere;
        }

        .billing-line {
          display: flex;

          align-items: center;

          justify-content:
            space-between;

          gap: 10px;

          padding: 3px 0;

          color: #64748b;

          font-size: 10px;
        }

        .billing-line strong {
          color: #172033;

          text-align: right;
        }

        .payment-status {
          text-transform: uppercase;
        }


        /* ================================
           SECTIONS
        ================================= */

        .section-container {
          width: 100%;

          margin-top: 15px;
        }

        .section-heading {
          margin-bottom: 7px;

          color: #15803d;

          font-size: 10px;

          font-weight: 800;

          letter-spacing: 0.65px;
        }


        /* ================================
           SUBSCRIPTION
        ================================= */

        .subscription-grid {
          width: 100%;

          display: grid;

          grid-template-columns:
            1.7fr
            0.8fr
            0.8fr
            1fr;

          gap: 7px;
        }

        .subscription-item {
          min-height: 47px;

          padding: 7px 9px;

          border:
            1px solid #e2e8f0;

          border-radius: 7px;

          background: #ffffff;
        }

        .subscription-item span {
          display: block;

          margin-bottom: 4px;

          color: #64748b;

          font-size: 8px;

          font-weight: 700;

          letter-spacing: 0.35px;
        }

        .subscription-item strong {
          display: block;

          color: #172033;

          font-size: 10px;

          white-space: nowrap;
        }


        /* ================================
           DELIVERY TABLE
        ================================= */

        .delivery-container {
          margin-top: 16px;
        }

        .delivery-table {
          width: 100%;

          max-width: 100%;

          table-layout: fixed;

          border-collapse: collapse;

          font-size: 9px;
        }

        .delivery-table th {
          padding: 7px 5px;

          border:
            1px solid #15803d;

          background: #15803d;

          color: #ffffff;

          font-size: 8px;

          font-weight: 800;

          text-align: left;
        }

        .delivery-table td {
          padding: 7px 5px;

          border:
            1px solid #dbe3ea;

          color: #334155;

          vertical-align: middle;
        }

        .delivery-table
          tr:nth-child(even)
          td {
          background: #f8fafc;
        }

        /* Column widths */

        .delivery-table th:nth-child(1),
        .delivery-table td:nth-child(1) {
          width: 14%;
        }

        .delivery-table th:nth-child(2),
        .delivery-table td:nth-child(2) {
          width: 28%;
        }

        .delivery-table th:nth-child(3),
        .delivery-table td:nth-child(3) {
          width: 9%;
        }

        .delivery-table th:nth-child(4),
        .delivery-table td:nth-child(4) {
          width: 7%;
        }

        .delivery-table th:nth-child(5),
        .delivery-table td:nth-child(5) {
          width: 13%;
        }

        .delivery-table th:nth-child(6),
        .delivery-table td:nth-child(6) {
          width: 13%;
        }

        .delivery-table th:nth-child(7),
        .delivery-table td:nth-child(7) {
          width: 16%;
        }

        .delivery-date {
          white-space: nowrap;
        }

        .delivery-product {
          overflow-wrap: anywhere;
        }

        .center {
          text-align: center !important;
        }

        .right {
          text-align: right !important;
        }

        .status-badge {
          display: inline-block;

          padding: 3px 5px;

          border-radius: 999px;

          font-size: 7px;

          font-weight: 800;

          white-space: nowrap;
        }

        .extra-badge {
          display: inline-block;

          margin-left: 3px;

          padding: 2px 3px;

          border-radius: 3px;

          background: #ffedd5;

          color: #9a3412;

          font-size: 6px;

          font-weight: 800;
        }

        .empty-row {
          padding: 14px !important;

          color: #64748b !important;

          text-align: center;
        }


        /* ================================
           BILLING SUMMARY
        ================================= */

        .billing-summary-container {
          width: 100%;

          margin-top: 14px;

          display: flex;

          justify-content: flex-end;
        }

        .billing-summary {
          width: 330px;

          border:
            1px solid #dbe3ea;

          border-radius: 9px;

          overflow: hidden;
        }

        .summary-row {
          display: flex;

          align-items: center;

          justify-content:
            space-between;

          padding: 7px 12px;

          border-bottom:
            1px solid #e2e8f0;

          color: #475569;

          font-size: 10px;
        }

        .summary-row strong {
          color: #172033;
        }

        .current-outstanding {
          display: flex;

          align-items: center;

          justify-content:
            space-between;

          padding: 11px 13px;

          background: #15803d;

          color: #ffffff;
        }

        .current-outstanding span {
          font-size: 10px;

          font-weight: 800;
        }

        .current-outstanding strong {
          font-size: 18px;
        }


        /* ================================
           PLAN INFORMATION
        ================================= */

        .plan-information {
          width: 100%;

          margin-top: 14px;

          padding: 10px 13px;

          border:
            1px solid #bbf7d0;

          border-radius: 8px;

          background: #f0fdf4;
        }

        .plan-title {
          color: #166534;

          font-size: 9px;

          font-weight: 800;

          letter-spacing: 0.5px;
        }

        .plan-amount {
          margin-top: 5px;

          color: #475569;

          font-size: 9.5px;
        }

        .plan-amount strong {
          color: #172033;
        }

        .plan-description {
          margin-top: 4px;

          color: #64748b;

          font-size: 8.5px;

          line-height: 1.35;
        }


        /* ================================
           FOOTER
        ================================= */

        .invoice-footer {
          width: 794px;

          padding: 12px 30px 14px;

          border-top:
            1px solid #e2e8f0;

          background: #f8fafc;

          color: #64748b;

          font-size: 8.5px;

          line-height: 1.5;

          text-align: center;
        }

        .invoice-footer strong {
          display: block;

          color: #334155;

          font-size: 9.5px;
        }

        .invoice-footer span {
          display: block;
        }

      </style>
  `;
}
// ==========================================
// Wait For Images
// ==========================================

async function waitForImages(
  element
) {
  const images =
    Array.from(
      element.querySelectorAll("img")
    );

  if (!images.length) {
    return;
  }

  await Promise.all(
    images.map(
      (image) =>
        new Promise((resolve) => {
          // Already loaded
          if (image.complete) {
            resolve();
            return;
          }

          image.onload = () => resolve();

          image.onerror = () => resolve();
        })
    )
  );
}


// ==========================================
// Create Temporary Invoice Element
// ==========================================

function createInvoiceElement(
  bill
) {
  if (!bill) {
    throw new Error(
      "Invoice data is missing."
    );
  }

  const wrapper =
    document.createElement("div");

  wrapper.innerHTML =
    buildInvoiceHTML(bill);

  const invoice =
    wrapper.firstElementChild;

  if (!invoice) {
    throw new Error(
      "Unable to create invoice element."
    );
  }

  // Keep the invoice outside the visible page.
  invoice.style.position =
    "absolute";

  invoice.style.left =
    "-100000px";

  invoice.style.top =
    "0";

  invoice.style.width =
    "794px";

  invoice.style.minHeight =
    "1123px";

  invoice.style.background =
    "#ffffff";

  invoice.style.zIndex =
    "-1";

  document.body.appendChild(
    invoice
  );

  return invoice;
}


// ==========================================
// Create Invoice Canvas
// ==========================================

async function createInvoiceCanvas(
  bill
) {
  const invoice =
    createInvoiceElement(bill);

  try {
    // Wait for logo and other images.
    await waitForImages(
      invoice
    );

    // Give browser time to calculate
    // the complete invoice layout.
    await new Promise(
      (resolve) =>
        setTimeout(
          resolve,
          150
        )
    );

    const canvas =
      await html2canvas(
        invoice,
        {
          scale: 2,

          useCORS: true,

          allowTaint: true,

          backgroundColor:
            "#ffffff",

          logging: false,

          imageTimeout: 15000,

          windowWidth: 794,

          windowHeight: 1123,

          scrollX: 0,

          scrollY: 0,
        }
      );

    return canvas;
  } finally {
    // Always remove temporary invoice
    // after rendering.
    invoice.remove();
  }
}


// ==========================================
// Canvas -> PDF
// ==========================================

function canvasToPDF(
  canvas
) {
  if (!canvas) {
    throw new Error(
      "Invoice canvas is missing."
    );
  }

  const pdf =
    new jsPDF({
      orientation:
        "portrait",

      unit: "mm",

      format: "a4",

      compress: true,
    });

  const pageWidth =
    pdf.internal.pageSize.getWidth();

  const pageHeight =
    pdf.internal.pageSize.getHeight();

  const margin = 4;

  const usableWidth =
    pageWidth -
    margin * 2;

  const usableHeight =
    pageHeight -
    margin * 2;

  const imageWidth =
    usableWidth;

  const fullImageHeight =
    (canvas.height *
      imageWidth) /
    canvas.width;

  /*
   * The invoice is normally one A4 page.
   *
   * If the delivery list becomes long,
   * this automatically creates additional
   * PDF pages instead of cutting content.
   */

  const pages =
    Math.max(
      1,
      Math.ceil(
        fullImageHeight /
          usableHeight
      )
    );

  for (
    let page = 0;
    page < pages;
    page++
  ) {
    if (page > 0) {
      pdf.addPage();
    }

    const sourceY =
      Math.floor(
        (page *
          usableHeight *
          canvas.width) /
          imageWidth
      );

    const sourceHeight =
      Math.min(
        Math.floor(
          (usableHeight *
            canvas.width) /
            imageWidth
        ),

        canvas.height -
          sourceY
      );

    if (
      sourceHeight <= 0
    ) {
      continue;
    }

    const pageCanvas =
      document.createElement(
        "canvas"
      );

    pageCanvas.width =
      canvas.width;

    pageCanvas.height =
      sourceHeight;

    const context =
      pageCanvas.getContext(
        "2d"
      );

    if (!context) {
      throw new Error(
        "Unable to create PDF canvas."
      );
    }

    context.fillStyle =
      "#ffffff";

    context.fillRect(
      0,
      0,
      pageCanvas.width,
      pageCanvas.height
    );

    context.drawImage(
      canvas,

      0,
      sourceY,

      canvas.width,
      sourceHeight,

      0,
      0,

      canvas.width,
      sourceHeight
    );

    const imageData =
      pageCanvas.toDataURL(
        "image/jpeg",
        0.95
      );

    const renderedHeight =
      (sourceHeight *
        imageWidth) /
      canvas.width;

    pdf.addImage(
      imageData,

      "JPEG",

      margin,
      margin,

      imageWidth,
      renderedHeight,

      undefined,

      "FAST"
    );
  }

  return pdf;
}


// ==========================================
// Generate Invoice PDF
// ==========================================

async function generateInvoicePDF(
  bill
) {
  if (!bill) {
    throw new Error(
      "Invoice data is missing."
    );
  }

  const canvas =
    await createInvoiceCanvas(
      bill
    );

  return canvasToPDF(
    canvas
  );
}


// ==========================================
// Download Invoice PDF
// ==========================================

export async function downloadInvoicePDF(
  bill
) {
  try {
    const pdf =
      await generateInvoicePDF(
        bill
      );

    const invoiceNumber =
      getInvoiceNumber(bill);

    const filename =
      `FarmFreshDairy-${invoiceNumber}.pdf`;

    pdf.save(filename);

    return {
      success: true,
      filename,
    };
  } catch (error) {
    console.error(
      "Invoice PDF download error:",
      error
    );

    throw error;
  }
}


// ==========================================
// Share Invoice PDF
// ==========================================

export async function shareInvoicePDF(
  bill
) {
  try {
    const pdf =
      await generateInvoicePDF(
        bill
      );

    const invoiceNumber =
      getInvoiceNumber(bill);

    const filename =
      `FarmFreshDairy-${invoiceNumber}.pdf`;

    const blob =
      pdf.output("blob");

    const file =
      new File(
        [blob],
        filename,
        {
          type:
            "application/pdf",
        }
      );

    // --------------------------------------
    // Native mobile/browser sharing
    // --------------------------------------

    if (
      navigator.share &&
      navigator.canShare &&
      navigator.canShare({
        files: [file],
      })
    ) {
      await navigator.share({
        title:
          `Farm Fresh Dairy - ${invoiceNumber}`,

        text:
          `Farm Fresh Dairy invoice ${invoiceNumber}`,

        files: [file],
      });

      return {
        success: true,
        shared: true,
      };
    }

    // --------------------------------------
    // Fallback
    // --------------------------------------

    pdf.save(filename);

    return {
      success: true,
      shared: false,
      downloaded: true,
    };
  } catch (error) {
    // User cancelled the native share dialog.
    if (
      error?.name ===
      "AbortError"
    ) {
      return {
        success: false,
        cancelled: true,
      };
    }

    console.error(
      "Invoice PDF share error:",
      error
    );

    throw error;
  }
}


// ==========================================
// Print Invoice
// ==========================================

export async function printInvoice(
  bill
) {
  if (!bill) {
    throw new Error(
      "Invoice data is missing."
    );
  }

  try {
    const canvas =
      await createInvoiceCanvas(
        bill
      );

    const imageData =
      canvas.toDataURL(
        "image/png"
      );

    const invoiceNumber =
      getInvoiceNumber(bill);

    const printWindow =
      window.open(
        "",
        "_blank",
        "width=900,height=1100"
      );

    if (!printWindow) {
      throw new Error(
        "Popup was blocked. Please allow popups to print the invoice."
      );
    }

    printWindow.document.open();

    printWindow.document.write(`
      <!DOCTYPE html>

      <html>

        <head>

          <meta
            charset="UTF-8"
          />

          <title>
            Farm Fresh Dairy -
            ${escapeHtml(
              invoiceNumber
            )}
          </title>

          <style>

            @page {
              size: A4;
              margin: 0;
            }

            html,
            body {
              margin: 0;
              padding: 0;
              width: 100%;
              background: #ffffff;
            }

            body {
              display: flex;
              justify-content: center;
              align-items: flex-start;
            }

            .print-page {
              width: 210mm;
              margin: 0;
              padding: 0;
            }

            .print-page img {
              display: block;
              width: 210mm;
              height: auto;
              margin: 0;
              padding: 0;
            }

            @media print {

              html,
              body {
                width: 210mm;
                margin: 0;
                padding: 0;
              }

              .print-page {
                width: 210mm;
                margin: 0;
                padding: 0;
              }

              .print-page img {
                width: 210mm;
                height: auto;
              }

            }

          </style>

        </head>

        <body>

          <div
            class="print-page"
          >

            <img
              src="${imageData}"
              alt="Farm Fresh Dairy Invoice"
            />

          </div>

          <script>

            window.onload =
              function () {

                setTimeout(
                  function () {

                    window.focus();

                    window.print();

                  },
                  500
                );

              };

          <\/script>

        </body>

      </html>
    `);

    printWindow.document.close();

    return {
      success: true,
    };
  } catch (error) {
    console.error(
      "Invoice print error:",
      error
    );

    throw error;
  }
}


// ==========================================
// Default Export
// ==========================================

export default {
  downloadInvoicePDF,
  shareInvoicePDF,
  printInvoice,
};