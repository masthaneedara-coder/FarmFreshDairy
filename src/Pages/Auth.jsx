import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { registerCustomer, loginCustomer, deliveryLogin } from "../config/api";
import { adminLogin } from "../services/adminService";
import { useAuthSession } from "../context/AuthSessionContext";

import {
  setCustomerLogin,
  setAdminLogin,
  setDeliveryLogin,
  getRedirectAfterLogin,
  clearRedirectAfterLogin,
} from "../config/auth";

// Keep your existing logo in: public/logo.png
const LOGO_SRC = "/logo.png";

export default function Auth() {
  const navigate = useNavigate();
  const { login } = useAuthSession();
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState("customer");
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");

  const redirectUser = (defaultPath = "/") => {
    const redirectPath = getRedirectAfterLogin();
    if (redirectPath) {
      clearRedirectAfterLogin();
      navigate(redirectPath);
    } else {
      navigate(defaultPath);
    }
  };

  const handleCustomerSignup = async () => {
    if (!name.trim() || !email.trim() || !mobile.trim() || !password) {
      alert("Please fill all fields");
      return;
    }

    try {
      setLoading(true);
      const res = await registerCustomer({
        full_name: name.trim(),
        phone: mobile.trim(),
        email: email.trim(),
        password,
      });

      alert(res.message);
      setName("");
      setEmail("");
      setMobile("");
      setPassword("");
      setLoginId("");
      setIsLogin(true);
    } catch (err) {
      console.error(err);
      alert(err.message || "Unable to create your account");
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerLogin = async () => {
    if (!loginId.trim() || !password) {
      alert("Please enter Email and Password");
      return;
    }

    try {
      setLoading(true);
      const res = await loginCustomer(loginId.trim(), password);
      if (!res.success) {
        alert(res.message);
        return;
      }

      setCustomerLogin(res.user);
      login(res.user);
      localStorage.setItem("supabase_session", JSON.stringify(res.session));
      redirectUser("/dashboard");
    } catch (error) {
      console.error(error);
      alert(error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async () => {
    if (!loginId.trim() || !password) {
      alert("Please enter Email and Password");
      return;
    }

    try {
      setLoading(true);
      const admin = await adminLogin(loginId.trim(), password);
      setAdminLogin({
        id: admin.id,
        name: admin.full_name,
        email: admin.email,
        phone: admin.phone,
        role: admin.role,
      });
      navigate("/admin");
    } catch (error) {
      console.error(error);
      alert(error.message || "Invalid admin credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleDeliveryLogin = async () => {
    if (!loginId.trim() || !password) {
      alert("Please enter mobile number and password");
      return;
    }

    try {
      setLoading(true);
      const res = await deliveryLogin(loginId.trim(), password);
      if (!res.success) {
        alert(res.message);
        return;
      }

      setDeliveryLogin({
        id: res.deliveryBoy.id,
        name: res.deliveryBoy.full_name,
        phone: res.deliveryBoy.phone,
        role: "delivery",
      });
      localStorage.setItem("deliveryBoy", JSON.stringify(res.deliveryBoy));
      navigate("/delivery");
    } catch (err) {
      console.error(err);
      alert(err.message || "Delivery login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event?.preventDefault?.();
    if (selectedRole === "customer") {
      if (isLogin) await handleCustomerLogin();
      else await handleCustomerSignup();
      return;
    }
    if (selectedRole === "admin") {
      await handleAdminLogin();
      return;
    }
    if (selectedRole === "delivery") await handleDeliveryLogin();
  };

  const changeRole = (role) => {
    setSelectedRole(role);
    setIsLogin(true);
    setLoginId("");
    setPassword("");
    setShowPassword(false);
  };

  const roleData = {
    customer: {
      icon: "🥛",
      eyebrow: isLogin ? "WELCOME BACK" : "JOIN THE FRESH FAMILY",
      title: isLogin ? "Welcome back." : "Create your account.",
      subtitle: isLogin
        ? "Sign in to manage your orders and daily milk delivery."
        : "A few details to get your fresh dairy deliveries started.",
      button: isLogin ? "Sign in to your account" : "Create my account",
    },
    admin: {
      icon: "🛡️",
      eyebrow: "SECURE ADMIN ACCESS",
      title: "Good to see you.",
      subtitle: "Sign in to manage FarmFreshDairy operations.",
      button: "Continue to admin",
    },
    delivery: {
      icon: "🚚",
      eyebrow: "DELIVERY PARTNER ACCESS",
      title: "Ready for delivery?",
      subtitle: "Sign in to view your assigned deliveries and route details.",
      button: "Open delivery dashboard",
    },
  };

  const active = roleData[selectedRole];

  return (
    <div className="ffd-auth-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Manrope:wght@500;600;700;800&display=swap');
        .ffd-auth-page, .ffd-auth-page * { box-sizing: border-box; }
        .ffd-auth-page {
          --ffd-green: #087f5b;
          --ffd-green-dark: #075640;
          --ffd-mint: #d9f7e9;
          --ffd-ink: #172b27;
          --ffd-muted: #71827c;
          min-height: 100dvh;
          padding: 22px clamp(14px, 3vw, 42px) 18px;
          overflow: hidden;
          position: relative;
          color: var(--ffd-ink);
          background: #f5f8f4;
          font-family: 'DM Sans', ui-sans-serif, system-ui, sans-serif;
        }
        .ffd-auth-page button, .ffd-auth-page input { font: inherit; }
        .ffd-auth-page button { -webkit-tap-highlight-color: transparent; }
        .ffd-auth-glow { position: fixed; pointer-events: none; border-radius: 50%; filter: blur(2px); z-index: 0; }
        .ffd-auth-glow.one { width: 440px; height: 440px; left: -210px; top: 10%; background: radial-gradient(circle, rgba(88,203,146,.18), transparent 70%); animation: ffdGlow 10s ease-in-out infinite; }
        .ffd-auth-glow.two { width: 520px; height: 520px; right: -270px; bottom: -150px; background: radial-gradient(circle, rgba(151,213,177,.22), transparent 70%); animation: ffdGlow 12s ease-in-out infinite reverse; }
        @keyframes ffdGlow { 0%,100% { transform: translate3d(0,0,0) scale(1); } 50% { transform: translate3d(18px,-16px,0) scale(1.06); } }
        @keyframes ffdEnter { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes ffdFloat { 0%,100% { transform: translateY(0) rotate(0); } 50% { transform: translateY(-8px) rotate(2deg); } }
        @keyframes ffdShimmer { from { transform: translateX(-140%) skewX(-18deg); } to { transform: translateX(420%) skewX(-18deg); } }
        @keyframes ffdSpin { to { transform: rotate(360deg); } }
        .ffd-auth-wrap { width: min(1120px, 100%); margin: 0 auto; position: relative; z-index: 1; }
        .ffd-auth-nav { display: flex; align-items: center; justify-content: space-between; gap: 14px; margin: 0 auto 18px; max-width: 1080px; }
        .ffd-brand { display: flex; align-items: center; gap: 11px; min-width: 0; }
        .ffd-brand-logo { width: 48px; height: 48px; flex: 0 0 48px; object-fit: contain; border-radius: 15px; padding: 4px; background: #fff; border: 1px solid #e5eee7; box-shadow: 0 6px 18px rgba(26,67,47,.08); }
        .ffd-brand-copy { min-width: 0; }
        .ffd-brand-name { font: 800 17px/1.1 'Manrope', sans-serif; letter-spacing: -.045em; color: #1b352d; }
        .ffd-brand-name span { color: #0b9668; }
        .ffd-brand-tagline { margin-top: 4px; color: #81918a; font-size: 9px; font-weight: 800; letter-spacing: .15em; text-transform: uppercase; }
        .ffd-home-btn { display: inline-flex; align-items: center; gap: 8px; border: 1px solid #dce8df; border-radius: 999px; min-height: 40px; padding: 0 16px; background: rgba(255,255,255,.78); color: #486157; font-size: 12px; font-weight: 800; cursor: pointer; transition: .2s ease; }
        .ffd-home-btn:hover { background: #fff; border-color: #a8d9bd; transform: translateY(-1px); }
        .ffd-auth-layout { display: grid; grid-template-columns: minmax(0, .92fr) minmax(470px, 1.08fr); min-height: 650px; overflow: hidden; border: 1px solid rgba(218,232,222,.9); border-radius: 30px; background: rgba(255,255,255,.88); box-shadow: 0 28px 80px rgba(32,69,49,.10); backdrop-filter: blur(18px); animation: ffdEnter .55s cubic-bezier(.2,.8,.2,1) both; }
        .ffd-story-panel { padding: clamp(28px,4vw,50px); display: flex; flex-direction: column; justify-content: space-between; position: relative; overflow: hidden; color: #f4fff8; background: linear-gradient(148deg,#064e3b 0%,#087b58 54%,#0d9a70 100%); }
        .ffd-story-panel::before { content: ''; position: absolute; width: 430px; height: 430px; right: -210px; top: -175px; border: 1px solid rgba(255,255,255,.13); border-radius: 50%; box-shadow: 0 0 0 35px rgba(255,255,255,.035),0 0 0 75px rgba(255,255,255,.025); }
        .ffd-story-panel::after { content: ''; position: absolute; width: 270px; height: 270px; left: -145px; bottom: -115px; border-radius: 50%; background: rgba(151,244,194,.10); filter: blur(2px); }
        .ffd-story-content, .ffd-story-bottom { position: relative; z-index: 1; }
        .ffd-story-brand { display: flex; align-items: center; gap: 13px; }
        .ffd-story-logo { width: 62px; height: 62px; object-fit: contain; border-radius: 19px; padding: 5px; background: #fff; box-shadow: 0 12px 28px rgba(0,0,0,.16); animation: ffdFloat 5s ease-in-out infinite; }
        .ffd-story-brand-title { font: 800 18px/1.1 'Manrope',sans-serif; letter-spacing: -.04em; }
        .ffd-story-brand-sub { color: rgba(239,255,246,.68); font-size: 9px; font-weight: 800; letter-spacing: .14em; margin-top: 5px; text-transform: uppercase; }
        .ffd-story-kicker { display: inline-flex; align-items: center; gap: 8px; margin-top: 58px; padding: 7px 11px; border: 1px solid rgba(255,255,255,.22); border-radius: 999px; background: rgba(255,255,255,.10); color: #d6ffea; font-size: 9px; font-weight: 900; letter-spacing: .13em; text-transform: uppercase; }
        .ffd-story-kicker-dot { width: 7px; height: 7px; border-radius: 50%; background: #9cf2be; box-shadow: 0 0 13px rgba(156,242,190,.8); }
        .ffd-story-title { max-width: 470px; margin: 19px 0 0; font: 800 clamp(37px,4.2vw,57px)/1.02 'Manrope',sans-serif; letter-spacing: -.065em; }
        .ffd-story-title span { color: #a5f3c5; }
        .ffd-story-text { max-width: 410px; margin: 17px 0 0; color: rgba(242,255,247,.76); font-size: 13px; line-height: 1.75; }
        .ffd-benefits { display: grid; gap: 10px; margin-top: 35px; max-width: 430px; }
        .ffd-benefit { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border: 1px solid rgba(255,255,255,.14); border-radius: 15px; background: rgba(255,255,255,.075); transition: transform .22s ease, background .22s ease; }
        .ffd-benefit:hover { transform: translateX(5px); background: rgba(255,255,255,.12); }
        .ffd-benefit-icon { width: 37px; height: 37px; flex: 0 0 37px; display: grid; place-items: center; border-radius: 12px; background: rgba(255,255,255,.14); font-size: 17px; }
        .ffd-benefit strong { display: block; font-size: 11px; font-weight: 900; }
        .ffd-benefit small { display: block; margin-top: 3px; color: rgba(237,255,245,.64); font-size: 9px; font-weight: 600; }
        .ffd-fresh-note { display: flex; justify-content: space-between; align-items: center; gap: 15px; margin-top: 34px; padding-top: 18px; border-top: 1px solid rgba(255,255,255,.16); color: rgba(241,255,247,.66); font-size: 9px; font-weight: 700; }
        .ffd-fresh-note b { color: #d7ffe8; font-size: 10px; }
        .ffd-login-panel { display: flex; align-items: center; justify-content: center; padding: clamp(25px,4vw,48px); background: rgba(255,255,255,.94); }
        .ffd-login-content { width: min(100%, 470px); margin: auto; }
        .ffd-mobile-brand { display: none; }
        .ffd-login-heading { animation: ffdEnter .42s ease both; }
        .ffd-eyebrow { color: #07855f; font-size: 9px; font-weight: 900; letter-spacing: .19em; text-transform: uppercase; }
        .ffd-login-title { margin: 8px 0 0; color: #172e27; font: 800 clamp(28px,3vw,36px)/1.08 'Manrope',sans-serif; letter-spacing: -.055em; }
        .ffd-login-subtitle { margin: 9px 0 0; color: #7b8a83; font-size: 12px; line-height: 1.65; }
        .ffd-role-label { margin: 28px 0 10px; display: flex; justify-content: space-between; align-items: center; gap: 10px; color: #354b42; font-size: 11px; font-weight: 900; }
        .ffd-role-label small { color: #a0ada5; font-size: 9px; font-weight: 700; }
        .ffd-role-switch { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 8px; padding: 5px; border: 1px solid #e6eee8; border-radius: 16px; background: #f5f8f5; }
        .ffd-role-option { min-width: 0; min-height: 62px; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 9px 6px; border: 1px solid transparent; border-radius: 12px; background: transparent; color: #7a8a82; cursor: pointer; transition: .22s ease; }
        .ffd-role-option:hover { background: #fff; color: #315b47; }
        .ffd-role-option.active { border-color: #d6ecdd; background: #fff; color: #087f5b; box-shadow: 0 5px 14px rgba(27,87,53,.08); }
        .ffd-role-emoji { font-size: 18px; line-height: 1; }
        .ffd-role-name { font-size: 10px; font-weight: 900; }
        .ffd-form { margin-top: 22px; display: grid; gap: 14px; }
        .ffd-field { display: block; min-width: 0; }
        .ffd-field-label { display: block; margin: 0 0 7px 2px; color: #53665c; font-size: 10px; font-weight: 900; }
        .ffd-input-shell { min-height: 51px; display: flex; align-items: center; gap: 10px; padding: 0 14px; border: 1px solid #e0e9e2; border-radius: 13px; background: #fbfdfb; transition: border-color .2s ease, box-shadow .2s ease, background .2s ease; }
        .ffd-input-shell:focus-within { border-color: #55b888; background: #fff; box-shadow: 0 0 0 4px rgba(24,164,100,.09); }
        .ffd-input-icon { width: 27px; height: 27px; flex: 0 0 27px; display: grid; place-items: center; border-radius: 9px; background: #eaf8ef; color: #087f5b; font-size: 13px; }
        .ffd-input { width: 100%; min-width: 0; height: 45px; border: 0; outline: 0; background: transparent; color: #233a30; font-size: 13px; font-weight: 650; }
        .ffd-input::placeholder { color: #a5b0a9; font-weight: 500; }
        .ffd-password-action { flex: 0 0 auto; border: 0; border-radius: 8px; padding: 6px 8px; background: transparent; color: #087f5b; font-size: 10px; font-weight: 900; cursor: pointer; }
        .ffd-forgot-row { display: flex; justify-content: flex-end; margin-top: -5px; }
        .ffd-text-btn { border: 0; padding: 4px 0; background: transparent; color: #07835d; font-size: 10px; font-weight: 900; cursor: pointer; }
        .ffd-submit { position: relative; min-height: 52px; overflow: hidden; display: flex; align-items: center; justify-content: center; gap: 9px; margin-top: 3px; border: 0; border-radius: 14px; background: linear-gradient(110deg,#087b58,#0b9c6c); color: #fff; box-shadow: 0 11px 23px rgba(8,127,91,.20); font-size: 12px; font-weight: 900; cursor: pointer; transition: transform .2s ease, box-shadow .2s ease, opacity .2s ease; }
        .ffd-submit::after { content: ''; position: absolute; top: 0; bottom: 0; left: -35%; width: 24%; background: rgba(255,255,255,.20); transform: skewX(-18deg); }
        .ffd-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 15px 28px rgba(8,127,91,.25); }
        .ffd-submit:hover:not(:disabled)::after { animation: ffdShimmer .8s ease; }
        .ffd-submit:active:not(:disabled) { transform: scale(.99); }
        .ffd-submit:disabled { cursor: wait; opacity: .68; }
        .ffd-spinner { width: 15px; height: 15px; border: 2px solid rgba(255,255,255,.35); border-top-color: white; border-radius: 50%; animation: ffdSpin .7s linear infinite; }
        .ffd-switch-copy { margin: 17px 0 0; color: #87958d; text-align: center; font-size: 10px; font-weight: 600; }
        .ffd-switch-copy button { border: 0; padding: 2px 0; background: transparent; color: #087f5b; font-size: 10px; font-weight: 900; cursor: pointer; }
        .ffd-form-trust { display: flex; justify-content: center; flex-wrap: wrap; gap: 17px; margin-top: 25px; padding-top: 18px; border-top: 1px solid #edf2ee; }
        .ffd-trust-item { display: inline-flex; align-items: center; gap: 6px; color: #84938a; font-size: 9px; font-weight: 800; }
        .ffd-trust-item span { color: #0a9669; font-size: 13px; }
        .ffd-auth-footer { margin: 15px auto 0; color: #9aa79f; text-align: center; font-size: 9px; font-weight: 650; }
        .ffd-auth-footer strong { color: #557368; }
        @media (max-width: 900px) {
          .ffd-auth-page { padding: 14px 14px 24px; }
          .ffd-auth-nav { max-width: 610px; margin-bottom: 12px; }
          .ffd-auth-layout { width: min(610px,100%); min-height: 0; margin: 0 auto; display: flex; flex-direction: column; border-radius: 25px; }
          .ffd-story-panel { min-height: 245px; padding: 22px 24px; }
          .ffd-story-brand-logo { width: 49px; height: 49px; border-radius: 15px; }
          .ffd-story-kicker { margin-top: 22px; }
          .ffd-story-title { max-width: 520px; margin-top: 11px; font-size: clamp(31px,6vw,43px); }
          .ffd-story-text { margin-top: 9px; max-width: 500px; font-size: 11px; }
          .ffd-benefits { display: flex; gap: 7px; margin-top: 16px; }
          .ffd-benefit { flex: 1; padding: 8px; gap: 7px; border-radius: 11px; }
          .ffd-benefit-icon { width: 29px; height: 29px; flex-basis: 29px; border-radius: 9px; font-size: 14px; }
          .ffd-benefit strong { font-size: 9px; }
          .ffd-benefit small { font-size: 7px; }
          .ffd-fresh-note { display: none; }
          .ffd-login-panel { padding: 28px clamp(20px,5vw,42px) 25px; }
          .ffd-login-content { width: min(100%,500px); }
          .ffd-login-title { font-size: 31px; }
          .ffd-role-label { margin-top: 22px; }
        }
        @media (max-width: 560px) {
          .ffd-auth-page { padding: 10px 10px 20px; }
          .ffd-auth-nav { margin: 0 auto 9px; padding: 0 3px; }
          .ffd-brand-logo { width: 39px; height: 39px; flex-basis: 39px; border-radius: 12px; }
          .ffd-brand { gap: 8px; }
          .ffd-brand-name { font-size: 14px; }
          .ffd-brand-tagline { font-size: 7px; letter-spacing: .11em; }
          .ffd-home-btn { min-height: 34px; padding: 0 11px; font-size: 10px; }
          .ffd-auth-layout { border-radius: 21px; }
          .ffd-story-panel { min-height: 0; padding: 17px 17px 16px; }
          .ffd-story-brand-logo { width: 42px; height: 42px; border-radius: 13px; }
          .ffd-story-brand-title { font-size: 14px; }
          .ffd-story-brand-sub { font-size: 7px; }
          .ffd-story-kicker { margin-top: 15px; padding: 5px 8px; font-size: 7px; }
          .ffd-story-title { margin-top: 9px; font-size: 31px; line-height: 1.04; }
          .ffd-story-text { margin-top: 7px; font-size: 10px; line-height: 1.45; }
          .ffd-benefits { gap: 6px; margin-top: 12px; }
          .ffd-benefit { flex-direction: column; align-items: flex-start; gap: 5px; padding: 7px; }
          .ffd-benefit-icon { width: 25px; height: 25px; flex-basis: 25px; font-size: 12px; }
          .ffd-benefit strong { font-size: 8px; }
          .ffd-benefit small { display: none; }
          .ffd-login-panel { padding: 21px 16px 20px; }
          .ffd-login-title { font-size: 27px; }
          .ffd-login-subtitle { font-size: 11px; }
          .ffd-role-label { margin-top: 19px; font-size: 10px; }
          .ffd-role-switch { gap: 5px; padding: 4px; border-radius: 13px; }
          .ffd-role-option { min-height: 54px; flex-direction: column; gap: 4px; padding: 6px 2px; border-radius: 10px; }
          .ffd-role-emoji { font-size: 16px; }
          .ffd-role-name { font-size: 9px; }
          .ffd-form { margin-top: 17px; gap: 11px; }
          .ffd-input-shell { min-height: 48px; padding: 0 11px; border-radius: 12px; }
          .ffd-input { height: 43px; font-size: 12px; }
          .ffd-field-label { font-size: 9px; }
          .ffd-submit { min-height: 49px; border-radius: 12px; font-size: 11px; }
          .ffd-form-trust { gap: 12px; margin-top: 18px; padding-top: 14px; }
          .ffd-trust-item { font-size: 8px; }
          .ffd-auth-footer { margin-top: 11px; font-size: 8px; }
        }
        @media (max-width: 360px) {
          .ffd-benefit { padding: 6px 5px; }
          .ffd-benefit strong { font-size: 7px; }
          .ffd-login-panel { padding-left: 12px; padding-right: 12px; }
          .ffd-role-name { font-size: 8px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .ffd-auth-page *, .ffd-auth-page *::before, .ffd-auth-page *::after { scroll-behavior: auto !important; animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; }
        }
      `}</style>

      <div className="ffd-auth-glow one" aria-hidden="true" />
      <div className="ffd-auth-glow two" aria-hidden="true" />

      <div className="ffd-auth-wrap">
        <header className="ffd-auth-nav">
          <div className="ffd-brand">
            <img
              className="ffd-brand-logo"
              src={LOGO_SRC}
              alt="Farm Fresh Dairy logo"
              onError={(event) => { event.currentTarget.style.visibility = "hidden"; }}
            />
            <div className="ffd-brand-copy">
              <div className="ffd-brand-name">FarmFresh<span>Dairy</span></div>
              <div className="ffd-brand-tagline">Freshness delivered daily</div>
            </div>
          </div>
          <button type="button" className="ffd-home-btn" onClick={() => navigate("/")}>
            <span aria-hidden="true">←</span> Back to shop
          </button>
        </header>

        <main className="ffd-auth-layout">
          <aside className="ffd-story-panel">
            <div className="ffd-story-content">
              <div className="ffd-story-brand">
                <img
                  className="ffd-story-logo"
                  src={LOGO_SRC}
                  alt="Farm Fresh Dairy"
                  onError={(event) => { event.currentTarget.style.visibility = "hidden"; }}
                />
                <div>
                  <div className="ffd-story-brand-title">FarmFreshDairy</div>
                  <div className="ffd-story-brand-sub">Your daily dairy partner</div>
                </div>
              </div>
              <div className="ffd-story-kicker"><span className="ffd-story-kicker-dot" /> Fresh from our farm to your home</div>
              <h1 className="ffd-story-title">A fresher day<br /><span>starts here.</span></h1>
              <p className="ffd-story-text">Order your favourite dairy essentials, manage your milk subscription and keep every delivery close at hand.</p>
              <div className="ffd-benefits">
                <div className="ffd-benefit">
                  <span className="ffd-benefit-icon">🥛</span>
                  <span><strong>Fresh dairy</strong><small>Everyday essentials</small></span>
                </div>
                <div className="ffd-benefit">
                  <span className="ffd-benefit-icon">🚚</span>
                  <span><strong>Doorstep delivery</strong><small>At your convenience</small></span>
                </div>
                <div className="ffd-benefit">
                  <span className="ffd-benefit-icon">🔄</span>
                  <span><strong>Easy subscriptions</strong><small>Pause or renew anytime</small></span>
                </div>
              </div>
            </div>
            <div className="ffd-story-bottom">
              <div className="ffd-fresh-note"><span>Made for your everyday routine</span><b>Fresh • Simple • Reliable</b></div>
            </div>
          </aside>

          <section className="ffd-login-panel" aria-label="Account sign in">
            <div className="ffd-login-content">
              <div className="ffd-login-heading" key={`${selectedRole}-${isLogin}`}>
                <div className="ffd-eyebrow">{active.eyebrow}</div>
                <h2 className="ffd-login-title">{active.title}</h2>
                <p className="ffd-login-subtitle">{active.subtitle}</p>
              </div>

              <div className="ffd-role-label">
                <span>Choose your portal</span>
                <small>Select where you want to sign in</small>
              </div>
              <div className="ffd-role-switch" role="tablist" aria-label="Choose account type">
                {[
                  { role: "customer", label: "Customer", icon: "🥛" },
                  { role: "admin", label: "Admin", icon: "🛡️" },
                  { role: "delivery", label: "Delivery", icon: "🚚" },
                ].map((item) => {
                  const isActive = selectedRole === item.role;
                  return (
                    <button
                      key={item.role}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      className={`ffd-role-option ${isActive ? "active" : ""}`}
                      onClick={() => changeRole(item.role)}
                    >
                      <span className="ffd-role-emoji" aria-hidden="true">{item.icon}</span>
                      <span className="ffd-role-name">{item.label}</span>
                    </button>
                  );
                })}
              </div>

              <form className="ffd-form" onSubmit={handleSubmit} noValidate>
                {selectedRole === "customer" && !isLogin && (
                  <ModernInput
                    label="Full name"
                    icon="👤"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    autoComplete="name"
                  />
                )}

                {selectedRole === "customer" && !isLogin && (
                  <ModernInput
                    label="Email address"
                    icon="✉️"
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                  />
                )}

                <ModernInput
                  label={selectedRole === "customer" ? (isLogin ? "Phone number or email" : "Mobile number") : selectedRole === "admin" ? "Admin email" : "Delivery username / mobile"}
                  icon={selectedRole === "admin" ? "✉️" : "📱"}
                  type={selectedRole === "admin" ? "email" : "text"}
                  placeholder={selectedRole === "customer" ? (isLogin ? "Enter phone number or email" : "Enter mobile number") : selectedRole === "admin" ? "Enter admin email" : "Enter delivery username"}
                  value={selectedRole === "customer" && !isLogin ? mobile : loginId}
                  onChange={(event) => selectedRole === "customer" && !isLogin ? setMobile(event.target.value) : setLoginId(event.target.value)}
                  autoComplete={selectedRole === "admin" ? "username" : "username"}
                  inputMode={selectedRole === "admin" ? "email" : "text"}
                />

                <ModernInput
                  label="Password"
                  icon="🔒"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  rightAction={
                    <button
                      type="button"
                      className="ffd-password-action"
                      onClick={() => setShowPassword((value) => !value)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  }
                />

                {selectedRole === "customer" && isLogin && (
                  <div className="ffd-forgot-row">
                    <button type="button" className="ffd-text-btn" onClick={() => navigate("/forgot-password")}>
                      Forgot password?
                    </button>
                  </div>
                )}

                <button type="submit" className="ffd-submit" disabled={loading}>
                  {loading ? <><span className="ffd-spinner" aria-hidden="true" /> Please wait...</> : <>{active.button}<span aria-hidden="true">→</span></>}
                </button>
              </form>

              {selectedRole === "customer" && (
                <p className="ffd-switch-copy">
                  {isLogin ? "New to FarmFreshDairy? " : "Already have an account? "}
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin((value) => !value);
                      setPassword("");
                      setShowPassword(false);
                    }}
                  >
                    {isLogin ? "Create an account" : "Sign in instead"}
                  </button>
                </p>
              )}

              <div className="ffd-form-trust">
                <span className="ffd-trust-item"><span>✓</span> Simple ordering</span>
                <span className="ffd-trust-item"><span>✓</span> Manage deliveries</span>
                <span className="ffd-trust-item"><span>✓</span> Secure access</span>
              </div>
              <div className="ffd-auth-footer">© {new Date().getFullYear()} <strong>FarmFreshDairy</strong> · Freshness delivered daily</div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function ModernInput({
  label,
  icon,
  type = "text",
  placeholder,
  value,
  onChange,
  rightAction,
  autoComplete = "on",
  inputMode,
}) {
  return (
    <label className="ffd-field">
      <span className="ffd-field-label">{label}</span>
      <span className="ffd-input-shell">
        <span className="ffd-input-icon" aria-hidden="true">{icon}</span>
        <input
          className="ffd-input"
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          inputMode={inputMode}
        />
        {rightAction}
      </span>
    </label>
  );
}
