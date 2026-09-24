import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getCustomerOrders } from "../services/orderService";
import { useAuthSession } from "../context/AuthSessionContext";

const MiniOrderCard = ({ label, value, color = "green" }) => {
  const styles = {
    green: "bg-green-50 border-green-100 text-green-700",
    blue: "bg-blue-50 border-blue-100 text-blue-700",
    yellow: "bg-amber-50 border-amber-100 text-amber-700",
    purple: "bg-purple-50 border-purple-100 text-purple-700",
  };

  return (
    <div className={`min-w-0 rounded-2xl border p-3 ${styles[color] || styles.green}`}>
      <p className="text-[10px] font-black uppercase tracking-wide opacity-60">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-black">
        {value}
      </p>
    </div>
  );
};

const MetaCard = ({ label, value, color = "green" }) => {
  const styles = {
    green: "bg-green-50 border-green-100 text-green-800",
    blue: "bg-blue-50 border-blue-100 text-blue-800",
    yellow: "bg-amber-50 border-amber-100 text-amber-800",
    purple: "bg-purple-50 border-purple-100 text-purple-800",
  };

  return (
    <div className={`rounded-2xl border p-4 ${styles[color] || styles.green}`}>
      <p className="text-[10px] font-black uppercase tracking-wide opacity-60">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-black">
        {value}
      </p>
    </div>
  );
};

const ORDER_HISTORY_CACHE_PREFIX = "ffd_order_history_v2_";
const ORDER_HISTORY_CACHE_TTL = 5 * 60 * 1000;

const getOrderCacheKey = (customerId) =>
  `${ORDER_HISTORY_CACHE_PREFIX}${customerId}`;

const readOrderCache = (customerId) => {
  try {
    const raw = sessionStorage.getItem(getOrderCacheKey(customerId));
    if (!raw) return null;

    const cached = JSON.parse(raw);
    if (!cached?.timestamp || !Array.isArray(cached.orders)) return null;

    return {
      orders: cached.orders.filter(Boolean),
      fresh: Date.now() - cached.timestamp < ORDER_HISTORY_CACHE_TTL,
    };
  } catch {
    return null;
  }
};

const writeOrderCache = (customerId, orders) => {
  try {
    sessionStorage.setItem(
      getOrderCacheKey(customerId),
      JSON.stringify({ timestamp: Date.now(), orders })
    );
  } catch {
    // Cache is optional; never block the page because of storage errors.
  }
};

