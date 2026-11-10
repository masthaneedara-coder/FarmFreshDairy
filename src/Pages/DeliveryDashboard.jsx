import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getDelivery,
  getDeliveryName,
  isDeliveryLoggedIn,
  logoutDelivery,
} from "../config/auth";
import { updateOrderStatus } from "../config/api";
import { fetchDeliveryDashboard } from "../services/deliveryDashboardService";
import { updateSubscriptionDeliveryStatus } from "../services/subscriptionDeliveryService";

const LOGO_SRC = "/logo.png";

function getDeliveryItems(delivery) {
  return Array.isArray(delivery?.items) ? delivery.items : [];
}

function isStatusLocked(delivery) {
  return ["Delivered", "Missed"].includes(
    String(delivery?.status || "").trim()
  );
}

function getSizeInLiters(size) {
  if (!size) return 0;

  const value = String(size).toLowerCase().replace(/\s+/g, "");
  const match = value.match(/(\d+(?:\.\d+)?)(ml|l|ltr|liter|litre)/);
  if (!match) return 0;

  const amount = Number(match[1]);
  if (!Number.isFinite(amount)) return 0;
  return match[2] === "ml" ? amount / 1000 : amount;
}

function getBottleType(size) {
  const liters = getSizeInLiters(size);
  if (liters === 0.5) return "500ml";
  if (liters === 1) return "1L";
  if (liters === 2) return "2L";
  if (liters === 5) return "5L";
  return null;
}

function calculateMilkSummary(list) {
  const summary = {
    totalLiters: 0,
    bottles500ml: 0,
    bottles1L: 0,
    bottles2L: 0,
    bottles5L: 0,
  };

  list.forEach((delivery) => {
    getDeliveryItems(delivery).forEach((item) => {
      const quantity = Math.max(0, Number(item.quantity || 0));
      const liters = getSizeInLiters(item.size);
      summary.totalLiters += quantity * liters;

      const type = getBottleType(item.size);
      if (type === "500ml") summary.bottles500ml += quantity;
      if (type === "1L") summary.bottles1L += quantity;
      if (type === "2L") summary.bottles2L += quantity;
      if (type === "5L") summary.bottles5L += quantity;
    });
  });

  return summary;
}

