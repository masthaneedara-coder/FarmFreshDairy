import { useEffect, useMemo, useState } from "react";

import {
  getAllOrders,
  updatePaymentStatus,
} from "../services/adminOrderService";

import { updateOrderStatus } from "../services/adminOrderService";

import OrderFilters from "../Components/admin/OrderFilters";
import OrdersTable from "../Components/admin/OrdersTable";
import OrdersCards from "./OrdersCards";

import OrderDetailsDrawer from "../Components/admin/OrderDetailsDrawer";
import AssignDeliveryBoyModal from "../Components/admin/AssignDeliveryBoyModal";
import ReceivePaymentModal from "../Components/admin/ReceivePaymentModal";

import { getAdminId } from "../config/auth";

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

const ORDERS_PER_PAGE = 10;

  const [paymentOpen, setPaymentOpen] =
    useState(false);

  const [selectedPaymentOrder, setSelectedPaymentOrder] =
    useState(null);

  const [selectedOrder, setSelectedOrder] =
    useState(null);

  const [drawerOpen, setDrawerOpen] =
    useState(false);

  const [assignOpen, setAssignOpen] =
    useState(false);

  // ==========================================
  // LOAD ORDERS
  // ==========================================

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    try {
      setLoading(true);

      const data = await getAllOrders();

      setOrders(data || []);
    } catch (err) {
      console.error(err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  // ==========================================
  // UPDATE ORDER STATUS
  // ==========================================

  const handleStatusChange = async (
    orderId,
    newStatus
  ) => {
    try {
      await updateOrderStatus(
        orderId,
        newStatus
      );

      alert(
        "Order status updated successfully."
      );

      await loadOrders();
    } catch (err) {
      console.error(err);

      alert(
        "Failed to update order status."
      );
    }
  };

  // ==========================================
  // RECEIVE PAYMENT
  // ==========================================

  const handleReceivePayment = (order) => {
    setSelectedPaymentOrder(order);
    setPaymentOpen(true);
  };

  const handleConfirmPayment = async (
    paymentData
  ) => {
    try {
      await updatePaymentStatus(
        selectedPaymentOrder.id,
        {
          ...paymentData,
          received_by: getAdminId(),
        }
      );

      alert(
        "Payment received successfully."
      );

      setPaymentOpen(false);
      setSelectedPaymentOrder(null);

      await loadOrders();
    } catch (err) {
      console.error(err);

      alert(err.message);
    }
  };

  // ==========================================
  // MARK PAID
  // ==========================================

  const handlePaymentPaid = async (
    order
  ) => {
    try {
      await updatePaymentStatus(
        order.id,
        {
          payment_status: "Paid",
          payment_method:
            order.payment_method,
          transaction_id: "",
          received_by: getAdminId(),
        }
      );

      alert(
        "Payment updated successfully."
      );

      await loadOrders();
    } catch (err) {
      console.error(err);

      alert(err.message);
    }
  };

  // ==========================================
  // VIEW
  // ==========================================

  const handleView = (order) => {
    setSelectedOrder(order);
    setDrawerOpen(true);
  };

  // ==========================================
  // ASSIGN
  // ==========================================

  const handleAssign = (order) => {
    setSelectedOrder(order);
    setAssignOpen(true);
  };

  // ==========================================
  // FILTER
  // ==========================================

  const filtered = useMemo(() => {
    const keyword =
      search.trim().toLowerCase();

    return (orders || []).filter(
      (order) => {
        const text = `
          ${order.order_number || ""}
          ${order.customer_name || ""}
          ${order.phone || ""}
        `.toLowerCase();

        return (
          text.includes(keyword) &&
          (status === "" ||
            order.status === status)
        );
      }
    );
  }, [orders, search, status]);
  useEffect(() => {
  setCurrentPage(1);
}, [search, status]);
const totalPages = Math.ceil(
  filtered.length / ORDERS_PER_PAGE
);

const startIndex =
  (currentPage - 1) * ORDERS_PER_PAGE;

const paginatedOrders = filtered.slice(
  startIndex,
  startIndex + ORDERS_PER_PAGE
);

  // ==========================================
  // STATS
  // ==========================================

  const stats = useMemo(() => {
    const total = filtered.length;

    const pending = filtered.filter(
      (order) =>
        order.status === "Pending"
    ).length;

    const delivered = filtered.filter(
      (order) =>
        order.status === "Delivered"
    ).length;

    const paid = filtered.filter(
      (order) =>
        order.payment_status === "Paid"
    ).length;

    return {
      total,
      pending,
      delivered,
      paid,
    };
  }, [filtered]);

  // ==========================================
  // LOADING
  // ==========================================

  if (loading && orders.length === 0) {
    return (
      <div className="
        min-h-screen
        bg-slate-50
        p-3
        sm:p-5
        lg:p-6
      ">

        <style>{`
          @keyframes orderSkeleton {
            0%, 100% {
              opacity: .45;
            }
            50% {
              opacity: 1;
            }
          }

          .order-skeleton {
            animation:
              orderSkeleton
              1.2s
              ease-in-out
              infinite;
          }
        `}</style>

        <div className="max-w-[1600px] mx-auto">

          <div className="
            h-10
            w-64
            bg-gray-200
            rounded-xl
            order-skeleton
          " />

          <div className="
            h-5
            w-48
            bg-gray-200
            rounded-lg
            mt-3
            order-skeleton
          " />

          <div className="
            grid
            grid-cols-2
            lg:grid-cols-4
            gap-3
            mt-6
          ">

            {[1, 2, 3, 4].map(
              (item) => (
                <div
                  key={item}
                  className="
                    h-28
                    bg-white
                    rounded-3xl
                    shadow-sm
                    order-skeleton
                  "
                />
              )
            )}

          </div>

          <div className="
            h-24
            bg-white
            rounded-3xl
            mt-5
            order-skeleton
          " />

          <div className="
            space-y-4
            mt-5
          ">

            {[1, 2, 3].map(
              (item) => (
                <div
                  key={item}
                  className="
                    h-48
                    bg-white
                    rounded-3xl
                    order-skeleton
                  "
                />
              )
            )}

          </div>

        </div>

      </div>
    );
  }

  return (
    <div className="
      min-h-screen
      bg-slate-50
      p-3
      sm:p-5
      lg:p-6
    ">

      {/* ========================================
          ANIMATIONS
      ======================================== */}

      <style>{`
        @keyframes orderHeader {
          from {
            opacity: 0;
            transform: translateY(-14px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes orderFadeUp {
          from {
            opacity: 0;
            transform: translateY(18px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes orderScale {
          from {
            opacity: 0;
            transform: scale(.94);
          }

          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .order-header-animation {
          animation:
            orderHeader
            .45s
            ease-out
            both;
        }

        .order-animation {
          animation:
            orderFadeUp
            .45s
            ease-out
            both;
        }

        .order-stat-animation {
          animation:
            orderScale
            .4s
            ease-out
            both;
        }
      `}</style>

      <div className="
        max-w-[1600px]
        mx-auto
      ">

        {/* ========================================
            HEADER
        ======================================== */}

        <div className="
          order-header-animation
          mb-5
        ">

          <div className="
            flex
            flex-col
            lg:flex-row
            lg:items-center
            lg:justify-between
            gap-4
          ">

            <div>

              <div className="
                flex
                items-center
                gap-3
              ">

                <div className="
                  w-12
                  h-12
                  sm:w-14
                  sm:h-14
                  rounded-2xl
                  bg-green-100
                  flex
                  items-center
                  justify-center
                  text-2xl
                  sm:text-3xl
                  shadow-sm
                ">
                  🛍️
                </div>

                <div>

                  <h1 className="
                    text-2xl
                    sm:text-3xl
                    lg:text-4xl
                    font-black
                    text-gray-900
                  ">
                    Order Management
                  </h1>

                  <p className="
                    text-sm
                    sm:text-base
                    text-gray-500
                    mt-1
                  ">
                    Manage customer orders,
                    payments and deliveries
                  </p>

                </div>

              </div>

            </div>

            {/* Refresh */}

            <button
              type="button"
              onClick={loadOrders}
              disabled={loading}
              className="
                w-full
                lg:w-auto
                px-5
                py-3.5
                rounded-2xl
                bg-green-600
                hover:bg-green-700
                active:scale-95
                text-white
                font-black
                shadow-lg
                shadow-green-600/20
                transition-all
                duration-200
                disabled:bg-gray-400
              "
            >
              {loading
                ? "⏳ Refreshing..."
                : "🔄 Refresh Orders"}
            </button>

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

          <OrderStat
            icon="📦"
            label="Total Orders"
            value={stats.total}
            delay="0ms"
            bg="bg-green-50"
            color="text-green-700"
          />

          <OrderStat
            icon="⏳"
            label="Pending"
            value={stats.pending}
            delay="70ms"
            bg="bg-amber-50"
            color="text-amber-700"
          />

          <OrderStat
            icon="🚚"
            label="Delivered"
            value={stats.delivered}
            delay="140ms"
            bg="bg-blue-50"
            color="text-blue-700"
          />

          <OrderStat
            icon="💰"
            label="Paid"
            value={stats.paid}
            delay="210ms"
            bg="bg-emerald-50"
            color="text-emerald-700"
          />

        </div>

        {/* ========================================
            FILTER AREA
        ======================================== */}

        <div className="
          order-animation
          bg-white
          rounded-3xl
          border
          border-gray-100
          shadow-sm
          p-3
          sm:p-4
          mb-5
        ">

          <OrderFilters
            search={search}
            setSearch={setSearch}
            status={status}
            setStatus={setStatus}
          />

        </div>

        {/* ========================================
            RESULT INFO
        ======================================== */}

        <div className="
          order-animation
          flex
          items-center
          justify-between
          gap-3
          mb-4
          px-1
        ">

          <div>

            <p className="
              text-xs
              uppercase
              tracking-wide
              text-gray-400
              font-bold
            ">
              Orders
            </p>

            <p className="
              text-lg
              sm:text-xl
              font-black
              text-gray-900
            ">
              {filtered.length}{" "}
              {filtered.length === 1
                ? "Order"
                : "Orders"}
            </p>

          </div>

          {(search || status) && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatus("");
              }}
              className="
                px-3
                py-2
                rounded-xl
                bg-white
                border
                border-gray-200
                text-sm
                font-bold
                text-gray-600
                hover:bg-gray-100
                active:scale-95
                transition-all
              "
            >
              Clear Filters
            </button>
          )}

        </div>

        {/* ========================================
            DESKTOP
        ======================================== */}

        <div className="
          hidden
          lg:block
          order-animation
        ">

          <div className="
            bg-white
            rounded-3xl
            border
            border-gray-100
            shadow-sm
            overflow-hidden
          ">

            <OrdersTable
              orders={paginatedOrders}
              onView={handleView}
              onAssign={handleAssign}
              onStatusChange={
                handleStatusChange
              }
              onReceivePayment={
                handleReceivePayment
              }
              onPaymentPaid={
                handlePaymentPaid
              }
            />

          </div>

        </div>

        {/* ========================================
            MOBILE + TABLET
        ======================================== */}

        <div className="
          lg:hidden
          order-animation
        ">

          <OrdersCards
             orders={paginatedOrders}
            onView={handleView}
            onAssign={handleAssign}
            onStatusChange={
              handleStatusChange
            }
            onReceivePayment={
              handleReceivePayment
            }
            onPaymentPaid={
              handlePaymentPaid
            }
          />

        </div>

      </div>

      {/* ========================================
          ORDER DETAILS
      ======================================== */}

      <OrderDetailsDrawer
        open={drawerOpen}
        order={selectedOrder}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedOrder(null);
        }}
      />
      {/* ========================================
    PAGINATION
======================================== */}