export default function OrderHistory() {
  const navigate = useNavigate();
  const { customer } = useAuthSession();
  const customerId = customer?.id;

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!customerId) {
      setOrders([]);
      setLoading(true);
      return undefined;
    }

    let cancelled = false;
    const cached = readOrderCache(customerId);

    // Paint cached orders immediately when available.
    if (cached?.orders?.length) {
      setOrders(cached.orders);
      setLoading(false);
    }

    const loadOrders = async () => {
      if (!cached?.orders?.length) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      try {
        const data = await getCustomerOrders(customerId);

        if (cancelled) return;

        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.orders)
          ? data.orders
          : [];

        const cleanOrders = list.filter(Boolean);

        setOrders(cleanOrders);
        writeOrderCache(customerId, cleanOrders);
      } catch (error) {
        // Keep cached data visible if the background refresh fails.
        if (!cached?.orders?.length && !cancelled) {
          console.error("OrderHistory: failed to load orders:", error);
          setOrders([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };

    loadOrders();

    return () => {
      cancelled = true;
    };
  }, [customerId]);

  const totalOrders = orders.length;

  const totalSpent = useMemo(
    () =>
      orders.reduce(
        (sum, order) => sum + Number(order.totalAmount || order.total || 0),
        0
      ),
    [orders]
  );

  const formatMoney = (value) => {
    const num = Number(value || 0);
    if (Number.isNaN(num)) return "₹0";
    return `₹${num.toLocaleString("en-IN")}`;
  };

  const getStatusClasses = (status) => {
    const s = String(status || "").toLowerCase();

    if (s === "delivered") {
      return "bg-emerald-100 text-emerald-700 border border-emerald-200";
    }
    if (s === "pending") {
      return "bg-amber-100 text-amber-700 border border-amber-200";
    }
    if (s === "cancelled") {
      return "bg-red-100 text-red-700 border border-red-200";
    }
    if (s === "confirmed") {
      return "bg-blue-100 text-blue-700 border border-blue-200";
    }
    return "bg-slate-100 text-slate-700 border border-slate-200";
  };

  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [showOlderOrders, setShowOlderOrders] = useState(false);

  const latestOrders = orders.slice(0, 3);
  const olderOrders = orders.slice(3);

  const toggleOrder = (orderId) => {
    setExpandedOrderId((current) => (current === orderId ? null : orderId));
  };

  const getItemCount = (order) =>
    order.order_items?.length ||
    String(order.items || "")
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean).length ||
    0;

  const getOrderDate = (order) => {
    const value = order.order_date || order.date || order.createdAt;
    if (!value) return "Date unavailable";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusIcon = (status) => {
    const value = String(status || "").toLowerCase();
    if (value.includes("deliver")) return "✓";
    if (value.includes("cancel")) return "×";
    if (value.includes("confirm")) return "✓";
    if (value.includes("out")) return "🚚";
    return "⏳";
  };

  const getAddress = (order) =>
    order.addresses
      ? [
          order.addresses.house_no,
          order.addresses.street,
          order.addresses.area,
          order.addresses.city,
          order.addresses.state,
          order.addresses.pincode,
        ]
          .filter(Boolean)
          .join(", ")
      : order.address || "-";

  return (
    <>
      <style>{`
        @keyframes ffdOrderFadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes ffdOrderFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }

        @keyframes ffdOrderGlow {
          0%, 100% { opacity: .35; }
          50% { opacity: .8; }
        }

        @keyframes ffdOrderShimmer {
          from { transform: translateX(-120%) skewX(-18deg); }
          to { transform: translateX(420%) skewX(-18deg); }
        }

        .ffd-orders-page {
          min-height: 100dvh;
          overflow-x: hidden;
          background:
            radial-gradient(circle at 0% 0%, rgba(16,185,129,.12), transparent 28%),
            radial-gradient(circle at 100% 20%, rgba(132,204,22,.10), transparent 25%),
            linear-gradient(180deg, #f0fdf4 0%, #ffffff 46%, #ecfdf5 100%);
        }

        .ffd-orders-shell {
          width: min(100%, 1100px);
          margin: 0 auto;
          padding: 10px 10px 28px;
        }

        .ffd-orders-hero {
          position: relative;
          overflow: hidden;
          border-radius: 25px;
          background: linear-gradient(135deg, #064e3b, #047857 55%, #16a34a);
          color: white;
          box-shadow: 0 18px 55px rgba(4,120,87,.20);
          animation: ffdOrderFadeUp .45s ease-out both;
        }

        .ffd-hero-orb {
          position: absolute;
          border-radius: 999px;
          pointer-events: none;
          filter: blur(2px);
        }

        .ffd-hero-orb.one {
          width: 170px;
          height: 170px;
          right: -80px;
          top: -80px;
          background: rgba(190,242,100,.15);
          animation: ffdOrderFloat 5s ease-in-out infinite;
        }

        .ffd-hero-orb.two {
          width: 140px;
          height: 140px;
          left: -75px;
          bottom: -80px;
          background: rgba(255,255,255,.09);
          animation: ffdOrderFloat 6s ease-in-out infinite reverse;
        }

        .ffd-hero-shine {
          position: absolute;
          inset: 0 auto 0 -30%;
          width: 25%;
          background: rgba(255,255,255,.08);
          filter: blur(14px);
          transform: skewX(-18deg);
          animation: ffdOrderShimmer 7s ease-in-out infinite;
        }

        .ffd-orders-hero-content {
          position: relative;
          z-index: 2;
          padding: 19px 16px;
        }

        .ffd-brand-pill {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 7px 10px;
          border: 1px solid rgba(255,255,255,.16);
          border-radius: 999px;
          background: rgba(255,255,255,.10);
          backdrop-filter: blur(12px);
          font-size: 7px;
          font-weight: 950;
          letter-spacing: .11em;
        }

        .ffd-brand-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #bef264;
          animation: ffdOrderGlow 1.7s ease-in-out infinite;
        }

        .ffd-orders-title {
          margin: 12px 0 0;
          font-size: 32px;
          line-height: .95;
          font-weight: 1000;
          letter-spacing: -.055em;
        }

        .ffd-orders-title span {
          display: block;
          color: #d9f99d;
        }

        .ffd-orders-copy {
          margin-top: 9px;
          max-width: 500px;
          color: #d1fae5;
          font-size: 9px;
          line-height: 1.5;
          font-weight: 650;
        }

        .ffd-summary-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
          margin-top: 14px;
        }

        .ffd-summary-card {
          padding: 10px;
          border: 1px solid rgba(255,255,255,.14);
          border-radius: 15px;
          background: rgba(255,255,255,.10);
          backdrop-filter: blur(12px);
        }

        .ffd-summary-label {
          color: rgba(255,255,255,.62);
          font-size: 6px;
          font-weight: 850;
          letter-spacing: .09em;
          text-transform: uppercase;
        }

        .ffd-summary-value {
          margin-top: 3px;
          color: #fff;
          font-size: 17px;
          font-weight: 1000;
        }

        .ffd-action-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin: 11px 0;
        }

        .ffd-action {
          min-height: 43px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          border-radius: 13px;
          cursor: pointer;
          font-size: 9px;
          font-weight: 950;
          transition: transform .18s ease, box-shadow .18s ease;
        }

        .ffd-action:active {
          transform: scale(.96);
        }

        .ffd-action.back {
          border: 1px solid #bbf7d0;
          background: white;
          color: #047857;
        }

        .ffd-action.shop {
          border: 0;
          background: linear-gradient(135deg, #059669, #0d9488);
          color: white;
          box-shadow: 0 9px 22px rgba(5,150,105,.20);
        }

        .ffd-orders-panel {
          overflow: hidden;
          border: 1px solid #dcfce7;
          border-radius: 23px;
          background: rgba(255,255,255,.95);
          box-shadow: 0 12px 42px rgba(15,118,110,.07);
          animation: ffdOrderFadeUp .5s ease-out .08s both;
        }

        .ffd-panel-head {
          padding: 15px 13px 12px;
          border-bottom: 1px solid #f1f5f9;
          background: linear-gradient(135deg, #ffffff, #f0fdf4);
        }

        .ffd-panel-title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .ffd-panel-title {
          margin: 0;
          color: #064e3b;
          font-size: 17px;
          font-weight: 1000;
        }

        .ffd-panel-subtitle {
          margin-top: 3px;
          color: #94a3b8;
          font-size: 7px;
          font-weight: 750;
        }

        .ffd-latest-pill {
          padding: 6px 8px;
          border-radius: 999px;
          background: #dcfce7;
          color: #047857;
          font-size: 6px;
          font-weight: 950;
          white-space: nowrap;
        }

        .ffd-order-list {
          display: grid;
          gap: 9px;
          padding: 10px;
        }

        .ffd-order-card {
          position: relative;
          overflow: hidden;
          border: 1px solid #e2e8f0;
          border-radius: 17px;
          background: #fff;
          box-shadow: 0 6px 19px rgba(15,23,42,.045);
          animation: ffdOrderFadeUp .4s ease-out both;
        }

        .ffd-order-card::before {
          content: "";
          position: absolute;
          inset: 0 auto 0 0;
          width: 3px;
          background: linear-gradient(180deg, #059669, #34d399);
        }

        .ffd-order-trigger {
          width: 100%;
          min-height: 74px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 9px;
          padding: 11px 10px 11px 14px;
          border: 0;
          background: transparent;
          color: #0f172a;
          cursor: pointer;
          text-align: left;
        }

        .ffd-order-main {
          min-width: 0;
        }

        .ffd-order-label {
          color: #94a3b8;
          font-size: 6px;
          font-weight: 900;
          letter-spacing: .1em;
          text-transform: uppercase;
        }

        .ffd-order-number {
          margin-top: 2px;
          color: #047857;
          font-size: 9px;
          font-weight: 1000;
          overflow-wrap: anywhere;
        }

        .ffd-order-date {
          margin-top: 3px;
          color: #94a3b8;
          font-size: 6px;
          font-weight: 750;
        }

        .ffd-order-right {
          display: flex;
          align-items: center;
          gap: 5px;
          flex-shrink: 0;
        }

        .ffd-order-amount {
          color: #0f172a;
          font-size: 13px;
          font-weight: 1000;
        }

        .ffd-status {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          padding: 5px 6px;
          border-radius: 999px;
          font-size: 6px;
          font-weight: 950;
          white-space: nowrap;
        }

        .ffd-chevron {
          color: #94a3b8;
          font-size: 12px;
          transition: transform .25s ease;
        }

        .ffd-chevron.open {
          transform: rotate(180deg);
        }

        .ffd-expand {
          display: grid;
          grid-template-rows: 0fr;
          opacity: 0;
          transition: grid-template-rows .3s ease, opacity .2s ease;
        }

        .ffd-expand.open {
          grid-template-rows: 1fr;
          opacity: 1;
        }

        .ffd-expand-inner {
          min-height: 0;
          overflow: hidden;
        }

        .ffd-details {
          padding: 0 10px 11px 14px;
          border-top: 1px solid #f1f5f9;
        }

        .ffd-meta-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 6px;
          padding-top: 9px;
        }

        .ffd-meta {
          padding: 8px;
          border: 1px solid #f1f5f9;
          border-radius: 11px;
          background: #f8fafc;
        }

        .ffd-meta-label {
          color: #94a3b8;
          font-size: 5px;
          font-weight: 900;
          letter-spacing: .06em;
          text-transform: uppercase;
        }

        .ffd-meta-value {
          margin-top: 2px;
          color: #334155;
          font-size: 7px;
          font-weight: 950;
          overflow-wrap: anywhere;
        }

        .ffd-address {
          margin-top: 7px;
          padding: 9px;
          border-radius: 12px;
          background: #f0fdf4;
          color: #475569;
          font-size: 7px;
          line-height: 1.5;
          font-weight: 700;
        }

        .ffd-items {
          display: grid;
          gap: 6px;
          margin-top: 7px;
        }

        .ffd-item {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 7px;
          border: 1px solid #f1f5f9;
          border-radius: 11px;
        }

        .ffd-item-image {
          width: 34px;
          height: 34px;
          flex: 0 0 34px;
          border-radius: 10px;
          object-fit: cover;
          background: #ecfdf5;
        }

        .ffd-item-placeholder {
          display: grid;
          place-items: center;
          font-size: 15px;
        }

        .ffd-item-name {
          min-width: 0;
          flex: 1;
          color: #334155;
          font-size: 8px;
          font-weight: 900;
        }

        .ffd-item-qty {
          color: #94a3b8;
          font-size: 7px;
          font-weight: 750;
        }

        .ffd-item-price {
          color: #047857;
          font-size: 8px;
          font-weight: 1000;
        }

        .ffd-detail-actions {
          display: grid;
          grid-template-columns: 1fr;
          gap: 6px;
          margin-top: 8px;
        }

        .ffd-small-button {
          min-height: 36px;
          border: 1px solid #bbf7d0;
          border-radius: 11px;
          background: #ecfdf5;
          color: #047857;
          cursor: pointer;
          font-size: 8px;
          font-weight: 950;
        }

        .ffd-older-toggle {
          width: calc(100% - 20px);
          min-height: 49px;
          margin: 0 10px 10px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding: 0 10px;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          background: #f8fafc;
          color: #334155;
          cursor: pointer;
        }

        .ffd-older-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .ffd-older-icon {
          width: 29px;
          height: 29px;
          display: grid;
          place-items: center;
          border-radius: 9px;
          background: #ecfdf5;
        }

        .ffd-older-title {
          display: block;
          font-size: 8px;
          font-weight: 950;
        }

        .ffd-older-count {
          display: block;
          margin-top: 2px;
          color: #94a3b8;
          font-size: 6px;
          font-weight: 750;
        }

        .ffd-empty {
          padding: 48px 17px;
          text-align: center;
        }

        .ffd-empty-icon {
          width: 68px;
          height: 68px;
          margin: 0 auto;
          display: grid;
          place-items: center;
          border-radius: 21px;
          background: #ecfdf5;
          font-size: 30px;
          animation: ffdOrderFloat 3s ease-in-out infinite;
        }

        .ffd-empty-title {
          margin-top: 13px;
          color: #334155;
          font-size: 17px;
          font-weight: 1000;
        }

        .ffd-empty-copy {
          max-width: 290px;
          margin: 5px auto 0;
          color: #94a3b8;
          font-size: 9px;
          line-height: 1.5;
          font-weight: 700;
        }

        .ffd-loading {
          padding: 35px 16px;
          text-align: center;
        }

        .ffd-loading-logo {
          width: 52px;
          height: 52px;
          margin: 0 auto;
          border-radius: 16px;
          background: #dcfce7;
          animation: ffdOrderFloat 2s ease-in-out infinite;
        }

        .ffd-loading-bar {
          width: 145px;
          height: 4px;
          margin: 14px auto 0;
          overflow: hidden;
          border-radius: 999px;
          background: #dcfce7;
        }

        .ffd-loading-bar span {
          display: block;
          width: 35%;
          height: 100%;
          border-radius: inherit;
          background: #10b981;
          animation: ffdOrderShimmer 1.2s ease-in-out infinite;
        }

        @media (min-width: 640px) {
          .ffd-orders-shell {
            padding: 18px 18px 38px;
          }

          .ffd-orders-hero-content {
            padding: 28px;
          }

          .ffd-orders-title {
            font-size: 48px;
          }

          .ffd-action-row {
            display: flex;
            justify-content: flex-end;
          }

          .ffd-action {
            min-width: 145px;
          }

          .ffd-order-list {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            padding: 14px;
          }
        }

        @media (min-width: 1000px) {
          .ffd-orders-shell {
            padding: 26px 26px 48px;
          }

          .ffd-orders-hero {
            border-radius: 34px;
          }

          .ffd-orders-hero-content {
            padding: 36px;
          }

          .ffd-summary-grid {
            max-width: 410px;
          }

          .ffd-order-list {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
          }
        }

        @media (max-width: 359px) {
          .ffd-order-right {
            gap: 3px;
          }

          .ffd-order-amount {
            font-size: 11px;
          }

          .ffd-status {
            max-width: 62px;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .ffd-orders-page *,
          .ffd-orders-page *::before,
          .ffd-orders-page *::after {
            animation: none !important;
            transition-duration: .01ms !important;
          }
        }
      `}</style>

      <main className="ffd-orders-page">
        <div className="ffd-orders-shell">
          <section className="ffd-orders-hero">
            <div className="ffd-hero-orb one" />
            <div className="ffd-hero-orb two" />
            <div className="ffd-hero-shine" />

            <div className="ffd-orders-hero-content">
              <div className="ffd-brand-pill">
                <span className="ffd-brand-dot" />
                FARM FRESH DAIRY
              </div>

              <h1 className="ffd-orders-title">
                Order
                <span>History</span>
              </h1>

              <p className="ffd-orders-copy">
                Your recent purchases, payments and delivery details in one
                simple mobile-friendly view.
              </p>

              <div className="ffd-summary-grid">
                <div className="ffd-summary-card">
                  <div className="ffd-summary-label">Total Orders</div>
                  <div className="ffd-summary-value">{totalOrders}</div>
                </div>

                <div className="ffd-summary-card">
                  <div className="ffd-summary-label">Total Spent</div>
                  <div className="ffd-summary-value">
                    {formatMoney(totalSpent)}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="ffd-action-row">
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="ffd-action back"
            >
              ← Dashboard
            </button>

            <button
              type="button"
              onClick={() => navigate("/products")}
              className="ffd-action shop"
            >
              🛍️ Shop Now
            </button>
          </div>

          {loading ? (
            <section className="ffd-orders-panel">
              <div className="ffd-fast-loading">
                <span className="ffd-fast-spinner" />
                <span>Loading orders…</span>
              </div>
            </section>
          ) : orders.length === 0 ? (
            <section className="ffd-orders-panel">
              <div className="ffd-empty">
                <div className="ffd-empty-icon">🛒</div>
                <h2 className="ffd-empty-title">No orders yet</h2>
                <p className="ffd-empty-copy">
                  Fresh buffalo milk and dairy products are just a few clicks
                  away.
                </p>
                <button
                  type="button"
                  onClick={() => navigate("/products")}
                  className="ffd-action shop"
                  style={{ width: "180px", margin: "16px auto 0" }}
                >
                  🥛 Start Shopping
                </button>
              </div>
            </section>
          ) : (
            <section className="ffd-orders-panel">
              <div className="ffd-panel-head">
                <div className="ffd-panel-title-row">
                  <div>
                    <h2 className="ffd-panel-title">Recent Orders</h2>
                    <p className="ffd-panel-subtitle">
                      Latest 3 orders are shown first. Tap any order for details.
                    </p>
                  </div>

                  <span className="ffd-latest-pill">
                    {refreshing ? "Updating…" : `${latestOrders.length} Latest`}
                  </span>
                </div>
              </div>

              <div className="ffd-order-list">
                {latestOrders.map((order, index) => {
                  if (!order) return null;

                  const id = order.orderId || order.order_number || index;
                  const expanded = expandedOrderId === id;
                  const status = order.status || "Pending";
                  const payment =
                    order.payment_status || order.paymentStatus || "Pending";
                  const items = order.order_items || [];

                  return (
                    <article
                      key={id}
                      className="ffd-order-card"
                      style={{ animationDelay: `${index * 70}ms` }}
                    >
                      <button
                        type="button"
                        className="ffd-order-trigger"
                        onClick={() => toggleOrder(id)}
                        aria-expanded={expanded}
                      >
                        <div className="ffd-order-main">
                          <div className="ffd-order-label">Order</div>
                          <div className="ffd-order-number">
                            #{order.orderId || order.order_number || index + 1}
                          </div>
                          <div className="ffd-order-date">
                            {getOrderDate(order)}
                          </div>
                        </div>

                        <div className="ffd-order-right">
                          <span className="ffd-order-amount">
                            {formatMoney(
                              order.total_amount ||
                                order.totalAmount ||
                                order.total ||
                                0
                            )}
                          </span>

                          <span
                            className={`ffd-status ${getStatusClasses(status)}`}
                          >
                            {getStatusIcon(status)} {status}
                          </span>

                          <span
                            className={`ffd-chevron ${
                              expanded ? "open" : ""
                            }`}
                          >
                            ⌄
                          </span>
                        </div>
                      </button>

                      <div className={`ffd-expand ${expanded ? "open" : ""}`}>
                        <div className="ffd-expand-inner">
                          <div className="ffd-details">
                            <div className="ffd-meta-grid">
                              <div className="ffd-meta">
                                <div className="ffd-meta-label">Items</div>
                                <div className="ffd-meta-value">
                                  {getItemCount(order)}
                                </div>
                              </div>

                              <div className="ffd-meta">
                                <div className="ffd-meta-label">Payment</div>
                                <div className="ffd-meta-value">{payment}</div>
                              </div>

                              <div className="ffd-meta">
                                <div className="ffd-meta-label">Method</div>
                                <div className="ffd-meta-value">
                                  {order.payment_method || "-"}
                                </div>
                              </div>

                              <div className="ffd-meta">
                                <div className="ffd-meta-label">Area</div>
                                <div className="ffd-meta-value">
                                  {order.addresses?.area || order.area || "-"}
                                </div>
                              </div>
                            </div>

                            <div className="ffd-address">
                              📍 {getAddress(order)}
                            </div>

                            {items.length > 0 && (
                              <div className="ffd-items">
                                {items.map((item, itemIndex) => {
                                  const name =
                                    item.products?.name || "Product";
                                  const image = item.products?.image;
                                  const quantity = item.quantity ?? 0;
                                  const price =
                                    item.total_price ?? item.price ?? 0;

                                  return (
                                    <div
                                      className="ffd-item"
                                      key={item.id || itemIndex}
                                    >
                                      {image ? (
                                        <img
                                          src={image}
                                          alt={name}
                                          className="ffd-item-image"
                                        />
                                      ) : (
                                        <div className="ffd-item-image ffd-item-placeholder">
                                          🥛
                                        </div>
                                      )}

                                      <div className="ffd-item-name">
                                        {name}
                                      </div>

                                      <div className="ffd-item-qty">
                                        ×{quantity}
                                      </div>

                                      <div className="ffd-item-price">
                                        {formatMoney(price)}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            <div className="ffd-detail-actions">
                              <button
                                type="button"
                                className="ffd-small-button"
                                onClick={() => navigate("/products")}
                              >
                                🛍️ Reorder Products
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              {olderOrders.length > 0 && (
                <>
                  <button
                    type="button"
                    className="ffd-older-toggle"
                    onClick={() => setShowOlderOrders((value) => !value)}
                    aria-expanded={showOlderOrders}
                  >
                    <span className="ffd-older-left">
                      <span className="ffd-older-icon">🕘</span>
                      <span>
                        <span className="ffd-older-title">
                          {showOlderOrders
                            ? "Hide older orders"
                            : "View older orders"}
                        </span>
                        <span className="ffd-older-count">
                          {olderOrders.length} older order
                          {olderOrders.length === 1 ? "" : "s"}
                        </span>
                      </span>
                    </span>

                    <span
                      className={`ffd-chevron ${
                        showOlderOrders ? "open" : ""
                      }`}
                    >
                      ⌄
                    </span>
                  </button>

                  <div
                    className={`ffd-expand ${
                      showOlderOrders ? "open" : ""
                    }`}
                  >
                    <div className="ffd-expand-inner">
                      <div className="ffd-order-list">
                        {olderOrders.map((order, index) => {
                          if (!order) return null;

                          const id =
                            order.orderId ||
                            order.order_number ||
                            `older-${index}`;
                          const expanded = expandedOrderId === id;
                          const status = order.status || "Pending";
                          const payment =
                            order.payment_status ||
                            order.paymentStatus ||
                            "Pending";
                          const items = order.order_items || [];

                          return (
                            <article
                              key={id}
                              className="ffd-order-card"
                            >
                              <button
                                type="button"
                                className="ffd-order-trigger"
                                onClick={() => toggleOrder(id)}
                                aria-expanded={expanded}
                              >
                                <div className="ffd-order-main">
                                  <div className="ffd-order-label">Order</div>
                                  <div className="ffd-order-number">
                                    #
                                    {order.orderId ||
                                      order.order_number ||
                                      index + 4}
                                  </div>
                                  <div className="ffd-order-date">
                                    {getOrderDate(order)}
                                  </div>
                                </div>

                                <div className="ffd-order-right">
                                  <span className="ffd-order-amount">
                                    {formatMoney(
                                      order.total_amount ||
                                        order.totalAmount ||
                                        order.total ||
                                        0
                                    )}
                                  </span>

                                  <span
                                    className={`ffd-status ${getStatusClasses(
                                      status
                                    )}`}
                                  >
                                    {getStatusIcon(status)} {status}
                                  </span>

                                  <span
                                    className={`ffd-chevron ${
                                      expanded ? "open" : ""
                                    }`}
                                  >
                                    ⌄
                                  </span>
                                </div>
                              </button>

                              <div
                                className={`ffd-expand ${
                                  expanded ? "open" : ""
                                }`}
                              >
                                <div className="ffd-expand-inner">
                                  <div className="ffd-details">
                                    <div className="ffd-meta-grid">
                                      <div className="ffd-meta">
                                        <div className="ffd-meta-label">
                                          Items
                                        </div>
                                        <div className="ffd-meta-value">
                                          {getItemCount(order)}
                                        </div>
                                      </div>

                                      <div className="ffd-meta">
                                        <div className="ffd-meta-label">
                                          Payment
                                        </div>
                                        <div className="ffd-meta-value">
                                          {payment}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="ffd-address">
                                      📍 {getAddress(order)}
                                    </div>

                                    {items.length > 0 && (
                                      <div className="ffd-items">
                                        {items.map((item, itemIndex) => {
                                          const name =
                                            item.products?.name || "Product";
                                          const image = item.products?.image;
                                          const quantity = item.quantity ?? 0;
                                          const price =
                                            item.total_price ??
                                            item.price ??
                                            0;

                                          return (
                                            <div
                                              className="ffd-item"
                                              key={item.id || itemIndex}
                                            >
                                              {image ? (
                                                <img
                                                  src={image}
                                                  alt={name}
                                                  className="ffd-item-image"
                                                />
                                              ) : (
                                                <div className="ffd-item-image ffd-item-placeholder">
                                                  🥛
                                                </div>
                                              )}

                                              <div className="ffd-item-name">
                                                {name}
                                              </div>

                                              <div className="ffd-item-qty">
                                                ×{quantity}
                                              </div>

                                              <div className="ffd-item-price">
                                                {formatMoney(price)}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}

                                    <div className="ffd-detail-actions">
                                      <button
                                        type="button"
                                        className="ffd-small-button"
                                        onClick={() => navigate("/products")}
                                      >
                                        🛍️ Reorder Products
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </section>
          )}
        </div>
      </main>
    </>
  );
}