function formatDeliveryDate(value) {
  if (!value) return "Date not set";
  const datePart = String(value).slice(0, 10);
  const parsed = new Date(`${datePart}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return String(value);

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getDeliveryNumber(delivery) {
  return (
    delivery?.number ||
    delivery?.delivery_number ||
    delivery?.order_number ||
    String(delivery?.id || "").slice(0, 8).toUpperCase() ||
    "—"
  );
}

function getAddress(delivery) {
  return [
    delivery.address?.house_no,
    delivery.address?.street,
    delivery.address?.area,
    delivery.address?.city,
    delivery.address?.state,
    delivery.address?.pincode,
  ]
    .filter(Boolean)
    .join(", ");
}

function getStatusTone(status) {
  const value = String(status || "").toLowerCase();
  if (value === "delivered") return "delivered";
  if (value === "missed" || value === "failed" || value === "cancelled") return "missed";
  if (value === "out for delivery") return "moving";
  if (value === "assigned") return "assigned";
  return "pending";
}

export default function DeliveryDashboard() {
  const navigate = useNavigate();
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState("");
  const [search, setSearch] = useState("");
  const [selectedShift, setSelectedShift] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All Deliveries");
  const [expandedDeliveryId, setExpandedDeliveryId] = useState(null);

  const loadDeliveries = useCallback(async ({ silent = false } = {}) => {
    try {
      if (silent) setRefreshing(true);
      else setLoading(true);

      const deliveryBoy = getDelivery();
      if (!deliveryBoy?.id) {
        setDeliveries([]);
        return;
      }

      const res = await fetchDeliveryDashboard(deliveryBoy.id);
      if (res?.success) {
        setDeliveries(Array.isArray(res.deliveries) ? res.deliveries : []);
      } else {
        setDeliveries([]);
      }
    } catch (error) {
      console.error("Delivery Dashboard Error:", error);
      setDeliveries([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!isDeliveryLoggedIn()) {
      navigate("/delivery-login");
      return;
    }
    loadDeliveries();
  }, [navigate, loadDeliveries]);

  const handleLogout = () => {
    logoutDelivery();
    navigate("/");
  };

  const handleNavigate = (delivery) => {
    const address = getAddress(delivery);
    if (!address) {
      alert("Customer delivery address is not available.");
      return;
    }

    const destination = encodeURIComponent(address);
    const mapsUrl =
      `https://www.google.com/maps/dir/?api=1` +
      `&destination=${destination}` +
      `&travelmode=driving`;
    window.open(mapsUrl, "_blank", "noopener,noreferrer");
  };

  const updateDeliveryStatus = async (delivery, status) => {
    if (!delivery?.id || isStatusLocked(delivery) || updatingId) return;

    try {
      setUpdatingId(delivery.id);
      if (delivery.type === "Order") {
        await updateOrderStatus(delivery.id, status);
      } else {
        await updateSubscriptionDeliveryStatus(delivery.id, status);
      }

      setDeliveries((previous) =>
        previous.map((item) =>
          item.id === delivery.id && item.type === delivery.type
            ? { ...item, status }
            : item
        )
      );
    } catch (error) {
      console.error("Update Delivery Status Error:", error);
      alert(error?.message || "Failed to update delivery status. Please try again.");
    } finally {
      setUpdatingId("");
    }
  };

  const todayLabel = useMemo(
    () =>
      new Date().toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    []
  );

  const morningCount = deliveries.filter(
    (delivery) => String(delivery.delivery_shift || "").trim().toLowerCase() === "morning"
  ).length;
  const eveningCount = deliveries.filter(
    (delivery) => String(delivery.delivery_shift || "").trim().toLowerCase() === "evening"
  ).length;
  const deliveredCount = deliveries.filter((delivery) => delivery.status === "Delivered").length;
  const missedCount = deliveries.filter((delivery) => delivery.status === "Missed").length;
  const pendingCount = deliveries.length - deliveredCount - missedCount;
  const progress = deliveries.length ? Math.round((deliveredCount / deliveries.length) * 100) : 0;

  const filteredDeliveries = useMemo(() => {
    const query = search.trim().toLowerCase();
    return deliveries.filter((delivery) => {
      const shift = String(delivery.delivery_shift || "").trim().toLowerCase();
      const selectedShiftValue = selectedShift.toLowerCase();
      const matchesShift = selectedShiftValue === "all" || shift === selectedShiftValue;

      const status = String(delivery.status || "").trim().toLowerCase();
      const selectedStatusValue = selectedStatus.toLowerCase();
      const matchesStatus =
        selectedStatusValue === "all deliveries" || status === selectedStatusValue;

      const matchesSearch =
        !query ||
        String(delivery.customer?.full_name || "").toLowerCase().includes(query) ||
        String(delivery.customer?.phone || "").toLowerCase().includes(query) ||
        String(delivery.address?.area || "").toLowerCase().includes(query) ||
        String(getDeliveryNumber(delivery)).toLowerCase().includes(query);

      return matchesShift && matchesStatus && matchesSearch;
    });
  }, [deliveries, search, selectedShift, selectedStatus]);

  const milkSummary = useMemo(
    () => calculateMilkSummary(filteredDeliveries),
    [filteredDeliveries]
  );

  const shiftTabs = [
    { value: "All", label: "All stops", count: deliveries.length },
    { value: "Morning", label: "Morning", count: morningCount },
    { value: "Evening", label: "Evening", count: eveningCount },
  ];

  return (
    <div className="delivery-app">
      <style>{`
        @keyframes deliveryEnter { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes deliveryFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
        @keyframes deliveryShimmer { from { transform: translateX(-130%); } to { transform: translateX(360%); } }
        @keyframes deliverySpin { to { transform: rotate(360deg); } }
        @keyframes deliveryTagReveal { from { opacity:0; transform:translateY(7px) scale(.94); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes deliveryTagPulse { 0%,100% { box-shadow:0 3px 9px rgba(20,60,42,.035); } 50% { box-shadow:0 5px 13px rgba(8,124,85,.11); } }
        .delivery-app { min-height:100dvh; padding:16px 14px 40px; color:#172b25; background:radial-gradient(circle at 4% 0%,rgba(167,243,208,.24),transparent 26%),radial-gradient(circle at 98% 20%,rgba(191,219,254,.22),transparent 25%),#f5f8f6; }
        .delivery-shell { width:100%; max-width:1240px; margin:0 auto; }
        .delivery-topbar { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:14px; }
        .delivery-brand { display:flex; align-items:center; gap:10px; min-width:0; }
        .delivery-brand-logo { width:44px; height:44px; flex:0 0 44px; object-fit:contain; padding:4px; border-radius:14px; background:#fff; border:1px solid #e6eee8; box-shadow:0 5px 16px rgba(21,69,48,.08); }
        .delivery-brand-name { font-size:15px; font-weight:950; letter-spacing:-.035em; color:#123c2d; line-height:1.1; }
        .delivery-brand-caption { margin-top:3px; color:#81928a; font-size:10px; font-weight:750; }
        .delivery-top-actions { display:flex; align-items:center; gap:8px; }
        .delivery-icon-button { width:40px; height:40px; display:grid; place-items:center; border:1px solid #e0e9e3; border-radius:13px; background:#fff; color:#436356; font-size:16px; cursor:pointer; transition:.2s ease; }
        .delivery-icon-button:hover { transform:translateY(-2px); border-color:#9ad8b9; color:#087b55; box-shadow:0 7px 16px rgba(16,117,77,.08); }
        .delivery-logout { min-height:40px; padding:0 13px; border:1px solid #f2dada; border-radius:13px; background:#fff7f7; color:#b33c3c; font-size:11px; font-weight:900; cursor:pointer; }
        .delivery-hero { position:relative; overflow:hidden; display:flex; align-items:center; justify-content:space-between; gap:18px; padding:22px 24px; border-radius:25px; color:white; background:linear-gradient(115deg,#07543d 0%,#07835c 55%,#19a77a 100%); box-shadow:0 16px 35px rgba(5,93,61,.15); animation:deliveryEnter .45s ease both; }
        .delivery-hero:before { content:""; position:absolute; width:260px; height:260px; right:-80px; top:-165px; border-radius:50%; background:rgba(255,255,255,.10); }
        .delivery-hero:after { content:""; position:absolute; width:190px; height:190px; right:180px; bottom:-150px; border-radius:50%; background:rgba(167,243,208,.13); filter:blur(4px); }
        .delivery-hero-copy { position:relative; z-index:1; min-width:0; }
        .delivery-date-pill { display:inline-flex; align-items:center; gap:7px; padding:6px 10px; border:1px solid rgba(255,255,255,.17); border-radius:999px; background:rgba(255,255,255,.10); color:#e3fff1; font-size:10px; font-weight:850; }
        .delivery-hero h1 { margin:12px 0 0; font-size:clamp(24px,3vw,35px); line-height:1.04; letter-spacing:-.05em; font-weight:950; }
        .delivery-hero p { margin:7px 0 0; max-width:560px; color:rgba(239,255,246,.78); font-size:12px; line-height:1.5; font-weight:550; }
        .delivery-hero-badge { position:relative; z-index:1; flex:0 0 auto; min-width:145px; padding:13px 16px; border:1px solid rgba(255,255,255,.16); border-radius:19px; background:rgba(255,255,255,.11); text-align:center; backdrop-filter:blur(8px); }
        .delivery-hero-badge strong { display:block; font-size:27px; line-height:1; font-weight:950; }
        .delivery-hero-badge span { display:block; margin-top:6px; color:#d4fbe6; font-size:9px; font-weight:900; letter-spacing:.12em; text-transform:uppercase; }
        .delivery-progress { height:5px; margin-top:15px; overflow:hidden; border-radius:999px; background:rgba(255,255,255,.20); }
        .delivery-progress span { display:block; height:100%; border-radius:inherit; background:#b6f3d0; transition:width .6s ease; }
        .delivery-stats { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:10px; margin-top:13px; }
        .delivery-stat { display:flex; align-items:center; gap:11px; min-width:0; padding:13px; border:1px solid #e5eee8; border-radius:18px; background:#fff; box-shadow:0 5px 16px rgba(20,60,42,.035); animation:deliveryEnter .45s ease both; }
        .delivery-stat-icon { width:36px; height:36px; flex:0 0 36px; display:grid; place-items:center; border-radius:12px; background:#f0f7f2; font-size:16px; }
        .delivery-stat:nth-child(2) .delivery-stat-icon { background:#e8f8ee; }
        .delivery-stat:nth-child(3) .delivery-stat-icon { background:#edf5ff; }
        .delivery-stat:nth-child(4) .delivery-stat-icon { background:#fff0ef; }
        .delivery-stat-label { color:#84958c; font-size:9px; font-weight:900; letter-spacing:.06em; text-transform:uppercase; }
        .delivery-stat-value { margin-top:3px; color:#183c2d; font-size:22px; line-height:1; font-weight:950; }
        .delivery-section-heading { display:flex; align-items:flex-end; justify-content:space-between; gap:12px; margin-bottom:10px; }
        .delivery-section-heading h2 { margin:0; color:#173c2c; font-size:17px; line-height:1.1; font-weight:950; letter-spacing:-.03em; }
        .delivery-section-heading p { margin:4px 0 0; color:#87968e; font-size:10px; font-weight:650; }
        .delivery-toolbar { display:grid; grid-template-columns:minmax(0,1fr) 190px; gap:9px; }
        .delivery-search-wrap { position:relative; }
        .delivery-search-wrap span { position:absolute; left:13px; top:50%; transform:translateY(-50%); color:#91a198; font-size:15px; pointer-events:none; }
        .delivery-input,.delivery-select { width:100%; min-height:44px; border:1px solid #e1eae4; border-radius:13px; outline:none; background:#fbfdfb; color:#314d40; font-size:12px; font-weight:650; transition:.2s ease; }
        .delivery-input { padding:0 13px 0 39px; }
        .delivery-select { padding:0 12px; }
        .delivery-input:focus,.delivery-select:focus { border-color:#65bd8d; background:#fff; box-shadow:0 0 0 3px rgba(16,155,91,.10); }
        .delivery-shift-tabs { display:flex; gap:7px; overflow-x:auto; margin:0 0 10px; padding:0 0 2px; scrollbar-width:none; }
        .delivery-shift-tabs::-webkit-scrollbar { display:none; }
        .delivery-shift-tab { min-height:35px; flex:0 0 auto; padding:0 12px; border:1px solid #e1eae4; border-radius:999px; background:#fff; color:#6e8278; font-size:10px; font-weight:900; cursor:pointer; transition:.2s ease; }
        .delivery-shift-tab.active { border-color:#087c55; background:#087c55; color:#fff; box-shadow:0 5px 12px rgba(8,124,85,.17); }
        .delivery-reset { min-height:35px; padding:0 10px; border:0; border-radius:999px; background:#eff5f0; color:#61766a; font-size:10px; font-weight:900; cursor:pointer; }
        .delivery-layout { display:grid; grid-template-columns:minmax(0,1fr); gap:14px; align-items:start; margin-top:17px; }
        .delivery-list-panel,.delivery-side-card { border:1px solid #e5eee8; border-radius:21px; background:rgba(255,255,255,.93); box-shadow:0 7px 24px rgba(20,60,42,.045); }
        .delivery-list-panel { padding:15px; min-width:0; }
        .delivery-list-head { display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:12px; }
        .delivery-result-count { color:#7f9087; font-size:10px; font-weight:750; }
        .delivery-result-count strong { color:#173d2d; font-size:14px; }
        .delivery-list { display:grid; gap:10px; }
        .delivery-card { position:relative; overflow:hidden; border:1px solid #e7eee9; border-radius:17px; background:#fff; transition:transform .22s ease,box-shadow .22s ease,border-color .22s ease; animation:deliveryEnter .4s ease both; }
        .delivery-card:hover { transform:translateY(-2px); border-color:#c7e6d2; box-shadow:0 10px 22px rgba(17,74,47,.07); }
        .delivery-card:before { content:""; position:absolute; inset:0 auto 0 0; width:4px; background:#d9a441; }
        .delivery-card.status-delivered:before { background:#1ba56b; }
        .delivery-card.status-moving:before { background:#3887d8; }
        .delivery-card.status-missed:before { background:#dc6969; }
        .delivery-card.status-assigned:before { background:#8b74d7; }
        .delivery-card-body { padding:13px 13px 12px 16px; }
        .delivery-card-top { display:flex; align-items:flex-start; justify-content:space-between; gap:10px; }
        .delivery-customer { display:flex; align-items:center; gap:9px; min-width:0; }
        .delivery-avatar { width:38px; height:38px; flex:0 0 38px; display:grid; place-items:center; border-radius:13px; background:linear-gradient(145deg,#e7f8ed,#f2fbf5); color:#14754e; font-size:15px; font-weight:950; }
        .delivery-customer h3 { margin:0; overflow:hidden; color:#1a3c2e; font-size:13px; line-height:1.2; font-weight:950; text-overflow:ellipsis; white-space:nowrap; }
        .delivery-phone-row { display:flex; align-items:center; flex-wrap:wrap; gap:7px; margin-top:4px; }
        .delivery-phone { display:inline-block; color:#819188; font-size:10px; font-weight:750; text-decoration:none; }
        .delivery-phone:hover { color:#087c55; }
        .delivery-call-quick { display:inline-flex; align-items:center; justify-content:center; min-height:27px; padding:0 9px; border:1px solid #bfe8d2; border-radius:999px; background:#eaf9f0; color:#08794f; font-size:9px; font-weight:950; line-height:1; text-decoration:none; white-space:nowrap; transition:background .18s ease,transform .18s ease,box-shadow .18s ease; }
        .delivery-call-quick:hover { transform:translateY(-1px); background:#d8f4e4; box-shadow:0 4px 10px rgba(8,121,79,.12); }
        .delivery-status { display:inline-flex; align-items:center; gap:5px; flex:0 0 auto; padding:5px 8px; border-radius:999px; font-size:9px; line-height:1; font-weight:950; }
        .delivery-status:before { content:""; width:6px; height:6px; border-radius:50%; background:currentColor; }
        .delivery-status.pending { background:#fff6df; color:#a26c0a; }
        .delivery-status.assigned { background:#f1edff; color:#7159bd; }
        .delivery-status.moving { background:#eaf3ff; color:#276fc0; }
        .delivery-status.delivered { background:#e7f8ed; color:#16804e; }
        .delivery-status.missed { background:#fff0ef; color:#c14f4f; }
        .delivery-meta-row { display:flex; flex-wrap:wrap; align-items:center; gap:6px; margin:10px 0 0 47px; }
        .delivery-meta-chip { display:inline-flex; align-items:center; gap:4px; min-height:23px; padding:0 8px; border-radius:7px; background:#f4f7f5; color:#71827a; font-size:9px; font-weight:850; }
        .delivery-address-row { display:flex; align-items:center; gap:8px; margin-top:11px; padding:9px 10px; border:1px solid #edf2ee; border-radius:12px; background:#f9fbf9; }
        .delivery-address-text { min-width:0; flex:1; color:#60756a; font-size:10px; font-weight:650; line-height:1.45; }
        .delivery-address-text strong { display:block; margin-bottom:2px; color:#95a29b; font-size:8px; font-weight:950; letter-spacing:.08em; text-transform:uppercase; }
        .delivery-small-action { display:inline-flex; align-items:center; justify-content:center; gap:5px; min-height:32px; padding:0 9px; border:1px solid #dcebe1; border-radius:9px; background:#fff; color:#16734e; font-size:9px; font-weight:950; text-decoration:none; cursor:pointer; white-space:nowrap; }
        .delivery-items-preview { margin-top:9px; color:#71847a; font-size:10px; font-weight:750; line-height:1.4; }
        .delivery-items-preview span { color:#1b7350; font-weight:900; }
        .delivery-card-actions { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:7px; margin-top:11px; }
        .delivery-action { display:flex; align-items:center; justify-content:center; min-width:0; min-height:40px; padding:0 7px; border:0; border-radius:10px; color:#fff; font-size:10px; font-weight:950; text-align:center; text-decoration:none; cursor:pointer; transition:transform .18s ease,filter .18s ease; }
        .delivery-action:hover:not(:disabled) { filter:brightness(1.06); transform:translateY(-1px); }
        .delivery-action:active:not(:disabled) { transform:scale(.97); }
        .delivery-action:disabled { background:#e5ebe7 !important; color:#9aa7a0 !important; cursor:not-allowed; box-shadow:none !important; }
        .delivery-action.out { background:#347fc5; box-shadow:0 4px 10px rgba(52,127,197,.15); }
        .delivery-action.done { background:#16895a; box-shadow:0 4px 10px rgba(22,137,90,.15); }
        .delivery-action.missed { background:#c85c5c; box-shadow:0 4px 10px rgba(200,92,92,.13); }
        .delivery-more { display:flex; align-items:center; justify-content:center; gap:6px; width:100%; min-height:32px; margin-top:7px; border:0; background:transparent; color:#718b7c; font-size:9px; font-weight:900; cursor:pointer; }
        .delivery-more span { transition:transform .2s ease; }
        .delivery-more span.open { transform:rotate(180deg); }
        .delivery-expanded { padding-top:10px; margin-top:9px; border-top:1px solid #edf2ee; animation:deliveryEnter .22s ease; }
        .delivery-item-row { display:flex; align-items:center; gap:8px; padding:7px 0; border-bottom:1px solid #f1f4f2; }
        .delivery-item-row:last-child { border-bottom:0; }
        .delivery-item-image { width:32px; height:32px; flex:0 0 32px; overflow:hidden; display:grid; place-items:center; border-radius:9px; background:#f4f8f5; font-size:15px; }
        .delivery-item-image img { width:100%; height:100%; object-fit:cover; }
        .delivery-item-info { min-width:0; flex:1; }
        .delivery-item-info strong { display:block; overflow:hidden; color:#385447; font-size:10px; font-weight:900; text-overflow:ellipsis; white-space:nowrap; }
        .delivery-item-info small { display:block; margin-top:2px; color:#93a098; font-size:9px; }
        .delivery-item-amount { color:#16734e; font-size:10px; font-weight:950; }
        .delivery-payment-row { display:flex; justify-content:space-between; gap:10px; margin-top:9px; padding:9px 10px; border-radius:10px; background:#f1f8f3; color:#7a8c82; font-size:9px; font-weight:800; }
        .delivery-payment-row strong { color:#14754e; font-size:12px; }
        .delivery-side { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:9px; width:100%; align-items:stretch; }
        .delivery-side-card { min-width:0; padding:10px; overflow:hidden; }
        .delivery-side-title { display:flex; align-items:center; gap:7px; margin-bottom:9px; min-width:0; }
        .delivery-side-icon { width:29px; height:29px; flex:0 0 29px; display:grid; place-items:center; border-radius:9px; background:#eaf7ef; font-size:13px; overflow:hidden; }
        .delivery-side-logo-wrap { padding:3px; background:#fff; border:1px solid #dceee2; box-shadow:0 3px 9px rgba(18,91,57,.08); }
        .delivery-side-logo { display:block; width:100%; height:100%; object-fit:contain; border-radius:7px; }
        .delivery-side-title h3 { margin:0; color:#214535; font-size:10px; line-height:1.15; font-weight:950; }
        .delivery-side-title p { margin:2px 0 0; color:#91a097; font-size:7px; line-height:1.2; font-weight:650; }
        .delivery-litres { padding:8px 9px; border-radius:11px; background:linear-gradient(135deg,#eaf8ef,#f5fbf6); }
        .delivery-litres small { color:#668474; font-size:7px; font-weight:900; letter-spacing:.07em; text-transform:uppercase; }
        .delivery-litres strong { display:block; margin-top:2px; color:#08754e; font-size:24px; line-height:1; font-weight:950; letter-spacing:-.05em; animation:deliveryTagReveal .55s cubic-bezier(.22,1,.36,1) both; }
        /* Four small animated milk-size KPI tags stay in one row, including narrow phones. */
        .delivery-bottle-grid { display:flex !important; flex-wrap:nowrap !important; align-items:stretch; gap:4px; margin-top:6px; width:100%; min-width:0; }
        .delivery-bottle { flex:1 1 0 !important; width:0; min-width:0; min-height:36px; display:flex; flex-direction:column; justify-content:center; align-items:flex-start; gap:2px; padding:5px 5px; border:1px solid #e5eee8; border-radius:9px; background:#fff; box-shadow:0 3px 9px rgba(20,60,42,.035); text-align:left; animation:deliveryTagReveal .45s cubic-bezier(.22,1,.36,1) both; transition:transform .2s ease,border-color .2s ease,box-shadow .2s ease; }
        .delivery-bottle:nth-child(2) { animation-delay:.06s; }
        .delivery-bottle:nth-child(3) { animation-delay:.12s; }
        .delivery-bottle:nth-child(4) { animation-delay:.18s; }
        .delivery-bottle:hover { transform:translateY(-2px); border-color:#a9ddbd; box-shadow:0 6px 13px rgba(8,124,85,.10); }
        .delivery-bottle span { display:block; max-width:100%; overflow:hidden; color:#84958c; font-size:6.5px; font-weight:900; letter-spacing:0; line-height:1.1; text-overflow:ellipsis; white-space:nowrap; }
        .delivery-bottle strong { display:block; margin:0; color:#183c2d; font-size:12px; line-height:1; font-weight:950; }
        .delivery-shift-summary { display:grid; gap:5px; }
        .delivery-shift-line { display:flex; align-items:center; justify-content:space-between; gap:5px; min-width:0; padding:7px 8px; border-radius:9px; background:#f8faf8; animation:deliveryTagReveal .45s cubic-bezier(.22,1,.36,1) both; transition:transform .2s ease,background .2s ease; }
        .delivery-shift-line:nth-child(2) { animation-delay:.07s; }
        .delivery-shift-line:nth-child(3) { animation-delay:.14s; }
        .delivery-shift-line:hover { transform:translateY(-1px); background:#eff8f1; }
        .delivery-shift-line span { overflow:hidden; color:#718379; font-size:8px; font-weight:800; text-overflow:ellipsis; white-space:nowrap; }
        .delivery-shift-line strong { color:#345545; font-size:9px; font-weight:950; white-space:nowrap; }
        .delivery-help-card { grid-column:1 / -1; border-color:#e4edf9; background:linear-gradient(145deg,#f4f8ff,#fff); }
        .delivery-help-bottom { margin-top:14px; }
        .delivery-help-card p { margin:0; color:#75869b; font-size:10px; line-height:1.55; font-weight:650; }
        .delivery-empty { padding:40px 18px; border:1px dashed #d8e7dd; border-radius:16px; background:#fbfdfb; text-align:center; }
        .delivery-empty-icon { width:54px; height:54px; display:grid; place-items:center; margin:0 auto 11px; border-radius:18px; background:#edf8f0; font-size:24px; }
        .delivery-empty h3 { margin:0; color:#315442; font-size:14px; font-weight:950; }
        .delivery-empty p { margin:5px 0 0; color:#8b9a91; font-size:10px; }
        .delivery-skeleton { height:150px; border-radius:16px; background:linear-gradient(90deg,#eff4f0,#f8faf8,#eff4f0); background-size:200% 100%; animation:deliveryShimmer 1.5s linear infinite; }
        .delivery-footer { display:flex; justify-content:space-between; gap:10px; margin-top:14px; padding:0 3px; color:#91a097; font-size:9px; font-weight:700; }
        @media (max-width: 900px) { .delivery-layout { grid-template-columns:1fr; } .delivery-side { grid-template-columns:repeat(2,minmax(0,1fr)); } }
        @media (max-width: 620px) {
          .delivery-app { padding:10px 10px 28px; }
          .delivery-topbar { margin-bottom:10px; }
          .delivery-brand-logo { width:39px; height:39px; flex-basis:39px; border-radius:12px; }
          .delivery-brand-name { font-size:13px; }
          .delivery-brand-caption { font-size:9px; }
          .delivery-icon-button { width:36px; height:36px; border-radius:11px; }
          .delivery-logout { min-height:36px; padding:0 10px; font-size:10px; }
          .delivery-hero { align-items:flex-start; padding:16px; border-radius:20px; }
          .delivery-hero h1 { margin-top:9px; font-size:24px; }
          .delivery-hero p { max-width:260px; font-size:10px; }
          .delivery-hero-badge { min-width:76px; padding:10px 8px; border-radius:14px; }
          .delivery-hero-badge strong { font-size:22px; }
          .delivery-hero-badge span { font-size:7px; }
          .delivery-progress { margin-top:11px; }
          .delivery-stats { gap:7px; margin-top:9px; }
          .delivery-stat { gap:8px; padding:10px; border-radius:14px; }
          .delivery-stat-icon { width:30px; height:30px; flex-basis:30px; border-radius:10px; font-size:13px; }
          .delivery-stat-label { font-size:8px; }
          .delivery-stat-value { font-size:19px; }
          .delivery-layout { gap:10px; margin-top:12px; }
          .delivery-list-panel { padding:10px; border-radius:17px; }
          .delivery-section-heading h2 { font-size:15px; }
          .delivery-section-heading p { font-size:9px; }
          .delivery-toolbar { grid-template-columns:1fr; gap:7px; }
          .delivery-input,.delivery-select { min-height:42px; font-size:11px; }
          .delivery-shift-tabs { margin-bottom:8px; }
          .delivery-shift-tab { min-height:32px; padding:0 10px; font-size:9px; }
          .delivery-card { border-radius:14px; }
          .delivery-card-body { padding:11px 10px 10px 13px; }
          .delivery-avatar { width:34px; height:34px; flex-basis:34px; border-radius:11px; }
          .delivery-customer h3 { font-size:12px; }
          .delivery-phone { font-size:9px; }
          .delivery-call-quick { min-height:26px; padding:0 8px; font-size:9px; }
          .delivery-status { padding:5px 7px; font-size:8px; }
          .delivery-meta-row { margin:8px 0 0 43px; }
          .delivery-meta-chip { min-height:21px; font-size:8px; }
          .delivery-address-row { gap:6px; margin-top:9px; padding:8px; }
          .delivery-address-text { font-size:9px; }
          .delivery-small-action { min-height:30px; padding:0 8px; font-size:8px; }
          .delivery-items-preview { font-size:9px; }
          .delivery-card-actions { grid-template-columns:repeat(3,minmax(0,1fr)); gap:6px; margin-top:10px; }
          .delivery-action { min-height:40px; padding:0 5px; border-radius:10px; font-size:9px; }
          .delivery-side { grid-template-columns:repeat(2,minmax(0,1fr)) !important; gap:6px; }
          .delivery-help-card { grid-column:1 / -1; }
          .delivery-side-card { min-width:0; padding:8px; border-radius:14px; }
          .delivery-bottle-grid { display:flex !important; flex-wrap:nowrap !important; gap:3px; margin-top:6px; }
          .delivery-bottle { flex:1 1 0 !important; width:0; min-width:0; min-height:32px; padding:4px 3px; border-radius:8px; }
          .delivery-bottle span { font-size:6px; }
          .delivery-bottle strong { font-size:11px; }
          .delivery-footer { font-size:8px; }
        }
        @media (max-width: 360px) {
          .delivery-bottle-grid { display:flex !important; flex-wrap:nowrap !important; gap:2px; }
          .delivery-bottle { flex:1 1 0 !important; width:0; min-width:0; min-height:29px; padding:3px 2px; }
          .delivery-bottle span { font-size:5.5px; }
          .delivery-bottle strong { font-size:10px; }
          .delivery-side { grid-template-columns:repeat(2,minmax(0,1fr)) !important; gap:5px; }
          .delivery-side-card { padding:7px; }
          .delivery-side-title { gap:5px; margin-bottom:7px; }
          .delivery-side-icon { width:25px; height:25px; flex-basis:25px; }
          .delivery-side-title h3 { font-size:9px; }
          .delivery-side-title p { font-size:6px; }
          .delivery-litres { padding:6px 7px; }
          .delivery-litres strong { font-size:21px; }
          .delivery-help-card { grid-column:1 / -1; }
          .delivery-hero { gap:8px; }
          .delivery-hero-badge { min-width:66px; }
          .delivery-hero h1 { font-size:21px; }
          .delivery-status { max-width:105px; white-space:normal; text-align:center; }
          .delivery-action { font-size:7px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .delivery-app *, .delivery-app *:before, .delivery-app *:after { animation-duration:.01ms !important; animation-iteration-count:1 !important; scroll-behavior:auto !important; transition-duration:.01ms !important; }
        }
      `}</style>

      <div className="delivery-shell">
        <header className="delivery-topbar">
          <div className="delivery-brand">
            <img
              src={LOGO_SRC}
              alt="FarmFreshDairy logo"
              className="delivery-brand-logo"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
            <div>
              <div className="delivery-brand-name">FarmFreshDairy</div>
              <div className="delivery-brand-caption">Delivery partner workspace</div>
            </div>
          </div>
          <div className="delivery-top-actions">
            <button
              type="button"
              className="delivery-icon-button"
              onClick={() => loadDeliveries({ silent: true })}
              disabled={loading || refreshing}
              aria-label="Refresh deliveries"
              title="Refresh deliveries"
            >
              <span style={{ display: "inline-block", animation: refreshing ? "deliverySpin .8s linear infinite" : "none" }}>↻</span>
            </button>
            <button type="button" className="delivery-logout" onClick={handleLogout}>
              Sign out
            </button>
          </div>
        </header>

        <section className="delivery-hero">
          <div className="delivery-hero-copy">
            <div className="delivery-date-pill">● {todayLabel}</div>
            <h1>Hello, {getDeliveryName() || "Delivery Partner"}</h1>
            <p>Your delivery list, customer stops and milk loading — organised in one simple workspace.</p>
            <div className="delivery-progress" aria-label={`${progress}% deliveries completed`}>
              <span style={{ width: `${progress}%` }} />
            </div>
          </div>
          <div className="delivery-hero-badge">
            <strong>{progress}%</strong>
            <span>Route done</span>
          </div>
        </section>

        <section className="delivery-stats" aria-label="Delivery summary">
          {[
            { label: "Total stops", value: deliveries.length, icon: "📦" },
            { label: "Delivered", value: deliveredCount, icon: "✓" },
            { label: "To go", value: pendingCount, icon: "⏳" },
            { label: "Missed", value: missedCount, icon: "!" },
          ].map((stat) => (
            <div className="delivery-stat" key={stat.label}>
              <span className="delivery-stat-icon">{stat.icon}</span>
              <div>
                <div className="delivery-stat-label">{stat.label}</div>
                <div className="delivery-stat-value">{stat.value}</div>
              </div>
            </div>
          ))}
        </section>

        <div className="delivery-layout">
          <aside className="delivery-side">
            <section className="delivery-side-card">
              <div className="delivery-side-title">
                <span className="delivery-side-icon delivery-side-logo-wrap">
                  <img
                    src={LOGO_SRC}
                    alt="FarmFreshDairy logo"
                    className="delivery-side-logo"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                  />
                </span>
                <div>
                  <h3>Milk loading checklist</h3>
                  <p>Quantities for the current filters</p>
                </div>
              </div>
              <div className="delivery-litres">
                <small>Total milk to carry</small>
                <strong>{milkSummary.totalLiters.toFixed(1)} L</strong>
              </div>
              <div className="delivery-bottle-grid">
                {[
                  ["500 ml", milkSummary.bottles500ml],
                  ["1 litre", milkSummary.bottles1L],
                  ["2 litre", milkSummary.bottles2L],
                  ["5 litre", milkSummary.bottles5L],
                ].map(([label, value]) => (
                  <div className="delivery-bottle" key={label}>
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>
            </section>

            <section className="delivery-side-card">
              <div className="delivery-side-title">
                <span className="delivery-side-icon">🕒</span>
                <div>
                  <h3>Shift overview</h3>
                  <p>Your assigned stops by shift</p>
                </div>
              </div>
              <div className="delivery-shift-summary">
                <div className="delivery-shift-line">
                  <span>☀ Morning</span>
                  <strong>{morningCount} stops</strong>
                </div>
                <div className="delivery-shift-line">
                  <span>☾ Evening</span>
                  <strong>{eveningCount} stops</strong>
                </div>
                <div className="delivery-shift-line">
                  <span>Completed</span>
                  <strong>{progress}%</strong>
                </div>
              </div>
            </section>

          </aside>

          <main className="delivery-list-panel">
            <div className="delivery-section-heading">
              <div>
                <h2>Today's delivery stops</h2>
                <p>Find a customer, open the address and update a delivery.</p>
              </div>
              {(search || selectedShift !== "All" || selectedStatus !== "All Deliveries") && (
                <button
                  type="button"
                  className="delivery-reset"
                  onClick={() => {
                    setSearch("");
                    setSelectedShift("All");
                    setSelectedStatus("All Deliveries");
                  }}
                >
                  Clear filters
                </button>
              )}
            </div>

            <div className="delivery-shift-tabs" role="group" aria-label="Filter by shift">
              {shiftTabs.map((tab) => (
                <button
                  type="button"
                  key={tab.value}
                  className={`delivery-shift-tab ${selectedShift === tab.value ? "active" : ""}`}
                  onClick={() => setSelectedShift(tab.value)}
                >
                  {tab.label} · {tab.count}
                </button>
              ))}
            </div>

            <div className="delivery-toolbar">
              <div className="delivery-search-wrap">
                <span>⌕</span>
                <input
                  className="delivery-input"
                  type="search"
                  placeholder="Search name, phone, area or ID"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  aria-label="Search deliveries"
                />
              </div>
              <select
                className="delivery-select"
                value={selectedStatus}
                onChange={(event) => setSelectedStatus(event.target.value)}
                aria-label="Filter by delivery status"
              >
                <option value="All Deliveries">All statuses</option>
                <option value="Pending">Pending</option>
                <option value="Assigned">Assigned</option>
                <option value="Out for Delivery">Out for Delivery</option>
                <option value="Delivered">Delivered</option>
                <option value="Missed">Missed</option>
                <option value="Failed">Failed</option>
              </select>
            </div>

            <div className="delivery-list-head" style={{ marginTop: 13, marginBottom: 9 }}>
              <span className="delivery-result-count">
                Showing <strong>{filteredDeliveries.length}</strong> of {deliveries.length} stops
              </span>
              <span className="delivery-result-count">
                {selectedShift === "All" ? "All shifts" : `${selectedShift} shift`}
              </span>
            </div>

            <div className="delivery-list">
              {loading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <div className="delivery-skeleton" key={index} />
                ))
              ) : filteredDeliveries.length === 0 ? (
                <div className="delivery-empty">
                  <div className="delivery-empty-icon">🥛</div>
                  <h3>No deliveries found</h3>
                  <p>Try another shift, status or search term.</p>
                </div>
              ) : (
                filteredDeliveries.map((delivery) => {
                  const locked = isStatusLocked(delivery);
                  const items = getDeliveryItems(delivery);
                  const expanded = expandedDeliveryId === `${delivery.type}-${delivery.id}`;
                  const cardKey = `${delivery.type}-${delivery.id}`;
                  const address = getAddress(delivery);
                  const number = getDeliveryNumber(delivery);
                  const isUpdating = updatingId === delivery.id;
                  const itemSummary = items
                    .slice(0, 3)
                    .map((item) => `${item.quantity || 0} × ${item.size || "item"}`)
                    .join(" · ");

                  return (
                    <article
                      key={cardKey}
                      className={`delivery-card status-${getStatusTone(delivery.status)}`}
                    >
                      <div className="delivery-card-body">
                        <div className="delivery-card-top">
                          <div className="delivery-customer">
                            <div className="delivery-avatar">
                              {String(delivery.customer?.full_name || "C").trim().charAt(0).toUpperCase()}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <h3>{delivery.customer?.full_name || "Customer"}</h3>
                              {delivery.customer?.phone ? (
                                <div className="delivery-phone-row">
                                  <a className="delivery-phone" href={`tel:${String(delivery.customer.phone).trim().replace(/[^\d+]/g, "")}`}>
                                    {delivery.customer.phone}
                                  </a>
                                  <a
                                    className="delivery-call-quick"
                                    href={`tel:${String(delivery.customer.phone).trim().replace(/[^\d+]/g, "")}`}
                                    aria-label={`Call ${delivery.customer?.full_name || "customer"}`}
                                    title={`Call ${delivery.customer?.full_name || "customer"}`}
                                  >
                                    ☎ Call
                                  </a>
                                </div>
                              ) : (
                                <span className="delivery-phone">Phone unavailable</span>
                              )}
                            </div>
                          </div>
                          <span className={`delivery-status ${getStatusTone(delivery.status)}`}>
                            {delivery.status || "Pending"}
                          </span>
                        </div>

                        <div className="delivery-meta-row">
                          <span className="delivery-meta-chip">#{number}</span>
                          <span className="delivery-meta-chip">
                            {String(delivery.delivery_shift || "").toLowerCase() === "morning" ? "☀ Morning" :
                              String(delivery.delivery_shift || "").toLowerCase() === "evening" ? "☾ Evening" : "Shift not set"}
                          </span>
                          <span className="delivery-meta-chip">{formatDeliveryDate(delivery.delivery_date)}</span>
                          <span className="delivery-meta-chip">{delivery.type || "Delivery"}</span>
                        </div>

                        <div className="delivery-address-row">
                          <div className="delivery-address-text">
                            <strong>Delivery address</strong>
                            {address || "Address not available"}
                          </div>
                          <button
                            type="button"
                            className="delivery-small-action"
                            onClick={() => handleNavigate(delivery)}
                            disabled={!address}
                          >
                            ↗ Map
                          </button>
                        </div>

                        <div className="delivery-items-preview">
                          🥛 <span>{items.length} item{items.length === 1 ? "" : "s"}</span>
                          {itemSummary ? ` · ${itemSummary}` : " · No item details"}
                          {items.length > 3 ? ` · +${items.length - 3} more` : ""}
                        </div>

                        <div className="delivery-card-actions">
                          <button
                            type="button"
                            className="delivery-action out"
                            disabled={locked || delivery.status === "Out for Delivery" || Boolean(updatingId)}
                            onClick={() => updateDeliveryStatus(delivery, "Out for Delivery")}
                          >
                            {isUpdating ? "Updating…" : "🚚 On the way"}
                          </button>
                          <button
                            type="button"
                            className="delivery-action done"
                            disabled={locked || Boolean(updatingId)}
                            onClick={() => updateDeliveryStatus(delivery, "Delivered")}
                          >
                            ✓ Delivered
                          </button>
                          <button
                            type="button"
                            className="delivery-action missed"
                            disabled={locked || Boolean(updatingId)}
                            onClick={() => updateDeliveryStatus(delivery, "Missed")}
                          >
                            ✕ Missed
                          </button>
                        </div>

                        <button
                          type="button"
                          className="delivery-more"
                          onClick={() => setExpandedDeliveryId(expanded ? null : cardKey)}
                          aria-expanded={expanded}
                        >
                          {expanded ? "Hide delivery details" : "View delivery details"}
                          <span className={expanded ? "open" : ""}>⌄</span>
                        </button>

                        {expanded && (
                          <div className="delivery-expanded">
                            {items.length === 0 ? (
                              <div className="delivery-items-preview">No delivery items are attached to this stop.</div>
                            ) : (
                              items.map((item, index) => (
                                <div className="delivery-item-row" key={item.id || `${item.products?.name || "item"}-${index}`}>
                                  <div className="delivery-item-image">
                                    {item.products?.image ? (
                                      <img src={item.products.image} alt={item.products?.name || "Product"} />
                                    ) : "🥛"}
                                  </div>
                                  <div className="delivery-item-info">
                                    <strong>{item.products?.name || "Milk"}</strong>
                                    <small>{item.quantity || 0} × {item.size || "Size not set"}{item.is_extra ? " · Extra milk" : ""}</small>
                                  </div>
                                  <span className="delivery-item-amount">
                                    {item.total_price != null ? `₹${Number(item.total_price).toFixed(2)}` : `×${item.quantity || 0}`}
                                  </span>
                                </div>
                              ))
                            )}

                            <div className="delivery-payment-row">
                              <span>Payment · {delivery.payment_method || "Not specified"}</span>
                              <strong>₹{Number(delivery.total_amount || 0).toFixed(2)}</strong>
                            </div>
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </main>
        </div>

        <section className="delivery-help-bottom">
            <section className="delivery-side-card delivery-help-card">
              <div className="delivery-side-title">
                <span className="delivery-side-icon">💡</span>
                <div>
                  <h3>Quick delivery tips</h3>
                  <p>Keep your route running smoothly</p>
                </div>
              </div>
              <p>Open the map for directions, call the customer when needed, and mark a stop as delivered only after the milk has been handed over.</p>
            </section>
        </section>

        <footer className="delivery-footer">
          <span>FarmFreshDairy · Delivery workspace</span>
          <span>{filteredDeliveries.length} visible stops</span>
        </footer>
      </div>
    </div>
  );
}
