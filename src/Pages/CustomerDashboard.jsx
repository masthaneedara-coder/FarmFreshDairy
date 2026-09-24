import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  CreditCard,
  LogOut,
  Package,
  Pause,
  Play,
  Plus,
  RefreshCw,
  ShoppingBag,
  Truck,
  UserRound,
  WalletCards,
  XCircle,
} from "lucide-react";
import { fetchDashboard } from "../services/dashboardService";

import ExtraMilkCard from "../Components/ExtraMilkCard";
import {
  pauseSubscriptionApi,
  resumeSubscriptionApi,
  getSubscriptionDeliverySummary,
  fetchCustomerSubscriptions,
} from "../config/api";
import PauseSubscriptionModal from "../Components/subscription/PauseSubscriptionModal";
import { useAuthSession } from "../context/AuthSessionContext";
import logo from "../assets/logo.png";

const LOGO_SRC = logo;

const DASHBOARD_CACHE_PREFIX = "ffd_dashboard_cache_v1_";
const DASHBOARD_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

const getDashboardCacheKey = (customerId) =>
  `${DASHBOARD_CACHE_PREFIX}${customerId}`;

const readDashboardCache = (customerId) => {
  try {
    const raw = sessionStorage.getItem(getDashboardCacheKey(customerId));
    if (!raw) return null;

    const cached = JSON.parse(raw);
    if (!cached?.timestamp || !cached?.dashboard) return null;

    return {
      dashboard: cached.dashboard,
      subscriptionHistory: Array.isArray(cached.subscriptionHistory)
        ? cached.subscriptionHistory
        : [],
      fresh: Date.now() - cached.timestamp < DASHBOARD_CACHE_TTL,
    };
  } catch {
    return null;
  }
};