{!loading && filtered.length > 0 && (
  <OrdersPagination
    currentPage={currentPage}
    totalPages={totalPages}
    totalItems={filtered.length}
    itemsPerPage={ORDERS_PER_PAGE}
    onPageChange={setCurrentPage}
  />
)}

      {/* ========================================
          ASSIGN DELIVERY BOY
      ======================================== */}

      <AssignDeliveryBoyModal
        open={assignOpen}
        order={selectedOrder}
        onClose={() => {
          setAssignOpen(false);
          setSelectedOrder(null);
        }}
        onAssigned={loadOrders}
      />

      {/* ========================================
          RECEIVE PAYMENT
      ======================================== */}

      <ReceivePaymentModal
        open={paymentOpen}
        order={selectedPaymentOrder}
        onClose={() => {
          setPaymentOpen(false);
          setSelectedPaymentOrder(null);
        }}
        onConfirm={handleConfirmPayment}
      />

    </div>
  );
}

// ==================================================
// ORDER STAT
// ==================================================

function OrderStat({
  icon,
  label,
  value,
  delay,
  bg,
  color,
}) {
  return (
    <div
      className="
        order-stat-animation
        bg-white
        border
        border-gray-100
        rounded-3xl
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
        gap-3
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
            text-2xl
            sm:text-3xl
            font-black
            mt-1
            ${color}
          `}>
            {value}
          </p>

        </div>

        <div className={`
          w-11
          h-11
          sm:w-14
          sm:h-14
          rounded-2xl
          flex
          items-center
          justify-center
          text-xl
          sm:text-2xl
          flex-shrink-0
          ${bg}
        `}>
          {icon}
        </div>

      </div>

    </div>
  );
}
// ==================================================
// ORDERS PAGINATION
// ==================================================

function OrdersPagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}) {
  if (totalPages <= 1) {
    return null;
  }

  const start =
    (currentPage - 1) * itemsPerPage + 1;

  const end = Math.min(
    currentPage * itemsPerPage,
    totalItems
  );

  // Show maximum 5 page buttons
  let pages = [];

  if (totalPages <= 5) {
    pages = Array.from(
      { length: totalPages },
      (_, index) => index + 1
    );
  } else {
    let startPage = Math.max(
      1,
      currentPage - 2
    );

    let endPage = Math.min(
      totalPages,
      startPage + 4
    );

    if (endPage - startPage < 4) {
      startPage = endPage - 4;
    }

    pages = Array.from(
      { length: endPage - startPage + 1 },
      (_, index) => startPage + index
    );
  }

  return (
    <div className="
      mt-5
      bg-white
      rounded-3xl
      border
      border-gray-100
      shadow-sm
      p-4
    ">

      <div className="
        flex
        flex-col
        sm:flex-row
        sm:items-center
        sm:justify-between
        gap-4
      ">

        {/* Result Count */}

        <div className="text-center sm:text-left">

          <p className="
            text-xs
            uppercase
            tracking-wide
            text-gray-400
            font-bold
          ">
            Showing
          </p>

          <p className="
            text-sm
            font-black
            text-gray-800
          ">
            {start}–{end} of {totalItems} orders
          </p>

        </div>

        {/* Pagination Buttons */}

        <div className="
          flex
          items-center
          justify-center
          gap-1.5
        ">

          {/* Previous */}

          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() =>
              onPageChange(
                currentPage - 1
              )
            }
            className="
              w-10
              h-10
              rounded-xl
              border
              border-gray-200
              bg-white
              text-gray-700
              font-black
              text-lg
              hover:bg-green-50
              hover:border-green-200
              active:scale-90
              disabled:opacity-30
              disabled:cursor-not-allowed
              transition-all
            "
          >
            ‹
          </button>

          {/* First page */}

          {pages[0] > 1 && (
            <>
              <button
                type="button"
                onClick={() =>
                  onPageChange(1)
                }
                className="
                  w-10
                  h-10
                  rounded-xl
                  bg-gray-50
                  text-gray-700
                  font-black
                  hover:bg-green-50
                  active:scale-90
                  transition-all
                "
              >
                1
              </button>

              {pages[0] > 2 && (
                <span className="
                  px-1
                  text-gray-400
                  font-bold
                ">
                  …
                </span>
              )}
            </>
          )}

          {/* Pages */}

          {pages.map((page) => (
            <button
              key={page}
              type="button"
              onClick={() =>
                onPageChange(page)
              }
              className={`
                w-10
                h-10
                rounded-xl
                font-black
                active:scale-90
                transition-all
                ${
                  currentPage === page
                    ? "bg-green-600 text-white shadow-md shadow-green-600/20 scale-105"
                    : "bg-gray-50 text-gray-700 hover:bg-green-50"
                }
              `}
            >
              {page}
            </button>
          ))}

          {/* Last page */}

          {pages[pages.length - 1] <
            totalPages && (
            <>
              {pages[pages.length - 1] <
                totalPages - 1 && (
                <span className="
                  px-1
                  text-gray-400
                  font-bold
                ">
                  …
                </span>
              )}

              <button
                type="button"
                onClick={() =>
                  onPageChange(
                    totalPages
                  )
                }
                className="
                  w-10
                  h-10
                  rounded-xl
                  bg-gray-50
                  text-gray-700
                  font-black
                  hover:bg-green-50
                  active:scale-90
                  transition-all
                "
              >
                {totalPages}
              </button>
            </>
          )}

          {/* Next */}

          <button
            type="button"
            disabled={
              currentPage === totalPages
            }
            onClick={() =>
              onPageChange(
                currentPage + 1
              )
            }
            className="
              w-10
              h-10
              rounded-xl
              border
              border-gray-200
              bg-white
              text-gray-700
              font-black
              text-lg
              hover:bg-green-50
              hover:border-green-200
              active:scale-90
              disabled:opacity-30
              disabled:cursor-not-allowed
              transition-all
            "
          >
            ›
          </button>

        </div>

      </div>

    </div>
  );
}