const writeDashboardCache = (customerId, dashboard, subscriptionHistory = []) => {
  try {
    sessionStorage.setItem(
      getDashboardCacheKey(customerId),
      JSON.stringify({
        timestamp: Date.now(),
        dashboard,
        subscriptionHistory,
      })
    );
  } catch {
    // Cache is an optimization only. Never block the dashboard because of it.
  }
};

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const { customer, logout } = useAuthSession();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [subscriptionHistory, setSubscriptionHistory] = useState([]);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [orders, setOrders] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [deliverySummaries, setDeliverySummaries] = useState({});
  const [statusUpdatingId, setStatusUpdatingId] = useState("");
  const [expandedSubscriptionId, setExpandedSubscriptionId] = useState(null);
  const [showOlderOrders, setShowOlderOrders] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  const subscriptionScrollRef = useRef(null);

  const summary = dashboard?.summary || {
    totalOrders: 0,
    totalSpent: 0,
    totalSubscriptions: 0,
    activeSubscriptions: 0,
  };

  // Wallet/billing fields are optional so this UI remains compatible with
  // the current dashboard API. When the backend exposes these values they
  // are shown automatically.
  const walletBalance =
    dashboard?.wallet?.balance ??
    dashboard?.walletBalance ??
    summary?.walletBalance ??
    null;

  const outstanding =
    dashboard?.billing?.outstanding ??
    dashboard?.outstanding ??
    summary?.outstanding ??
    null;

  const latestOrders = dashboard?.recentOrders || orders;
  const visibleRecentOrders = latestOrders.slice(0, 3);
  const olderOrders = latestOrders.slice(3);

  const scrollSubscriptions = (direction = "right") => {
    if (!subscriptionScrollRef.current) return;

    subscriptionScrollRef.current.scrollBy({
      left: direction === "left" ? -320 : 320,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    if (!customer?.id) return;

    loadDashboard();
  }, [customer?.id]);

  useEffect(() => {
    if (!subscriptions.length) return;

    let cancelled = false;

    async function loadDeliverySummaries() {
      const summaries = {};

      // These requests are deliberately kept OUT of the initial page load.
      // They update subscription cards after the dashboard is already visible.
      await Promise.all(
        subscriptions.map(async (sub) => {
          try {
            const response = await getSubscriptionDeliverySummary(sub.id);

            summaries[sub.id] = response.summary || {
              delivered: 0,
              outForDelivery: 0,
              skipped: 0,
            };
          } catch (err) {
            summaries[sub.id] = {
              delivered: 0,
              outForDelivery: 0,
              skipped: 0,
            };
          }
        })
      );

      if (!cancelled) {
        setDeliverySummaries(summaries);
      }
    }

    loadDeliverySummaries();

    return () => {
      cancelled = true;
    };
  }, [subscriptions]);

  const loadDashboard = async () => {
    if (!customer?.id) {
      setLoading(false);
      return;
    }

    const customerId = customer.id;
    const cached = readDashboardCache(customerId);

    // 1. Paint cached dashboard immediately.
    // This removes the full-screen loading wait on repeat visits.
    if (cached?.dashboard) {
      setDashboard(cached.dashboard);
      setOrders(cached.dashboard.recentOrders || []);
      setSubscriptions(cached.dashboard.subscriptions || []);
      setSubscriptionHistory(cached.subscriptionHistory || []);
      setLoading(false);
    }

    try {
      if (cached?.dashboard) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Main dashboard request only. Secondary data must never block rendering.
      const nextDashboard = await fetchDashboard(customerId);

      if (!nextDashboard) {
        throw new Error("Dashboard API returned no dashboard data");
      }

      const nextOrders = Array.isArray(nextDashboard.recentOrders)
        ? nextDashboard.recentOrders
        : [];

      const nextSubscriptions = Array.isArray(nextDashboard.subscriptions)
        ? nextDashboard.subscriptions
        : [];

      // Render the main dashboard immediately.
      setDashboard(nextDashboard);
      setOrders(nextOrders);
      setSubscriptions(nextSubscriptions);
      setLoading(false);

      // Cache only the valid dashboard payload.
      writeDashboardCache(customerId, nextDashboard);

      // Subscription history is secondary and never blocks the dashboard.
      fetchCustomerSubscriptions(customerId)
        .then((historyRes) => {
          const history = Array.isArray(historyRes?.subscriptions)
            ? historyRes.subscriptions
            : [];

          setSubscriptionHistory(history);

          writeDashboardCache(
            customerId,
            nextDashboard,
            history
          );
        })
        .catch((historyError) => {
          console.warn(
            "Subscription history could not be loaded:",
            historyError
          );
        });
    } catch (err) {
      console.error("Dashboard load failed:", err);

      // Keep cached dashboard visible if the background refresh fails.
      if (!cached?.dashboard) {
        setDashboard(null);
        setOrders([]);
        setSubscriptions([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/auth");
  };

  const formatMoney = (value) => {
    const num = Number(value || 0);
    if (Number.isNaN(num)) return "₹0";
    return `₹${num.toLocaleString("en-IN")}`;
  };

  const formatDate = (value) => {
    if (!value) return "N/A";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getRemainingDays = (expireDate) => {
    if (!expireDate) return null;

    const today = new Date();
    const expiry = new Date(expireDate);

    today.setHours(0, 0, 0, 0);
    expiry.setHours(0, 0, 0, 0);

    const difference = expiry.getTime() - today.getTime();

    return Math.max(0, Math.ceil(difference / (1000 * 60 * 60 * 24)));
  };

  const isSubscriptionExpired = (expireDate) => {
    if (!expireDate) return false;

    const today = new Date();
    const expiry = new Date(expireDate);

    today.setHours(0, 0, 0, 0);
    expiry.setHours(0, 0, 0, 0);

    return today > expiry;
  };

  const handleResume = async (subscriptionId) => {
    try {
      setStatusUpdatingId(subscriptionId);

      await resumeSubscriptionApi(subscriptionId);
      await loadDashboard();

      alert("Subscription resumed successfully.");
    } catch (err) {
      console.error(err);
      alert("Unable to resume subscription.");
    } finally {
      setStatusUpdatingId("");
    }
  };

  const handlePauseConfirm = async (pauseFrom, pauseTo) => {
    try {
      setLoading(true);

      await pauseSubscriptionApi(selectedSubscription.id, {
        pause_from: pauseFrom,
        pause_to: pauseTo,
      });

      setShowPauseModal(false);
      setSelectedSubscription(null);

      await loadDashboard();

      alert("Subscription paused successfully.");
    } catch (err) {
      console.error(err);
      alert("Unable to pause subscription.");
    } finally {
      setLoading(false);
    }
  };

  const activeSubscriptions = subscriptions.filter(
    (sub) => !isSubscriptionExpired(sub.expireDate)
  );

  if (loading) {
    return (
      <>
        {/* IMPORTANT: This style is inside the loading return.
            The normal dashboard <style> below is NOT rendered while loading. */}
        <style>{`
          .dashboard-loading-screen {
            position: fixed;
            inset: 0;
            z-index: 99999;
            width: 100%;
            height: 100dvh;
            min-height: 100dvh;
            display: flex;
            align-items: center;
            justify-content: center;
            box-sizing: border-box;
            padding: 16px;
            overflow: hidden;
            background:
              radial-gradient(circle at 20% 15%, rgba(16,185,129,.10), transparent 28%),
              linear-gradient(145deg, #f0fdf4 0%, #ffffff 52%, #ecfeff 100%);
            font-family: inherit;
          }

          .dashboard-loading-box {
            position: relative;
            z-index: 2;
            width: min(88vw, 300px);
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 22px 16px 18px;
            border: 1px solid #e2e8f0;
            border-radius: 22px;
            background: rgba(255,255,255,.96);
            box-shadow: 0 18px 45px rgba(15,23,42,.10);
          }

          /* VERY SMALL logo. These rules intentionally use !important
             so global img { width:100% } rules cannot enlarge it. */
          .dashboard-loading-small-logo {
            width: 48px !important;
            height: 48px !important;
            min-width: 48px !important;
            min-height: 48px !important;
            max-width: 48px !important;
            max-height: 48px !important;
            flex: 0 0 48px !important;
            display: block !important;
            box-sizing: border-box !important;
            margin: 0 !important;
            padding: 3px !important;
            object-fit: contain !important;
            object-position: center !important;
            border: 1px solid #d1fae5 !important;
            border-radius: 13px !important;
            background: #fff !important;
          }

          .dashboard-loading-mini-spinner {
            width: 22px;
            height: 22px;
            margin-top: 13px;
            border: 2px solid #d1fae5;
            border-top-color: #059669;
            border-radius: 50%;
            animation: dashboardLoadingSpin .75s linear infinite;
          }

          .dashboard-loading-title {
            margin: 10px 0 0;
            color: #047857;
            font-size: 14px;
            line-height: 1;
            font-weight: 950;
            letter-spacing: -.025em;
          }

          .dashboard-loading-heading {
            margin: 7px 0 0;
            color: #0f172a;
            font-size: 15px;
            line-height: 1.2;
            font-weight: 900;
          }

          .dashboard-loading-text {
            max-width: 245px;
            margin: 5px 0 0;
            color: #64748b;
            font-size: 9px;
            line-height: 1.5;
            font-weight: 650;
            text-align: center;
          }

          .dashboard-loading-line {
            width: 130px;
            height: 3px;
            margin-top: 12px;
            overflow: hidden;
            border-radius: 999px;
            background: #e2e8f0;
          }

          .dashboard-loading-line span {
            display: block;
            width: 35%;
            height: 100%;
            border-radius: inherit;
            background: linear-gradient(90deg, #059669, #10b981);
            animation: dashboardLoadingProgress 1.2s ease-in-out infinite;
          }

          .dashboard-loading-retry {
            min-height: 34px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            margin-top: 12px;
            padding: 0 14px;
            border: 0;
            border-radius: 11px;
            background: #059669;
            color: #fff;
            cursor: pointer;
            font-size: 9px;
            font-weight: 900;
            box-shadow: 0 7px 16px rgba(5,150,105,.20);
          }

          @keyframes dashboardLoadingSpin {
            to { transform: rotate(360deg); }
          }

          @keyframes dashboardLoadingProgress {
            0% { transform: translateX(-140%); }
            100% { transform: translateX(420%); }
          }

          @media (max-width: 480px) {
            .dashboard-loading-screen {
              padding: 12px;
            }

            .dashboard-loading-box {
              width: min(88vw, 280px);
              padding: 19px 14px 16px;
              border-radius: 19px;
            }

            .dashboard-loading-small-logo {
              width: 42px !important;
              height: 42px !important;
              min-width: 42px !important;
              min-height: 42px !important;
              max-width: 42px !important;
              max-height: 42px !important;
              flex-basis: 42px !important;
            }

            .dashboard-loading-title {
              font-size: 13px;
            }

            .dashboard-loading-heading {
              font-size: 14px;
            }

            .dashboard-loading-text {
              font-size: 8px;
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .dashboard-loading-mini-spinner,
            .dashboard-loading-line span {
              animation: none;
            }
          }
        `}</style>

        <div className="dashboard-loading-screen">
          <div className="dashboard-loading-box">
            <img
              src={LOGO_SRC}
              alt="Farm Fresh Dairy"
              className="dashboard-loading-small-logo"
            />

            <div
              className="dashboard-loading-mini-spinner"
              aria-hidden="true"
            />

            <div className="dashboard-loading-title">
              FarmFreshDairy
            </div>

            <h2 className="dashboard-loading-heading">
              Welcome back
            </h2>

            <p className="dashboard-loading-text">
              Preparing your dashboard, subscriptions and delivery details...
            </p>

            <div className="dashboard-loading-line" aria-hidden="true">
              <span />
            </div>

            <button
              type="button"
              className="dashboard-loading-retry"
              onClick={loadDashboard}
            >
              <RefreshCw size={12} />
              Retry
            </button>
          </div>
        </div>
      </>
    );
  }

  const customerName =
    dashboard?.customer?.full_name || customer?.name || "Customer";

  return (
    <div className="customer-dashboard">
      {refreshing && (
        <div
          aria-live="polite"
          style={{
            position: "fixed",
            top: 8,
            right: 10,
            zIndex: 9998,
            padding: "5px 9px",
            borderRadius: 999,
            background: "rgba(255,255,255,.92)",
            border: "1px solid #d1fae5",
            color: "#047857",
            fontSize: 7,
            fontWeight: 900,
            boxShadow: "0 5px 15px rgba(15,23,42,.08)",
          }}
        >
          Updating…
        </div>
      )}
      <style>{`
        @keyframes dashFloat {
          0%, 100% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(0, -9px, 0); }
        }

        @keyframes dashGlow {
          0%, 100% { opacity: .45; transform: scale(1); }
          50% { opacity: .75; transform: scale(1.08); }
        }

        @keyframes dashIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes dashShine {
          from { transform: translateX(-120%); }
          to { transform: translateX(420%); }
        }

        @keyframes dashSpin {
          to { transform: rotate(360deg); }
        }

        .customer-dashboard {
          min-height: 100dvh;
          overflow-x: hidden;
          background:
            radial-gradient(circle at 8% 5%, rgba(167,243,208,.28), transparent 26%),
            radial-gradient(circle at 96% 35%, rgba(153,246,228,.22), transparent 28%),
            #f6fbf8;
          color: #0f172a;
          padding: 14px 14px 105px;
        }

        .dashboard-container {
          width: 100%;
          max-width: 1180px;
          margin: 0 auto;
        }

        .dashboard-mobile-top {
          display: none;
        }

        .dashboard-hero {
          position: relative;
          overflow: hidden;
          border-radius: 30px;
          padding: 23px;
          color: white;
          background:
            radial-gradient(circle at 90% 5%, rgba(167,243,208,.25), transparent 25%),
            linear-gradient(135deg, #063c30 0%, #08795f 55%, #0aa889 100%);
          box-shadow: 0 25px 65px rgba(0,91,69,.20);
          animation: dashIn .55s cubic-bezier(.22,1,.36,1);
        }

        .dashboard-hero::after {
          content: "";
          position: absolute;
          width: 280px;
          height: 280px;
          right: -130px;
          bottom: -160px;
          border-radius: 50%;
          background: rgba(255,255,255,.09);
          filter: blur(3px);
          animation: dashGlow 7s ease-in-out infinite;
        }

        .dashboard-hero-shine {
          position: absolute;
          inset: 0;
          width: 30%;
          background: linear-gradient(
            100deg,
            transparent,
            rgba(255,255,255,.08),
            transparent
          );
          transform: translateX(-120%);
          animation: dashShine 7s ease-in-out infinite;
        }

        .dashboard-hero-content {
          position: relative;
          z-index: 2;
        }

        .dashboard-hero-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 18px;
        }

        .dashboard-brand-line {
          display: flex;
          align-items: center;
          gap: 11px;
        }

        .dashboard-logo {
          width: 54px;
          height: 54px;
          flex: 0 0 54px;
          object-fit: contain;
          border-radius: 17px;
          padding: 4px;
          background: white;
          box-shadow: 0 10px 25px rgba(0,0,0,.15);
          animation: dashFloat 4s ease-in-out infinite;
        }

        .dashboard-brand-name {
          font-size: 14px;
          font-weight: 950;
          letter-spacing: -.03em;
        }

        .dashboard-brand-subtitle {
          margin-top: 2px;
          color: rgba(255,255,255,.62);
          font-size: 8px;
          font-weight: 800;
          letter-spacing: .1em;
          text-transform: uppercase;
        }

        .dashboard-hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          margin-top: 20px;
          padding: 7px 11px;
          border: 1px solid rgba(255,255,255,.15);
          border-radius: 999px;
          background: rgba(255,255,255,.09);
          color: #d1fae5;
          font-size: 8px;
          font-weight: 950;
          letter-spacing: .16em;
          text-transform: uppercase;
          backdrop-filter: blur(10px);
        }

        .dashboard-hero-badge-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #6ee7b7;
          box-shadow: 0 0 13px rgba(110,231,183,.9);
          animation: dashGlow 2s infinite;
        }

        .dashboard-hero-title {
          margin: 13px 0 0;
          max-width: 720px;
          font-size: clamp(29px, 5vw, 51px);
          line-height: 1.02;
          letter-spacing: -.055em;
          font-weight: 950;
        }

        .dashboard-hero-title span {
          color: #a7f3d0;
        }

        .dashboard-hero-copy {
          max-width: 660px;
          margin-top: 10px;
          color: rgba(236,253,245,.78);
          font-size: 12px;
          line-height: 1.6;
          font-weight: 600;
        }

        .dashboard-hero-logo-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-width: 112px;
          padding: 13px;
          border: 1px solid rgba(255,255,255,.13);
          border-radius: 23px;
          background: rgba(255,255,255,.08);
          backdrop-filter: blur(15px);
        }

        .dashboard-hero-logo-card img {
          width: 55px;
          height: 55px;
          object-fit: contain;
          border-radius: 17px;
          background: white;
          padding: 4px;
        }

        .dashboard-hero-logo-card span {
          margin-top: 7px;
          color: #d1fae5;
          font-size: 8px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: .1em;
        }

        .dashboard-actions {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 8px;
          margin-top: 21px;
        }

        /* High-contrast hero action buttons */
        .dashboard-action {
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          min-height: 46px;
          border: 1px solid rgba(255,255,255,.22);
          border-radius: 15px;
          color: white;
          cursor: pointer;
          font-size: 10px;
          font-weight: 950;
          letter-spacing: .01em;
          box-shadow: 0 8px 18px rgba(0,0,0,.14);
          transition: transform .22s ease, box-shadow .22s ease, filter .22s ease;
          backdrop-filter: blur(3px);
        }

        .dashboard-action::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(
            110deg,
            transparent 20%,
            rgba(255,255,255,.20) 45%,
            transparent 70%
          );
          transform: translateX(-130%);
          transition: transform .6s ease;
        }

        .dashboard-action:hover::after {
          transform: translateX(130%);
        }

        .dashboard-action:hover {
          transform: translateY(-3px) scale(1.015);
          box-shadow: 0 12px 25px rgba(0,0,0,.20);
          filter: brightness(1.06);
        }

        .dashboard-action:active {
          transform: translateY(0) scale(.98);
        }

        /* Shop */
        .dashboard-action.primary {
          color: #ffffff;
          background: linear-gradient(135deg, #059669 0%, #10b981 100%);
          border-color: #6ee7b7;
          box-shadow: 0 9px 22px rgba(5,150,105,.38);
        }

        /* Subscribe */
        .dashboard-action:nth-child(2) {
          background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
          border-color: #fed7aa;
          box-shadow: 0 9px 22px rgba(249,115,22,.30);
        }

        /* Orders */
        .dashboard-action:nth-child(3) {
          background: linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%);
          border-color: #93c5fd;
          box-shadow: 0 9px 22px rgba(37,99,235,.28);
        }

        /* Logout */
        .dashboard-action:nth-child(4) {
          background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
          border-color: #fecaca;
          box-shadow: 0 9px 22px rgba(220,38,38,.26);
        }

        .dashboard-section {
          margin-top: 22px;
          animation: dashIn .55s cubic-bezier(.22,1,.36,1) both;
        }

        .wallet-billing-section {
          margin-top: 16px;
        }

        .wallet-billing-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .wallet-card {
          position: relative;
          overflow: hidden;
          min-height: 185px;
          padding: 17px;
          border-radius: 24px;
          color: #fff;
          box-shadow: 0 18px 45px rgba(15,23,42,.10);
        }

        .prepaid-card {
          background: linear-gradient(135deg,#064e3b,#059669,#10b981);
        }

        .postpaid-card {
          background: linear-gradient(135deg,#172554,#2563eb,#0ea5e9);
        }

        .wallet-card-orb {
          position: absolute;
          width: 190px;
          height: 190px;
          right: -80px;
          top: -90px;
          border-radius: 50%;
          background: rgba(255,255,255,.11);
          animation: dashGlow 6s ease-in-out infinite;
        }

        .wallet-card-head {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .wallet-card-head span {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 950;
        }

        .wallet-card-head b {
          padding: 5px 7px;
          border-radius: 999px;
          background: rgba(255,255,255,.14);
          color: #fff;
          font-size: 7px;
          letter-spacing: .08em;
        }

        .wallet-card > small {
          position: relative;
          z-index: 2;
          display: block;
          margin-top: 22px;
          color: rgba(255,255,255,.68);
          font-size: 8px;
          font-weight: 850;
          text-transform: uppercase;
          letter-spacing: .1em;
        }

        .wallet-card > strong {
          position: relative;
          z-index: 2;
          display: block;
          margin-top: 5px;
          font-size: 27px;
          line-height: 1;
          font-weight: 950;
          letter-spacing: -.04em;
        }

        .wallet-card > p {
          position: relative;
          z-index: 2;
          min-height: 28px;
          margin: 7px 0 12px;
          color: rgba(255,255,255,.72);
          font-size: 8px;
          line-height: 1.45;
        }

        .wallet-card > button {
          position: relative;
          z-index: 2;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          min-height: 34px;
          padding: 0 10px;
          border: 1px solid rgba(255,255,255,.20);
          border-radius: 10px;
          background: rgba(255,255,255,.13);
          color: #fff;
          cursor: pointer;
          font-size: 8px;
          font-weight: 950;
        }

        .dashboard-section-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 12px;
        }

        .dashboard-eyebrow {
          color: #059669;
          font-size: 8px;
          font-weight: 950;
          letter-spacing: .2em;
          text-transform: uppercase;
        }

        .dashboard-section-title {
          margin-top: 3px;
          color: #0f172a;
          font-size: 22px;
          line-height: 1.1;
          letter-spacing: -.04em;
          font-weight: 950;
        }

        .dashboard-section-copy {
          margin-top: 3px;
          color: #94a3b8;
          font-size: 10px;
          font-weight: 650;
        }

        .dashboard-scroll-buttons {
          display: flex;
          gap: 6px;
        }

        .dashboard-circle-btn {
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          background: white;
          color: #475569;
          cursor: pointer;
          transition: .2s ease;
        }

        .dashboard-circle-btn:hover {
          border-color: #a7f3d0;
          color: #047857;
          transform: translateY(-1px);
        }

        .dashboard-stats {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
        }

        .dashboard-stat {
          position: relative;
          overflow: hidden;
          min-width: 0;
          padding: 14px;
          border: 1px solid rgba(255,255,255,.9);
          border-radius: 21px;
          background: rgba(255,255,255,.86);
          box-shadow: 0 12px 35px rgba(15,23,42,.055);
          backdrop-filter: blur(15px);
          transition: .3s ease;
        }

        .dashboard-stat:hover {
          transform: translateY(-3px);
          box-shadow: 0 18px 45px rgba(15,23,42,.09);
        }

        .dashboard-stat::after {
          content: "";
          position: absolute;
          width: 70px;
          height: 70px;
          right: -30px;
          top: -30px;
          border-radius: 50%;
          background: rgba(16,185,129,.08);
          filter: blur(3px);
        }

        .dashboard-stat-top {
          display: flex;
          justify-content: space-between;
          gap: 8px;
        }

        .dashboard-stat-label {
          color: #94a3b8;
          font-size: 8px;
          font-weight: 950;
          letter-spacing: .12em;
          text-transform: uppercase;
        }

        .dashboard-stat-value {
          margin-top: 7px;
          color: #0f172a;
          font-size: 22px;
          line-height: 1;
          font-weight: 950;
        }

        .dashboard-stat-icon {
          width: 37px;
          height: 37px;
          display: grid;
          place-items: center;
          border-radius: 13px;
          background: #ecfdf5;
          color: #059669;
        }

        .dashboard-subscription-strip {
          display: flex;
          gap: 12px;
          overflow-x: auto;
          padding: 2px 2px 7px;
          scrollbar-width: none;
          scroll-snap-type: x mandatory;
        }

        .dashboard-subscription-strip::-webkit-scrollbar {
          display: none;
        }

        .subscription-card {
          flex: 0 0 min(100%, 530px);
          scroll-snap-align: start;
          overflow: hidden;
          border: 1px solid #e2e8f0;
          border-radius: 27px;
          background: white;
          box-shadow: 0 18px 50px rgba(15,23,42,.07);
          transition: .35s ease;
        }

        .subscription-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 25px 65px rgba(15,23,42,.10);
        }

        .subscription-card-top {
          position: relative;
          overflow: hidden;
          padding: 17px;
          color: white;
          background: linear-gradient(135deg,#075e4b,#078a6c,#0bb394);
        }

        .subscription-card-top::after {
          content: "";
          position: absolute;
          width: 150px;
          height: 150px;
          right: -70px;
          top: -80px;
          border-radius: 50%;
          background: rgba(255,255,255,.10);
          animation: dashFloat 7s ease-in-out infinite;
        }

        .subscription-card-head {
          position: relative;
          z-index: 2;
          display: flex;
          justify-content: space-between;
          gap: 10px;
        }

        .subscription-brand {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .subscription-logo {
          width: 38px;
          height: 38px;
          object-fit: contain;
          padding: 3px;
          border-radius: 12px;
          background: white;
        }

        .subscription-kicker {
          color: #bbf7d0;
          font-size: 7px;
          font-weight: 950;
          letter-spacing: .16em;
          text-transform: uppercase;
        }

        .subscription-size {
          margin-top: 2px;
          font-size: 20px;
          font-weight: 950;
        }

        .subscription-status {
          align-self: flex-start;
          padding: 6px 9px;
          border-radius: 999px;
          background: white;
          color: #047857;
          font-size: 8px;
          font-weight: 950;
          text-transform: uppercase;
        }

        .subscription-top-metrics {
          position: relative;
          z-index: 2;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 7px;
          margin-top: 14px;
        }

        .subscription-metric {
          padding: 9px;
          border: 1px solid rgba(255,255,255,.11);
          border-radius: 14px;
          background: rgba(255,255,255,.09);
          backdrop-filter: blur(3px);
        }

        .subscription-metric-label {
          color: #bbf7d0;
          font-size: 7px;
          font-weight: 850;
          text-transform: uppercase;
          letter-spacing: .08em;
        }

        .subscription-metric-value {
          margin-top: 3px;
          color: white;
          font-size: 13px;
          font-weight: 950;
        }

        .subscription-card-body {
          padding: 15px;
        }

        .subscription-dates {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 8px;
        }

        .subscription-date-label {
          color: #94a3b8;
          font-size: 7px;
          font-weight: 950;
          text-transform: uppercase;
          letter-spacing: .08em;
        }

        .subscription-date-value {
          margin-top: 3px;
          color: #334155;
          font-size: 10px;
          font-weight: 950;
        }

        .subscription-progress {
          width: 72px;
          height: 5px;
          overflow: hidden;
          border-radius: 999px;
          background: #f1f5f9;
        }

        .subscription-progress > span {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg,#34d399,#059669);
          transition: width 1s ease;
        }

        .subscription-progress-label {
          margin-top: 4px;
          color: #94a3b8;
          text-align: center;
          font-size: 6px;
          font-weight: 950;
          letter-spacing: .1em;
        }

        .subscription-validity {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-top: 12px;
          padding: 10px 12px;
          border: 1px solid #d1fae5;
          border-radius: 15px;
          background: #ecfdf5;
        }

        .subscription-validity.warning {
          border-color: #fed7aa;
          background: #fff7ed;
        }

        .subscription-validity strong {
          color: #047857;
          font-size: 11px;
        }

        .subscription-validity.warning strong {
          color: #c2410c;
        }

        .subscription-validity span {
          color: #94a3b8;
          font-size: 7px;
          font-weight: 950;
          text-transform: uppercase;
        }

        .subscription-detail-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 11px;
          padding: 11px 12px;
          border: 1px solid #e2e8f0;
          border-radius: 15px;
          background: #f8fafc;
          color: #334155;
          cursor: pointer;
          text-align: left;
          transition: .2s ease;
        }

        .subscription-detail-btn:hover {
          border-color: #a7f3d0;
          background: #ecfdf5;
        }

        .subscription-detail-title {
          font-size: 10px;
          font-weight: 950;
        }

        .subscription-detail-copy {
          margin-top: 2px;
          color: #94a3b8;
          font-size: 7px;
          font-weight: 700;
        }

        .subscription-details {
          overflow: hidden;
          display: grid;
          grid-template-rows: 0fr;
          opacity: 0;
          transition: .4s ease;
        }

        .subscription-details.open {
          grid-template-rows: 1fr;
          opacity: 1;
          margin-top: 10px;
        }

        .subscription-details-inner {
          min-height: 0;
          overflow: hidden;
        }

        .detail-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 7px;
        }

        .detail-box {
          min-width: 0;
          padding: 9px;
          border: 1px solid #f1f5f9;
          border-radius: 13px;
          background: #f8fafc;
        }

        .detail-box label {
          display: block;
          color: #94a3b8;
          font-size: 6px;
          font-weight: 950;
          letter-spacing: .08em;
          text-transform: uppercase;
        }

        .detail-box strong {
          display: block;
          margin-top: 3px;
          overflow-wrap: anywhere;
          color: #334155;
          font-size: 9px;
          font-weight: 950;
        }

        .subscription-buttons {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 7px;
          margin-top: 11px;
        }

        .subscription-btn {
          min-height: 40px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          border: 0;
          border-radius: 13px;
          cursor: pointer;
          font-size: 9px;
          font-weight: 950;
          transition: .2s ease;
        }

        .subscription-btn:hover {
          transform: translateY(-2px);
        }

        .subscription-btn.pause {
          background: #f97316;
          color: white;
        }

        .subscription-btn.resume {
          background: #059669;
          color: white;
        }

        .subscription-btn.manage {
          border: 1px solid #a7f3d0;
          background: white;
          color: #047857;
        }

        .empty-card {
          padding: 28px 18px;
          border: 1px solid #d1fae5;
          border-radius: 26px;
          background: white;
          text-align: center;
          box-shadow: 0 18px 50px rgba(15,23,42,.06);
        }

        .empty-logo {
          width: 66px;
          height: 66px;
          margin: 0 auto;
          padding: 5px;
          object-fit: contain;
          border-radius: 20px;
          background: #ecfdf5;
        }

        .empty-title {
          margin-top: 12px;
          font-size: 18px;
          font-weight: 950;
        }

        .empty-copy {
          max-width: 420px;
          margin: 5px auto 0;
          color: #94a3b8;
          font-size: 10px;
          line-height: 1.6;
        }

        .primary-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          min-height: 42px;
          margin-top: 14px;
          padding: 0 17px;
          border: 0;
          border-radius: 14px;
          background: linear-gradient(135deg,#059669,#0d9488);
          color: white;
          cursor: pointer;
          font-size: 10px;
          font-weight: 950;
          box-shadow: 0 12px 25px rgba(5,150,105,.18);
          transition: .25s ease;
        }

        .primary-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 16px 30px rgba(5,150,105,.24);
        }

        .dashboard-extra {
          margin-top: 18px;
        }

        .quick-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 9px;
        }

        .quick-card {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
          padding: 13px;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          background: white;
          color: #0f172a;
          cursor: pointer;
          text-align: left;
          box-shadow: 0 10px 28px rgba(15,23,42,.045);
          transition: .25s ease;
        }

        .quick-card:hover {
          transform: translateY(-3px);
          border-color: #a7f3d0;
          box-shadow: 0 17px 40px rgba(15,23,42,.08);
        }

        .quick-icon {
          width: 42px;
          height: 42px;
          flex: 0 0 42px;
          display: grid;
          place-items: center;
          border-radius: 14px;
          background: #ecfdf5;
          color: #059669;
        }

        .quick-title {
          font-size: 10px;
          font-weight: 950;
        }

        .quick-copy {
          margin-top: 2px;
          color: #94a3b8;
          font-size: 7px;
          line-height: 1.4;
          font-weight: 700;
        }

        .orders-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 9px;
        }

        .order-card {
          padding: 14px;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          background: white;
          box-shadow: 0 10px 28px rgba(15,23,42,.045);
          animation: dashIn .5s ease both;
          transition: .25s ease;
        }

        .order-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 16px 40px rgba(15,23,42,.08);
        }

        .order-top {
          display: flex;
          justify-content: space-between;
          gap: 12px;
        }

        .order-number {
          color: #047857;
          font-size: 10px;
          font-weight: 950;
        }

        .order-date {
          margin-top: 3px;
          color: #94a3b8;
          font-size: 7px;
          font-weight: 700;
        }

        .order-items {
          margin-top: 7px;
          color: #475569;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 8px;
          font-weight: 750;
        }

        .order-total {
          color: #0f172a;
          font-size: 15px;
          font-weight: 950;
          text-align: right;
        }

        .order-status {
          display: inline-flex;
          margin-top: 4px;
          padding: 4px 7px;
          border-radius: 999px;
          font-size: 7px;
          font-weight: 950;
        }

        .order-footer {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          margin-top: 10px;
          padding-top: 9px;
          border-top: 1px solid #f1f5f9;
          color: #94a3b8;
          font-size: 7px;
          font-weight: 800;
        }

        /* Recent orders: keep the dashboard compact */
        .older-orders-panel {
          margin-top: 10px;
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          background: rgba(255,255,255,.94);
          overflow: hidden;
          box-shadow: 0 8px 24px rgba(15,23,42,.045);
        }

        .older-orders-toggle {
          width: 100%;
          min-height: 54px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 8px 12px;
          border: 0;
          background: transparent;
          color: #334155;
          cursor: pointer;
          text-align: left;
        }

        .older-orders-toggle:hover,
        .older-orders-toggle.open {
          background: #f8fafc;
        }

        .older-orders-toggle-left {
          display: flex;
          align-items: center;
          gap: 9px;
          min-width: 0;
        }

        .older-orders-icon {
          width: 32px;
          height: 32px;
          flex: 0 0 32px;
          display: grid;
          place-items: center;
          border-radius: 10px;
          background: #ecfdf5;
          color: #059669;
        }

        .older-orders-toggle strong {
          display: block;
          font-size: 9px;
          font-weight: 950;
        }

        .older-orders-toggle small {
          display: block;
          margin-top: 2px;
          color: #94a3b8;
          font-size: 7px;
          font-weight: 750;
        }

        .older-orders-content {
          display: grid;
          grid-template-rows: 0fr;
          opacity: 0;
          transition: grid-template-rows .3s ease, opacity .25s ease;
        }

        .older-orders-content.open {
          grid-template-rows: 1fr;
          opacity: 1;
        }

        .older-orders-list {
          min-height: 0;
          overflow: hidden;
          padding: 0 9px;
        }

        .older-order-item {
          overflow: hidden;
          margin-top: 7px;
          border: 1px solid #edf2f7;
          border-radius: 14px;
          background: #fff;
        }

        .older-order-main {
          width: 100%;
          min-height: 48px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding: 8px 9px;
          border: 0;
          background: transparent;
          color: #334155;
          cursor: pointer;
          text-align: left;
        }

        .older-order-main:hover {
          background: #f8fafc;
        }

        .older-order-info strong {
          display: block;
          color: #047857;
          font-size: 8px;
          font-weight: 950;
        }

        .older-order-info small {
          display: block;
          margin-top: 3px;
          color: #94a3b8;
          font-size: 6px;
          font-weight: 700;
        }

        .older-order-right {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .older-order-right > strong {
          color: #0f172a;
          font-size: 10px;
          font-weight: 950;
        }

        .older-order-right .order-status {
          margin-top: 0;
        }

        .older-order-details {
          display: grid;
          grid-template-rows: 0fr;
          opacity: 0;
          transition: grid-template-rows .25s ease, opacity .2s ease;
        }

        .older-order-details.open {
          grid-template-rows: 1fr;
          opacity: 1;
        }

        .older-order-details-inner {
          min-height: 0;
          overflow: hidden;
          padding: 0 10px;
        }

        .older-order-products {
          padding: 9px 0;
          border-top: 1px solid #f1f5f9;
          color: #475569;
          font-size: 7px;
          line-height: 1.45;
          font-weight: 750;
        }

        .older-order-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding: 7px 0 9px;
          color: #94a3b8;
          font-size: 6px;
          font-weight: 800;
        }

        .older-order-meta span {
          display: inline-flex;
          align-items: center;
          gap: 3px;
        }

        .view-all-orders-btn {
          width: calc(100% - 18px);
          min-height: 36px;
          margin: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          border: 1px solid #a7f3d0;
          border-radius: 11px;
          background: #ecfdf5;
          color: #047857;
          cursor: pointer;
          font-size: 8px;
          font-weight: 950;
        }

        .view-all-orders-btn:hover {
          background: #d1fae5;
        }

        .dashboard-bottom-nav {
          display: none;
        }

        /* =========================================================
           MOBILE-FIRST DASHBOARD LOADING SCREEN
           ========================================================= */

        .dashboard-loading {
          position: fixed;
          inset: 0;
          z-index: 9999;
          width: 100%;
          min-height: 100dvh;
          display: flex;
          align-items: center;
          justify-content: center;
          box-sizing: border-box;
          padding: 20px 14px;
          overflow: hidden;
          background:
            radial-gradient(circle at 15% 15%, rgba(16,185,129,.16), transparent 28%),
            radial-gradient(circle at 90% 85%, rgba(45,212,191,.14), transparent 30%),
            linear-gradient(145deg, #f0fdf4 0%, #ffffff 48%, #ecfeff 100%);
          text-align: center;
        }

        .dashboard-loading::before {
          content: "";
          position: absolute;
          width: 260px;
          height: 260px;
          left: -150px;
          top: -130px;
          border-radius: 50%;
          background: rgba(16,185,129,.08);
          filter: blur(8px);
          animation: loadingFloat 7s ease-in-out infinite;
        }

        .dashboard-loading::after {
          content: "";
          position: absolute;
          width: 230px;
          height: 230px;
          right: -130px;
          bottom: -120px;
          border-radius: 50%;
          background: rgba(20,184,166,.08);
          filter: blur(8px);
          animation: loadingFloat 8s ease-in-out infinite reverse;
        }

        .dashboard-loading-card {
          position: relative;
          z-index: 2;
          width: min(92vw, 360px);
          display: flex;
          flex-direction: column;
          align-items: center;
          box-sizing: border-box;
          padding: 28px 20px 24px;
          border: 1px solid rgba(255,255,255,.95);
          border-radius: 30px;
          background: rgba(255,255,255,.90);
          box-shadow:
            0 25px 70px rgba(15,23,42,.10),
            0 5px 20px rgba(5,150,105,.06);
          backdrop-filter: blur(6px);
          animation: loadingCardIn .5s cubic-bezier(.22,1,.36,1) both;
        }

        /* Strict logo sizing prevents global img CSS from enlarging it. */
        .dashboard-loading-logo {
          width: 78px !important;
          height: 78px !important;
          min-width: 78px !important;
          min-height: 78px !important;
          max-width: 78px !important;
          max-height: 78px !important;
          flex: 0 0 78px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          overflow: hidden !important;
          box-sizing: border-box !important;
          padding: 5px !important;
          margin: 0 !important;
          border: 1px solid #d1fae5;
          border-radius: 23px;
          background: #fff;
          box-shadow: 0 12px 30px rgba(5,150,105,.14);
          animation: loadingLogoFloat 2.8s ease-in-out infinite;
        }

        .dashboard-loading-logo img {
          display: block !important;
          width: 66px !important;
          height: 66px !important;
          min-width: 66px !important;
          min-height: 66px !important;
          max-width: 66px !important;
          max-height: 66px !important;
          flex: 0 0 66px !important;
          margin: 0 !important;
          padding: 0 !important;
          object-fit: contain !important;
          object-position: center !important;
          border: 0 !important;
          border-radius: 16px !important;
        }

        .dashboard-loading-ring {
          position: relative;
          width: 30px;
          height: 30px;
          margin-top: 19px;
          border: 3px solid #d1fae5;
          border-top-color: #059669;
          border-right-color: #10b981;
          border-radius: 50%;
          animation: loadingSpin .85s linear infinite;
        }

        .dashboard-loading-ring span {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 5px;
          height: 5px;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          background: #059669;
        }

        .dashboard-loading-brand {
          margin-top: 14px;
          color: #047857;
          font-size: 17px;
          line-height: 1;
          font-weight: 950;
          letter-spacing: -.04em;
        }

        .dashboard-loading h2 {
          margin: 9px 0 0;
          color: #0f172a;
          font-size: 19px;
          line-height: 1.15;
          font-weight: 950;
          letter-spacing: -.035em;
        }

        .dashboard-loading p {
          max-width: 280px;
          margin: 7px 0 0;
          color: #64748b;
          font-size: 10px;
          line-height: 1.55;
          font-weight: 650;
        }

        .dashboard-loading-progress {
          width: min(210px, 72%);
          height: 4px;
          margin-top: 17px;
          overflow: hidden;
          border-radius: 999px;
          background: #e2e8f0;
        }

        .dashboard-loading-progress span {
          display: block;
          width: 36%;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #059669, #10b981, #14b8a6);
          animation: loadingProgress 1.35s ease-in-out infinite;
        }

        .dashboard-loading-retry {
          min-height: 40px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          margin-top: 17px;
          padding: 0 18px;
          border: 0;
          border-radius: 13px;
          background: linear-gradient(135deg, #059669, #0d9488);
          color: #fff;
          cursor: pointer;
          font-size: 10px;
          font-weight: 950;
          box-shadow: 0 10px 24px rgba(5,150,105,.22);
          transition: transform .2s ease, box-shadow .2s ease, filter .2s ease;
        }

        .dashboard-loading-retry:hover {
          transform: translateY(-2px);
          filter: brightness(1.04);
          box-shadow: 0 14px 28px rgba(5,150,105,.27);
        }

        .dashboard-loading-retry:active {
          transform: scale(.97);
        }

        @keyframes loadingSpin {
          to { transform: rotate(360deg); }
        }

        @keyframes loadingProgress {
          0% { transform: translateX(-150%); }
          100% { transform: translateX(420%); }
        }

        @keyframes loadingLogoFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }

        @keyframes loadingFloat {
          0%, 100% { transform: translate3d(0,0,0); }
          50% { transform: translate3d(0,-15px,0); }
        }

        @keyframes loadingCardIn {
          from {
            opacity: 0;
            transform: translateY(14px) scale(.975);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @media (max-width: 820px) {
          .customer-dashboard {
            padding: 9px 10px 100px;
          }

          .dashboard-mobile-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            margin: 3px 2px 10px;
          }

          .dashboard-mobile-brand {
            display: flex;
            align-items: center;
            gap: 8px;
            min-width: 0;
          }

          .dashboard-mobile-brand img {
            width: 37px;
            height: 37px;
            object-fit: contain;
            border-radius: 12px;
            padding: 3px;
            background: white;
            box-shadow: 0 5px 14px rgba(15,23,42,.08);
          }

          .dashboard-mobile-brand strong {
            display: block;
            color: #0f172a;
            font-size: 12px;
            font-weight: 950;
          }

          .dashboard-mobile-brand span {
            display: block;
            margin-top: 1px;
            color: #94a3b8;
            font-size: 7px;
            font-weight: 800;
            letter-spacing: .08em;
          }

          .dashboard-mobile-user {
            display: flex;
            align-items: center;
            gap: 5px;
            max-width: 48%;
            padding: 7px 9px;
            border: 1px solid #e2e8f0;
            border-radius: 13px;
            background: white;
            color: #475569;
            font-size: 8px;
            font-weight: 900;
          }

          .dashboard-hero {
            border-radius: 25px;
            padding: 17px;
          }

          .dashboard-hero-logo-card {
            display: none;
          }

          .dashboard-brand-line {
            gap: 8px;
          }

          .dashboard-logo {
            width: 43px;
            height: 43px;
            flex-basis: 43px;
            border-radius: 14px;
          }

          .dashboard-brand-name {
            font-size: 12px;
          }

          .dashboard-brand-subtitle {
            font-size: 6px;
          }

          .dashboard-hero-badge {
            margin-top: 16px;
            padding: 6px 9px;
            font-size: 7px;
          }

          .dashboard-hero-title {
            margin-top: 11px;
            font-size: 28px;
          }

          .dashboard-hero-copy {
            margin-top: 8px;
            font-size: 9px;
            line-height: 1.55;
          }

          .dashboard-actions {
            grid-template-columns: repeat(2, 1fr);
            gap: 7px;
            margin-top: 15px;
          }

          .dashboard-action {
            min-height: 42px;
            border-radius: 13px;
            font-size: 8px;
            box-shadow: 0 7px 16px rgba(0,0,0,.15);
          }

          .dashboard-action.primary {
            box-shadow: 0 8px 18px rgba(5,150,105,.36);
          }

          .dashboard-action:nth-child(2) {
            box-shadow: 0 8px 18px rgba(249,115,22,.28);
          }

          .dashboard-action:nth-child(3) {
            box-shadow: 0 8px 18px rgba(37,99,235,.26);
          }

          .dashboard-action:nth-child(4) {
            box-shadow: 0 8px 18px rgba(220,38,38,.24);
          }

          .dashboard-section {
            margin-top: 18px;
          }

          .dashboard-section-title {
            font-size: 19px;
          }

          .dashboard-section-copy {
            font-size: 8px;
          }

          .dashboard-stats {
            grid-template-columns: repeat(2, 1fr);
            gap: 7px;
          }

          .dashboard-stat {
            padding: 11px;
            border-radius: 17px;
          }

          .dashboard-stat-label {
            font-size: 6px;
          }

          .dashboard-stat-value {
            margin-top: 6px;
            font-size: 18px;
          }

          .dashboard-stat-icon {
            width: 31px;
            height: 31px;
            border-radius: 10px;
          }

          .wallet-billing-grid {
            grid-template-columns: 1fr;
            gap: 7px;
          }

          .wallet-card {
            min-height: 165px;
            padding: 14px;
            border-radius: 21px;
          }

          .wallet-card > strong {
            font-size: 24px;
          }

          .wallet-card > p {
            font-size: 7px;
          }

          .subscription-card {
            flex-basis: 91vw;
            border-radius: 23px;
          }

          .subscription-card-top {
            padding: 14px;
          }

          .subscription-card-body {
            padding: 13px;
          }

          .quick-grid {
            grid-template-columns: 1fr;
            gap: 7px;
          }

          .quick-card {
            padding: 11px;
            border-radius: 17px;
          }

          .orders-grid {
            grid-template-columns: 1fr;
          }

          .dashboard-bottom-nav {
            position: fixed;
            z-index: 70;
            left: 10px;
            right: 10px;
            bottom: 10px;
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 4px;
            padding: 6px;
            border: 1px solid rgba(226,232,240,.9);
            border-radius: 22px;
            background: rgba(255,255,255,.93);
            box-shadow: 0 18px 45px rgba(15,23,42,.16);
            backdrop-filter: blur(20px);
          }

          .dashboard-bottom-item {
            min-height: 49px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 3px;
            border: 0;
            border-radius: 16px;
            background: transparent;
            color: #94a3b8;
            cursor: pointer;
            font-size: 7px;
            font-weight: 950;
          }

          .dashboard-bottom-item.active {
            color: #047857;
            background: #ecfdf5;
          }
        }

        @media (max-width: 480px) {
          .dashboard-loading {
            padding: 16px 10px;
          }

          .dashboard-loading-card {
            width: min(94vw, 340px);
            padding: 24px 17px 21px;
            border-radius: 25px;
          }

          .dashboard-loading-logo {
            width: 70px !important;
            height: 70px !important;
            min-width: 70px !important;
            min-height: 70px !important;
            max-width: 70px !important;
            max-height: 70px !important;
            flex-basis: 70px !important;
            border-radius: 21px;
          }

          .dashboard-loading-logo img {
            width: 59px !important;
            height: 59px !important;
            min-width: 59px !important;
            min-height: 59px !important;
            max-width: 59px !important;
            max-height: 59px !important;
            flex-basis: 59px !important;
          }

          .dashboard-loading-brand {
            font-size: 15px;
          }

          .dashboard-loading h2 {
            font-size: 17px;
          }

          .dashboard-loading p {
            font-size: 9px;
          }
        }

        @media (max-width: 380px) {
          .customer-dashboard {
            padding-left: 7px;
            padding-right: 7px;
          }

          .dashboard-hero-title {
            font-size: 25px;
          }

          .dashboard-hero-copy {
            font-size: 8px;
          }

          .dashboard-action {
            font-size: 7px;
          }

          .subscription-card {
            flex-basis: 94vw;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .customer-dashboard *,
          .dashboard-loading * {
            animation: none !important;
            transition: none !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>

      <div className="dashboard-container">
        {/* Compact mobile brand bar */}
        <div className="dashboard-mobile-top">
          <div className="dashboard-mobile-brand">
            <img src={LOGO_SRC} alt="Farm Fresh Dairy" />
            <div>
              <strong>FarmFreshDairy</strong>
              <span>FRESHNESS DELIVERED DAILY</span>
            </div>
          </div>

          <div className="dashboard-mobile-user">
            <UserRound size={13} />
            <span>{customerName}</span>
          </div>
        </div>

        {/* Hero */}
        <section className="dashboard-hero">
          <div className="dashboard-hero-shine" />

          <div className="dashboard-hero-content">
            <div className="dashboard-hero-row">
              <div>
                <div className="dashboard-brand-line">
                  <img
                    src={LOGO_SRC}
                    alt="Farm Fresh Dairy"
                    className="dashboard-logo"
                  />
                  <div>
                    <div className="dashboard-brand-name">
                      FarmFreshDairy
                    </div>
                    <div className="dashboard-brand-subtitle">
                      Freshness delivered daily
                    </div>
                  </div>
                </div>

                <div className="dashboard-hero-badge">
                  <span className="dashboard-hero-badge-dot" />
                  Customer dashboard
                </div>

                <h1 className="dashboard-hero-title">
                  Welcome back, <span>{customerName}</span> 👋
                </h1>

                <p className="dashboard-hero-copy">
                  Manage your milk subscriptions, deliveries, orders and
                  account from one simple place.
                </p>
              </div>

              <div className="dashboard-hero-logo-card">
                <img src={LOGO_SRC} alt="Farm Fresh Dairy" />
                <span>Fresh daily</span>
              </div>
            </div>

            <div className="dashboard-actions">
              <button
                className="dashboard-action primary"
                onClick={() => navigate("/products")}
              >
                <ShoppingBag size={14} />
                Shop
                <ArrowRight size={12} />
              </button>

              <button
                className="dashboard-action"
                onClick={() => navigate("/subscription/create/:productId")}
              >
                <Plus size={14} />
                Subscribe
              </button>

              <button
                className="dashboard-action"
                onClick={() => navigate("/order-history")}
              >
                <Package size={14} />
                Orders
              </button>

              <button className="dashboard-action" onClick={handleLogout}>
                <LogOut size={14} />
                Logout
              </button>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="dashboard-section">
          <div className="dashboard-stats">
            <ModernStat
              icon={<Package size={17} />}
              label="Total orders"
              value={summary.totalOrders}
            />
            <ModernStat
              icon={<RefreshCw size={17} />}
              label="Subscriptions"
              value={summary.totalSubscriptions}
            />
            <ModernStat
              icon={<CheckCircle2 size={17} />}
              label="Active plans"
              value={summary.activeSubscriptions}
            />
            <ModernStat
              icon={<Bell size={17} />}
              label="Status"
              value={
                summary.activeSubscriptions > 0
                  ? "Active"
                  : summary.totalSubscriptions > 0
                  ? "Paused"
                  : "None"
              }
            />
          </div>
        </section>

        {/* Wallet & Billing */}
        <section className="dashboard-section wallet-billing-section">
          <div className="wallet-billing-grid">
            <article className="wallet-card prepaid-card">
              <div className="wallet-card-orb" />
              <div className="wallet-card-head">
                <span><WalletCards size={17} /> Wallet</span>
                <b>PREPAID</b>
              </div>
              <small>Available balance</small>
              <strong>
                {walletBalance === null
                  ? "—"
                  : formatMoney(walletBalance)}
              </strong>
              <p>
                {walletBalance === null
                  ? "Wallet balance will appear when wallet data is available."
                  : "Used automatically for prepaid subscription deliveries."}
              </p>
              <button type="button" onClick={() => navigate("/wallet")}>
                <CreditCard size={13} />
                Manage Wallet
                <ArrowRight size={12} />
              </button>
            </article>

            <article className="wallet-card postpaid-card">
              <div className="wallet-card-head">
                <span><CreditCard size={17} /> Billing</span>
                <b>POSTPAID</b>
              </div>
              <small>Outstanding amount</small>
              <strong>
                {outstanding === null
                  ? "—"
                  : formatMoney(outstanding)}
              </strong>
              <p>
                COD/postpaid deliveries accumulate here as monthly outstanding.
              </p>
              <button type="button" onClick={() => navigate("/billing")}>
                <CalendarDays size={13} />
                View Billing
                <ArrowRight size={12} />
              </button>
            </article>
          </div>
        </section>

        {/* Extra Milk */}
        <section className="dashboard-extra">
          <ExtraMilkCard navigate={navigate} />
        </section>

        {/* Subscriptions */}
        <section className="dashboard-section">
          <div className="dashboard-section-header">
            <div>
              <div className="dashboard-eyebrow">Your daily routine</div>
              <h2 className="dashboard-section-title">My Subscriptions</h2>
              <p className="dashboard-section-copy">
                Manage your milk delivery plans
              </p>
            </div>

            <div className="dashboard-scroll-buttons">
              <button
                className="dashboard-circle-btn"
                onClick={() => scrollSubscriptions("left")}
                aria-label="Previous subscription"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                className="dashboard-circle-btn"
                onClick={() => scrollSubscriptions("right")}
                aria-label="Next subscription"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>

          {activeSubscriptions.length === 0 ? (
            <div className="empty-card">
              <img
                className="empty-logo"
                src={LOGO_SRC}
                alt="Farm Fresh Dairy"
              />
              <div className="empty-title">No active subscription</div>
              <p className="empty-copy">
                Start a fresh daily milk plan and make your morning delivery
                effortless.
              </p>
              <button
                className="primary-btn"
               onClick={() => navigate("/subscription/create/:productId")}
              >
                Start Subscription
                <ArrowRight size={13} />
              </button>
            </div>
          ) : (
            <div
              ref={subscriptionScrollRef}
              className="dashboard-subscription-strip"
            >
              {activeSubscriptions.map((sub, index) => {
                const deliverySummary = deliverySummaries[sub.id] || {
                  delivered: 0,
                  outForDelivery: 0,
                  skipped: 0,
                };

                const isPaused = sub.is_paused === true;
                const status = isPaused
                  ? "paused"
                  : (sub.status || "Active").toLowerCase();

                const isActive = !isPaused && status === "active";
                const isStopped = status === "stopped";
                const remainingDays = getRemainingDays(sub.expireDate);
                const isExpanded = expandedSubscriptionId === sub.id;

                const progressPercent =
                  remainingDays === null
                    ? 0
                    : Math.min(
                        100,
                        Math.max(0, ((30 - remainingDays) / 30) * 100)
                      );

                return (
                  <article
                    key={sub.id}
                    className="subscription-card"
                    style={{
                      animation: `dashIn .55s ease-out ${
                        index * 80
                      }ms both`,
                    }}
                  >
                    <div className="subscription-card-top">
                      <div className="subscription-card-head">
                        <div className="subscription-brand">
                          <img
                            src={LOGO_SRC}
                            alt="Farm Fresh Dairy"
                            className="subscription-logo"
                          />
                          <div>
                            <div className="subscription-kicker">
                              Milk subscription
                            </div>
                            <div className="subscription-size">
                              {sub.size || "500 ml"}
                            </div>
                          </div>
                        </div>

                        <span className="subscription-status">
                          {isPaused ? "Paused" : status}
                        </span>
                      </div>

                      <div className="subscription-top-metrics">
                        <div className="subscription-metric">
                          <div className="subscription-metric-label">
                            Daily quantity
                          </div>
                          <div className="subscription-metric-value">
                            {sub.quantity || 1} bottle
                            {Number(sub.quantity) > 1 ? "s" : ""}
                          </div>
                        </div>

                        <div className="subscription-metric">
                          <div className="subscription-metric-label">
                            Monthly
                          </div>
                          <div className="subscription-metric-value">
                            {formatMoney(sub.monthlyAmount)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="subscription-card-body">
                      <div className="subscription-dates">
                        <div>
                          <div className="subscription-date-label">Starts</div>
                          <div className="subscription-date-value">
                            {formatDate(sub.startDate)}
                          </div>
                        </div>

                        <div>
                          <div className="subscription-progress">
                            <span style={{ width: `${progressPercent}%` }} />
                          </div>
                          <div className="subscription-progress-label">
                            Plan progress
                          </div>
                        </div>

                        <div style={{ textAlign: "right" }}>
                          <div className="subscription-date-label">
                            Expires
                          </div>
                          <div className="subscription-date-value">
                            {formatDate(sub.expireDate)}
                          </div>
                        </div>
                      </div>

                      {remainingDays !== null && (
                        <div
                          className={`subscription-validity ${
                            remainingDays <= 7 ? "warning" : ""
                          }`}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            {remainingDays <= 7 ? (
                              <Clock3 size={15} color="#c2410c" />
                            ) : (
                              <CalendarDays size={15} color="#047857" />
                            )}
                            <strong>
                              {remainingDays}{" "}
                              {remainingDays === 1 ? "Day" : "Days"} Remaining
                            </strong>
                          </div>

                          {remainingDays <= 7 && remainingDays > 0 && (
                            <span>Renew soon</span>
                          )}
                        </div>
                      )}

                      <button
                        type="button"
                        className="subscription-detail-btn"
                        onClick={() =>
                          setExpandedSubscriptionId(
                            isExpanded ? null : sub.id
                          )
                        }
                      >
                        <span>
                          <span className="subscription-detail-title">
                            {isExpanded
                              ? "Hide subscription details"
                              : "View subscription details"}
                          </span>
                          <span className="subscription-detail-copy">
                            Payment • Delivery • Dates
                          </span>
                        </span>

                        <ChevronDown
                          size={15}
                          style={{
                            transform: isExpanded
                              ? "rotate(180deg)"
                              : "rotate(0deg)",
                            transition: ".3s ease",
                          }}
                        />
                      </button>

                      <div
                        className={`subscription-details ${
                          isExpanded ? "open" : ""
                        }`}
                      >
                        <div className="subscription-details-inner">
                          <div className="detail-grid">
                            <DetailBox
                              label="Size"
                              value={sub.size || "N/A"}
                            />
                            <DetailBox
                              label="Quantity"
                              value={`${sub.quantity || 1} bottle/day`}
                            />
                            <DetailBox
                              label="Delivery"
                              value={sub.deliveryType || "N/A"}
                            />
                            <DetailBox
                              label="Monthly"
                              value={formatMoney(sub.monthlyAmount)}
                            />
                            <DetailBox
                              label="Payment"
                              value={sub.payment_status || "Pending"}
                            />
                            <DetailBox
                              label="Payment amount"
                              value={formatMoney(
                                sub.payment_amount ??
                                  sub.total_amount ??
                                  sub.monthlyAmount
                              )}
                            />
                            <DetailBox
                              label="Payment method"
                              value={sub.payment_method || "N/A"}
                            />
                            <DetailBox
                              label="Payment date"
                              value={
                                sub.payment_date
                                  ? formatDate(sub.payment_date)
                                  : "Not Paid Yet"
                              }
                            />
                            <DetailBox
                              label="Delivered"
                              value={deliverySummary.delivered || 0}
                            />
                            <DetailBox
                              label="Out for delivery"
                              value={deliverySummary.outForDelivery || 0}
                            />
                            <DetailBox
                              label="Skipped"
                              value={deliverySummary.skipped || 0}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="subscription-buttons">
                        {isActive && (
                          <button
                            onClick={() => {
                              setSelectedSubscription(sub);
                              setShowPauseModal(true);
                            }}
                            disabled={statusUpdatingId === sub.id}
                            className="subscription-btn pause"
                          >
                            <Pause size={13} />
                            Pause
                          </button>
                        )}

                        {(isPaused || isStopped) && (
                          <button
                            onClick={() => handleResume(sub.id)}
                            disabled={statusUpdatingId === sub.id}
                            className="subscription-btn resume"
                          >
                            <Play size={13} />
                            {statusUpdatingId === sub.id
                              ? "Activating..."
                              : "Activate"}
                          </button>
                        )}

                        <button
                          onClick={() =>
                            navigate(`/subscription/manage/${sub.id}`)
                          }
                          className="subscription-btn manage"
                        >
                          <RefreshCw size={13} />
                          Manage
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Quick actions */}
        <section className="dashboard-section">
          <div className="dashboard-section-header">
            <div>
              <div className="dashboard-eyebrow">Quick access</div>
              <h2 className="dashboard-section-title">What do you need?</h2>
            </div>
          </div>

          <div className="quick-grid">
            <ModernQuick
              icon={<Package size={18} />}
              title="Order History"
              desc="View orders and delivery status"
              onClick={() => navigate("/order-history")}
            />

            <ModernQuick
              icon={<RefreshCw size={18} />}
              title="Subscription"
              desc="Start or renew your milk plan"
              onClick={() => navigate("/subscription/create/:productId")}
            />

            <ModernQuick
              icon={<ShoppingBag size={18} />}
              title="Shop Products"
              desc="Milk, curd, ghee and paneer"
              onClick={() => navigate("/products")}
            />
          </div>
        </section>

        {/* Recent orders */}
        <section className="dashboard-section">
          <div className="dashboard-section-header">
            <div>
              <div className="dashboard-eyebrow">Latest activity</div>
              <h2 className="dashboard-section-title">Recent Orders</h2>
              <p className="dashboard-section-copy">
                Your 3 latest orders are shown here
              </p>
            </div>

            <button
              className="dashboard-circle-btn"
              onClick={() => navigate("/order-history")}
              aria-label="View all orders"
            >
              <ArrowRight size={15} />
            </button>
          </div>

          {latestOrders.length === 0 ? (
            <div className="empty-card">
              <img
                className="empty-logo"
                src={LOGO_SRC}
                alt="Farm Fresh Dairy"
              />
              <div className="empty-title">No orders yet</div>
              <p className="empty-copy">
                Your latest orders will appear here.
              </p>
              <button
                onClick={() => navigate("/products")}
                className="primary-btn"
              >
                Start Shopping
                <ArrowRight size={13} />
              </button>
            </div>
          ) : (
            <>
              {/* Always show only the latest 3 orders */}
              <div className="orders-grid">
                {visibleRecentOrders.map((order, index) => {
                  const statusClass =
                    order.status === "Delivered"
                      ? {
                          background: "#dcfce7",
                          color: "#047857",
                        }
                      : order.status === "Cancelled"
                      ? {
                          background: "#fee2e2",
                          color: "#b91c1c",
                        }
                      : {
                          background: "#fef3c7",
                          color: "#b45309",
                        };

                  return (
                    <OrderSummaryCard
                      key={order.id}
                      order={order}
                      index={index}
                      statusClass={statusClass}
                    />
                  );
                })}
              </div>

              {/* Older orders stay hidden until the user asks to see them */}
              {olderOrders.length > 0 && (
                <div className="older-orders-panel">
                  <button
                    type="button"
                    className={`older-orders-toggle ${
                      showOlderOrders ? "open" : ""
                    }`}
                    onClick={() => setShowOlderOrders((value) => !value)}
                    aria-expanded={showOlderOrders}
                  >
                    <span className="older-orders-toggle-left">
                      <span className="older-orders-icon">
                        <Clock3 size={14} />
                      </span>
                      <span>
                        <strong>
                          {showOlderOrders
                            ? "Hide older orders"
                            : "View older orders"}
                        </strong>
                        <small>
                          {olderOrders.length} older order
                          {olderOrders.length === 1 ? "" : "s"}
                        </small>
                      </span>
                    </span>

                    <ChevronDown
                      size={17}
                      style={{
                        transform: showOlderOrders
                          ? "rotate(180deg)"
                          : "rotate(0deg)",
                        transition: ".25s ease",
                      }}
                    />
                  </button>

                  <div
                    className={`older-orders-content ${
                      showOlderOrders ? "open" : ""
                    }`}
                  >
                    <div className="older-orders-list">
                      {olderOrders.map((order, index) => {
                        const statusClass =
                          order.status === "Delivered"
                            ? {
                                background: "#dcfce7",
                                color: "#047857",
                              }
                            : order.status === "Cancelled"
                            ? {
                                background: "#fee2e2",
                                color: "#b91c1c",
                              }
                            : {
                                background: "#fef3c7",
                                color: "#b45309",
                              };

                        const isExpanded = expandedOrderId === order.id;

                        return (
                          <div
                            key={order.id}
                            className={`older-order-item ${
                              isExpanded ? "expanded" : ""
                            }`}
                          >
                            <button
                              type="button"
                              className="older-order-main"
                              onClick={() =>
                                setExpandedOrderId(
                                  isExpanded ? null : order.id
                                )
                              }
                              aria-expanded={isExpanded}
                            >
                              <span className="older-order-info">
                                <strong>#{order.orderNumber}</strong>
                                <small>
                                  {order.orderDate
                                    ? new Date(
                                        order.orderDate
                                      ).toLocaleDateString("en-IN")
                                    : "N/A"}
                                </small>
                              </span>

                              <span className="older-order-right">
                                <strong>₹{order.totalAmount}</strong>
                                <span
                                  className="order-status"
                                  style={statusClass}
                                >
                                  {order.status}
                                </span>
                                <ChevronDown
                                  size={14}
                                  style={{
                                    transform: isExpanded
                                      ? "rotate(180deg)"
                                      : "rotate(0deg)",
                                    transition: ".25s ease",
                                  }}
                                />
                              </span>
                            </button>

                            <div
                              className={`older-order-details ${
                                isExpanded ? "open" : ""
                              }`}
                            >
                              <div className="older-order-details-inner">
                                <div className="older-order-products">
                                  {order.items
                                    ?.map((item) => item.products?.name)
                                    .filter(Boolean)
                                    .join(", ") || "Products"}
                                </div>

                                <div className="older-order-meta">
                                  <span>
                                    <CreditCard size={11} />
                                    {order.paymentMethod || "N/A"}
                                  </span>
                                  <span>
                                    {order.totalItems || 0} item(s)
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      className="view-all-orders-btn"
                      onClick={() => navigate("/order-history")}
                    >
                      View complete order history
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>

        {/* Bottom navigation for mobile */}
        <nav className="dashboard-bottom-nav">
          <button
            className="dashboard-bottom-item active"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <img
              src={LOGO_SRC}
              alt=""
              style={{
                width: 21,
                height: 21,
                objectFit: "contain",
                borderRadius: 7,
              }}
            />
            Home
          </button>

          <button
            className="dashboard-bottom-item"
            onClick={() => navigate("/products")}
          >
            <ShoppingBag size={18} />
            Products
          </button>

          <button
            className="dashboard-bottom-item"
            onClick={() => navigate("/products")}
          >
            <RefreshCw size={18} />
            Subscribe
          </button>

          <button
            className="dashboard-bottom-item"
            onClick={() => navigate("/order-history")}
          >
            <Package size={18} />
            Orders
          </button>
        </nav>
      </div>

      <PauseSubscriptionModal
        open={showPauseModal}
        subscription={selectedSubscription}
        loading={loading}
        onClose={() => {
          setShowPauseModal(false);
          setSelectedSubscription(null);
        }}
        onConfirm={handlePauseConfirm}
      />
    </div>
  );
}


function OrderSummaryCard({ order, index = 0, statusClass }) {
  const itemsText =
    order.items
      ?.map((item) => item?.products?.name || item?.name)
      .filter(Boolean)
      .join(", ") || "Products";

  const orderDate = order.orderDate
    ? new Date(order.orderDate)
    : null;

  const formattedDate =
    orderDate && !Number.isNaN(orderDate.getTime())
      ? orderDate.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : order.orderDate || "N/A";

  const amount = Number(order.totalAmount ?? order.total ?? 0);
  const formattedAmount = Number.isFinite(amount)
    ? `₹${amount.toLocaleString("en-IN", {
        maximumFractionDigits: 2,
      })}`
    : "₹0";

  return (
    <article
      className="order-card"
      style={{
        animationDelay: `${index * 70}ms`,
      }}
    >
      <div className="order-top">
        <div>
          <div className="order-number">
            #{order.orderNumber || order.id || "Order"}
          </div>

          <div className="order-date">
            {formattedDate}
          </div>
        </div>

        <div>
          <div className="order-total">
            {formattedAmount}
          </div>

          <span
            className="order-status"
            style={
              statusClass || {
                background: "#fef3c7",
                color: "#b45309",
              }
            }
          >
            {order.status || "Pending"}
          </span>
        </div>
      </div>

      <div className="order-items" title={itemsText}>
        {itemsText}
      </div>

      <div className="order-footer">
        <span>
          <CreditCard size={9} style={{ verticalAlign: "middle", marginRight: 3 }} />
          {order.paymentMethod || "Cash on Delivery"}
        </span>

        <span>
          {order.totalItems ?? order.items?.length ?? 0} item(s)
        </span>
      </div>
    </article>
  );
}

function ModernStat({ icon, label, value }) {
  return (
    <div className="dashboard-stat">
      <div className="dashboard-stat-top">
        <div>
          <div className="dashboard-stat-label">{label}</div>
          <div className="dashboard-stat-value">{value}</div>
        </div>

        <div className="dashboard-stat-icon">{icon}</div>
      </div>
    </div>
  );
}

function DetailBox({ label, value }) {
  return (
    <div className="detail-box">
      <label>{label}</label>
      <strong>{value}</strong>
    </div>
  );
}

function ModernQuick({ icon, title, desc, onClick }) {
  return (
    <button className="quick-card" onClick={onClick}>
      <span className="quick-icon">{icon}</span>

      <span style={{ minWidth: 0 }}>
        <span className="quick-title">{title}</span>
        <span className="quick-copy">{desc}</span>
      </span>

      <ArrowRight
        size={14}
        style={{ marginLeft: "auto", flexShrink: 0, color: "#cbd5e1" }}
      />
    </button>
  );
}
