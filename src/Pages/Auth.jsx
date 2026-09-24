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

/*
  Farm Fresh Dairy - Modern Authentication
  -----------------------------------------
  Replace /logo.png below with your actual logo path if your logo
  is stored somewhere else.
*/

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
    if (!name || !email || !mobile || !password) {
      alert("Please fill all fields");
      return;
    }

    try {
      setLoading(true);

      const res = await registerCustomer({
        full_name: name,
        phone: mobile,
        email,
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
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerLogin = async () => {
    if (!loginId || !password) {
      alert("Please enter Email and Password");
      return;
    }

    try {
      setLoading(true);

      const res = await loginCustomer(loginId, password);

      if (!res.success) {
        alert(res.message);
        return;
      }

      setCustomerLogin(res.user);
      login(res.user);

      localStorage.setItem(
        "supabase_session",
        JSON.stringify(res.session)
      );

      redirectUser("/dashboard");
    } catch (error) {
      console.error(error);
      alert(error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async () => {
    if (!loginId || !password) {
      alert("Please enter Email and Password");
      return;
    }

    try {
      setLoading(true);

      const admin = await adminLogin(loginId, password);

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
    if (!loginId || !password) {
      alert("Please enter mobile number and password");
      return;
    }

    try {
      setLoading(true);

      const res = await deliveryLogin(loginId, password);

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

      localStorage.setItem(
        "deliveryBoy",
        JSON.stringify(res.deliveryBoy)
      );

      navigate("/delivery");
    } catch (err) {
      console.error(err);
      alert(err.message || "Delivery login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (selectedRole === "customer") {
      if (isLogin) {
        await handleCustomerLogin();
      } else {
        await handleCustomerSignup();
      }
      return;
    }

    if (selectedRole === "admin") {
      await handleAdminLogin();
      return;
    }

    if (selectedRole === "delivery") {
      await handleDeliveryLogin();
    }
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
      label: "Customer",
      eyebrow: isLogin ? "WELCOME BACK" : "JOIN FARM FRESH",
      title: isLogin ? "Freshness starts here." : "Join the fresh family.",
      subtitle: isLogin
        ? "Sign in and manage your daily dairy deliveries."
        : "Create your account for easy ordering and subscriptions.",
      button: isLogin ? "Sign in" : "Create account",
    },
    admin: {
      icon: "🛡️",
      label: "Admin",
      eyebrow: "ADMIN PORTAL",
      title: "Manage your dairy.",
      subtitle: "Secure access to Farm Fresh Dairy operations.",
      button: "Admin sign in",
    },
    delivery: {
      icon: "🚚",
      label: "Delivery",
      eyebrow: "DELIVERY PORTAL",
      title: "Deliver freshness.",
      subtitle: "Access your assigned deliveries and delivery tools.",
      button: "Delivery sign in",
    },
  };

  const active = roleData[selectedRole];

  return (
    <div className="auth-page">
      <style>{`
        * { box-sizing: border-box; }

        @keyframes authBlob {
          0%, 100% { transform: translate3d(0,0,0) scale(1); }
          50% { transform: translate3d(18px,-20px,0) scale(1.08); }
        }

        @keyframes authBlobTwo {
          0%, 100% { transform: translate3d(0,0,0) scale(1); }
          50% { transform: translate3d(-20px,18px,0) scale(1.06); }
        }

        @keyframes authLogo {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-5px) rotate(1deg); }
        }

        @keyframes authIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes authShine {
          0% { transform: translateX(-140%) skewX(-18deg); }
          100% { transform: translateX(420%) skewX(-18deg); }
        }

        @keyframes authPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,.15); }
          50% { box-shadow: 0 0 0 9px rgba(16,185,129,0); }
        }

        .auth-page {
          min-height: 100dvh;
          width: 100%;
          overflow-x: hidden;
          position: relative;
          background:
            radial-gradient(circle at 10% 10%, rgba(167,243,208,.42), transparent 28%),
            radial-gradient(circle at 90% 85%, rgba(153,246,228,.38), transparent 30%),
            #f7fbf8;
          color: #0f172a;
          padding: 18px;
        }

        .auth-page button,
        .auth-page input {
          font: inherit;
        }

        .auth-bg-blob {
          position: fixed;
          pointer-events: none;
          border-radius: 999px;
          filter: blur(45px);
          z-index: 0;
        }

        .auth-blob-one {
          width: 240px;
          height: 240px;
          left: -90px;
          top: 100px;
          background: rgba(52,211,153,.22);
          animation: authBlob 7s ease-in-out infinite;
        }

        .auth-blob-two {
          width: 280px;
          height: 280px;
          right: -120px;
          bottom: 30px;
          background: rgba(45,212,191,.18);
          animation: authBlobTwo 8s ease-in-out infinite;
        }

        .auth-shell {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 1120px;
          min-height: calc(100dvh - 36px);
          margin: 0 auto;
          display: grid;
          grid-template-columns: .82fr 1.18fr;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,.85);
          border-radius: 34px;
          background: rgba(255,255,255,.82);
          box-shadow: 0 30px 90px rgba(15,23,42,.12);
          backdrop-filter: blur(20px);
        }

        .auth-brand {
          position: relative;
          overflow: hidden;
          padding: 42px;
          color: white;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          background:
            radial-gradient(circle at 85% 15%, rgba(110,231,183,.28), transparent 28%),
            linear-gradient(145deg, #052e24 0%, #065f46 50%, #087f65 100%);
        }

        .auth-brand::after {
          content: "";
          position: absolute;
          width: 330px;
          height: 330px;
          right: -180px;
          bottom: -150px;
          border-radius: 50%;
          background: rgba(110,231,183,.12);
          filter: blur(8px);
        }

        .auth-brand-logo {
          width: 82px;
          height: 82px;
          object-fit: contain;
          border-radius: 24px;
          background: white;
          padding: 7px;
          box-shadow: 0 18px 40px rgba(0,0,0,.18);
          animation: authLogo 4s ease-in-out infinite;
        }

        .auth-brand-name {
          margin-top: 20px;
          font-size: 24px;
          font-weight: 900;
          letter-spacing: -.04em;
        }

        .auth-brand-title {
          margin-top: 38px;
          max-width: 460px;
          font-size: clamp(38px, 4vw, 62px);
          line-height: .98;
          letter-spacing: -.055em;
          font-weight: 950;
        }

        .auth-brand-title span {
          color: #a7f3d0;
        }

        .auth-brand-copy {
          margin-top: 20px;
          max-width: 430px;
          color: rgba(255,255,255,.67);
          line-height: 1.7;
          font-size: 14px;
        }

        .auth-feature-list {
          display: grid;
          gap: 10px;
          margin-top: 35px;
        }

        .auth-feature {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 13px;
          border: 1px solid rgba(255,255,255,.1);
          border-radius: 18px;
          background: rgba(255,255,255,.08);
          backdrop-filter: blur(10px);
          transition: .25s ease;
        }

        .auth-feature:hover {
          transform: translateX(5px);
          background: rgba(255,255,255,.13);
        }

        .auth-feature-icon {
          width: 42px;
          height: 42px;
          flex: 0 0 42px;
          display: grid;
          place-items: center;
          border-radius: 14px;
          background: rgba(255,255,255,.11);
          font-size: 19px;
        }

        .auth-form-side {
          display: flex;
          align-items: center;
          padding: 34px;
          background: rgba(255,255,255,.94);
        }

        .auth-form {
          width: 100%;
          max-width: 570px;
          margin: auto;
        }

        .auth-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .auth-back {
          border: 0;
          background: #f1f5f9;
          color: #475569;
          border-radius: 999px;
          padding: 10px 14px;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
          transition: .2s ease;
        }

        .auth-back:hover {
          background: #ecfdf5;
          color: #047857;
          transform: translateX(-2px);
        }

        .auth-status {
          display: flex;
          align-items: center;
          gap: 7px;
          color: #047857;
          font-size: 11px;
          font-weight: 900;
        }

        .auth-status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #10b981;
          animation: authPulse 2s infinite;
        }

        .auth-mobile-brand {
          display: none;
        }

        .auth-heading {
          animation: authIn .5s cubic-bezier(.22,1,.36,1);
        }

        .auth-logo-wrap {
          width: 72px;
          height: 72px;
          margin: 0 auto 17px;
          padding: 5px;
          border-radius: 23px;
          background: linear-gradient(135deg,#ecfdf5,#d1fae5);
          box-shadow: 0 12px 28px rgba(16,185,129,.14);
        }

        .auth-logo {
          width: 100%;
          height: 100%;
          object-fit: contain;
          border-radius: 18px;
          background: white;
          animation: authLogo 4s ease-in-out infinite;
        }

        .auth-eyebrow {
          text-align: center;
          color: #059669;
          font-size: 10px;
          letter-spacing: .22em;
          font-weight: 950;
        }

        .auth-title {
          margin-top: 7px;
          text-align: center;
          font-size: clamp(29px, 4vw, 42px);
          line-height: 1.05;
          letter-spacing: -.045em;
          font-weight: 950;
          color: #0f172a;
        }

        .auth-subtitle {
          max-width: 440px;
          margin: 10px auto 0;
          text-align: center;
          color: #94a3b8;
          font-size: 13px;
          line-height: 1.55;
          font-weight: 600;
        }

        .auth-roles {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 7px;
          padding: 6px;
          margin-top: 25px;
          border-radius: 19px;
          background: #f1f5f9;
        }

        .auth-role {
          min-width: 0;
          border: 0;
          border-radius: 14px;
          padding: 11px 7px;
          background: transparent;
          color: #64748b;
          cursor: pointer;
          font-size: 11px;
          font-weight: 900;
          transition: .25s ease;
        }

        .auth-role-icon {
          display: block;
          font-size: 18px;
          margin-bottom: 3px;
        }

        .auth-role.active {
          color: #047857;
          background: white;
          box-shadow: 0 7px 18px rgba(15,23,42,.08);
        }

        .auth-module-title {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 12px;
          margin-top: 22px;
          margin-bottom: 9px;
        }

        .auth-module-title span {
          color: #334155;
          font-size: 12px;
          font-weight: 950;
        }

        .auth-module-title small {
          color: #94a3b8;
          font-size: 9px;
          font-weight: 800;
        }

        .auth-modules {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 9px;
        }

        .auth-module-card {
          position: relative;
          min-width: 0;
          min-height: 92px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 7px;
          padding: 10px 6px 9px;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          background: rgba(248,250,252,.9);
          color: #64748b;
          cursor: pointer;
          transition:
            transform .25s cubic-bezier(.22,1,.36,1),
            border-color .25s ease,
            box-shadow .25s ease,
            background .25s ease;
        }

        .auth-module-card::before {
          content: "";
          position: absolute;
          width: 75px;
          height: 75px;
          top: -35px;
          right: -25px;
          border-radius: 50%;
          background: currentColor;
          opacity: .04;
          transition: transform .35s ease, opacity .35s ease;
        }

        .auth-module-card:hover {
          transform: translateY(-3px);
          border-color: #cbd5e1;
          box-shadow: 0 12px 25px rgba(15,23,42,.08);
        }

        .auth-module-card:hover::before,
        .auth-module-card.active::before {
          transform: scale(1.5);
          opacity: .08;
        }

        .auth-module-card.active {
          transform: translateY(-2px);
          background: white;
          box-shadow: 0 13px 30px rgba(15,23,42,.10);
        }

        .auth-module-card.green {
          color: #059669;
        }

        .auth-module-card.blue {
          color: #2563eb;
        }

        .auth-module-card.orange {
          color: #ea580c;
        }

        .auth-module-icon {
          position: relative;
          z-index: 1;
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          border-radius: 14px;
          background: white;
          border: 1px solid rgba(226,232,240,.9);
          box-shadow: 0 7px 16px rgba(15,23,42,.07);
          transition: transform .3s cubic-bezier(.22,1,.36,1);
        }

        .auth-module-card:hover .auth-module-icon,
        .auth-module-card.active .auth-module-icon {
          transform: scale(1.08) rotate(-2deg);
        }

        .auth-module-customer-logo {
          width: 31px;
          height: 31px;
          object-fit: contain;
          border-radius: 9px;
        }

        .auth-module-fallback {
          display: none;
          place-items: center;
          width: 100%;
          height: 100%;
          font-size: 21px;
        }

        .auth-module-symbol {
          font-size: 21px;
          line-height: 1;
        }

        .auth-module-text {
          position: relative;
          z-index: 1;
          min-width: 0;
          text-align: center;
        }

        .auth-module-text strong {
          display: block;
          color: #0f172a;
          font-size: 11px;
          font-weight: 950;
        }

        .auth-module-text small {
          display: block;
          margin-top: 2px;
          color: #94a3b8;
          font-size: 8px;
          font-weight: 750;
          white-space: nowrap;
        }

        .auth-module-check {
          position: absolute;
          top: 7px;
          right: 7px;
          width: 18px;
          height: 18px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          color: white;
          background: currentColor;
          font-size: 10px;
          font-weight: 950;
          box-shadow: 0 4px 10px rgba(15,23,42,.12);
        }

        .auth-module-card.green .auth-module-check {
          color: white;
          background: #059669;
        }

        .auth-module-card.blue .auth-module-check {
          color: white;
          background: #2563eb;
        }

        .auth-module-card.orange .auth-module-check {
          color: white;
          background: #ea580c;
        }

        .auth-fields {
          margin-top: 22px;
          display: grid;
          gap: 13px;
          animation: authIn .5s .05s both cubic-bezier(.22,1,.36,1);
        }

        .auth-label {
          display: block;
          margin: 0 0 6px 3px;
          color: #64748b;
          font-size: 9px;
          letter-spacing: .13em;
          text-transform: uppercase;
          font-weight: 950;
        }

        .auth-input-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
          min-height: 52px;
          padding: 0 14px;
          border: 1px solid #e2e8f0;
          border-radius: 17px;
          background: #f8fafc;
          transition: .25s ease;
        }

        .auth-input-wrap:focus-within {
          border-color: #34d399;
          background: white;
          box-shadow: 0 0 0 4px rgba(16,185,129,.09);
          transform: translateY(-1px);
        }

        .auth-input-icon {
          width: 27px;
          height: 27px;
          flex: 0 0 27px;
          display: grid;
          place-items: center;
          border-radius: 9px;
          background: #ecfdf5;
          font-size: 13px;
        }

        .auth-input {
          width: 100%;
          min-width: 0;
          border: 0;
          outline: 0;
          background: transparent;
          color: #0f172a;
          font-size: 14px;
          font-weight: 700;
        }

        .auth-input::placeholder {
          color: #94a3b8;
          font-weight: 600;
        }

        .auth-eye {
          border: 0;
          background: transparent;
          color: #64748b;
          padding: 5px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 900;
        }

        .auth-forgot {
          display: flex;
          justify-content: flex-end;
          margin-top: -3px;
        }

        .auth-link {
          border: 0;
          background: transparent;
          color: #047857;
          font-size: 11px;
          font-weight: 900;
          cursor: pointer;
        }

        .auth-main-btn {
          position: relative;
          width: 100%;
          min-height: 54px;
          overflow: hidden;
          border: 0;
          border-radius: 17px;
          margin-top: 3px;
          color: white;
          background: linear-gradient(135deg,#059669,#0d9488);
          box-shadow: 0 14px 30px rgba(5,150,105,.22);
          cursor: pointer;
          font-size: 14px;
          font-weight: 950;
          transition: .25s ease;
        }

        .auth-main-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 18px 35px rgba(5,150,105,.27);
        }

        .auth-main-btn:active {
          transform: scale(.985);
        }

        .auth-main-btn:disabled {
          opacity: .6;
          cursor: not-allowed;
          transform: none;
        }

        .auth-shine {
          position: absolute;
          inset: 0 auto 0 -30%;
          width: 25%;
          background: rgba(255,255,255,.2);
          transform: skewX(-18deg);
        }

        .auth-main-btn:hover .auth-shine {
          animation: authShine .8s ease;
        }

        .auth-switch {
          width: 100%;
          border: 0;
          background: transparent;
          padding: 13px 4px 4px;
          color: #64748b;
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
        }

        .auth-switch strong {
          color: #047857;
        }

        .auth-trust {
          display: grid;
          grid-template-columns: repeat(3,1fr);
          gap: 8px;
          margin-top: 22px;
          padding-top: 18px;
          border-top: 1px solid #f1f5f9;
        }

        .auth-trust-item {
          text-align: center;
          color: #94a3b8;
          font-size: 9px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: .08em;
        }

        .auth-trust-icon {
          font-size: 18px;
          margin-bottom: 4px;
        }

        .auth-bottom-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          margin-top: 17px;
          color: #94a3b8;
          font-size: 9px;
          font-weight: 800;
        }

        .auth-bottom-logo img {
          width: 24px;
          height: 24px;
          object-fit: contain;
          border-radius: 7px;
        }

        @media (max-width: 900px) {
          .auth-page {
            padding: 0;
          }

          .auth-shell {
            min-height: 100dvh;
            width: 100%;
            display: block;
            border: 0;
            border-radius: 0;
            box-shadow: none;
            background: rgba(255,255,255,.94);
          }

          .auth-brand {
            display: none;
          }

          .auth-form-side {
            min-height: 100dvh;
            display: block;
            padding: 18px 16px 28px;
            background: transparent;
          }

          .auth-form {
            max-width: 560px;
          }

          .auth-top {
            margin-bottom: 18px;
          }

          .auth-mobile-brand {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            margin: 3px 0 21px;
          }

          .auth-mobile-brand img {
            width: 43px;
            height: 43px;
            object-fit: contain;
            border-radius: 13px;
            background: white;
            padding: 3px;
            box-shadow: 0 7px 18px rgba(15,23,42,.1);
            animation: authLogo 4s ease-in-out infinite;
          }

          .auth-mobile-brand-name {
            color: #0f172a;
            font-size: 18px;
            font-weight: 950;
            letter-spacing: -.04em;
          }

          .auth-mobile-brand-name span {
            color: #059669;
          }

          .auth-mobile-tagline {
            color: #94a3b8;
            font-size: 8px;
            font-weight: 800;
            margin-top: 1px;
          }

          .auth-status {
            display: none;
          }

          .auth-back {
            background: #f8fafc;
            padding: 9px 12px;
          }

          .auth-logo-wrap {
            width: 62px;
            height: 62px;
            margin-bottom: 14px;
          }

          .auth-title {
            font-size: 30px;
          }

          .auth-subtitle {
            font-size: 12px;
            max-width: 350px;
          }

          .auth-roles {
            margin-top: 21px;
          }

          .auth-fields {
            margin-top: 19px;
            gap: 12px;
          }

          .auth-input-wrap {
            min-height: 51px;
          }

          .auth-trust {
            margin-top: 20px;
          }
        }

        @media (max-width: 600px) {
          .auth-module-title {
            margin-top: 19px;
          }

          .auth-module-title span {
            font-size: 11px;
          }

          .auth-module-title small {
            font-size: 8px;
          }

          .auth-modules {
            gap: 7px;
          }

          .auth-module-card {
            min-height: 84px;
            padding: 8px 4px;
            border-radius: 17px;
          }

          .auth-module-icon {
            width: 37px;
            height: 37px;
            border-radius: 12px;
          }

          .auth-module-customer-logo {
            width: 27px;
            height: 27px;
          }

          .auth-module-symbol {
            font-size: 18px;
          }

          .auth-module-text strong {
            font-size: 10px;
          }

          .auth-module-text small {
            font-size: 7px;
          }

          .auth-module-check {
            width: 16px;
            height: 16px;
            top: 5px;
            right: 5px;
            font-size: 9px;
          }
        }

        @media (max-width: 380px) {
          .auth-form-side {
            padding-left: 12px;
            padding-right: 12px;
          }

          .auth-title {
            font-size: 27px;
          }

          .auth-role {
            font-size: 10px;
            padding: 10px 5px;
          }

          .auth-role-icon {
            font-size: 16px;
          }

          .auth-input-wrap {
            min-height: 49px;
            padding: 0 12px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .auth-bg-blob,
          .auth-brand-logo,
          .auth-logo,
          .auth-mobile-brand img,
          .auth-heading,
          .auth-fields {
            animation: none !important;
          }
        }
      `}</style>

      <div className="auth-bg-blob auth-blob-one" />
      <div className="auth-bg-blob auth-blob-two" />

      <div className="auth-shell">
        {/* Desktop brand panel */}
        <aside className="auth-brand">
          <div>
            <img
              src={LOGO_SRC}
              alt="Farm Fresh Dairy"
              className="auth-brand-logo"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />

            <div className="auth-brand-name">
              FarmFresh<span style={{ color: "#6ee7b7" }}>Dairy</span>
            </div>

            <h1 className="auth-brand-title">
              Freshness
              <span className="block">delivered daily.</span>
            </h1>

            <p className="auth-brand-copy">
              Fresh buffalo milk, curd, ghee and paneer delivered to your
              doorstep with a simple and reliable dairy experience.
            </p>
          </div>

          <div className="auth-feature-list">
            {[
              ["🥛", "Fresh dairy", "Fresh milk and dairy products"],
              ["🚚", "Doorstep delivery", "Daily delivery to your home"],
              ["🔄", "Easy subscriptions", "Pause, resume and manage easily"],
            ].map(([icon, title, text]) => (
              <div className="auth-feature" key={title}>
                <div className="auth-feature-icon">{icon}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 900 }}>{title}</div>
                  <div
                    style={{
                      marginTop: 2,
                      fontSize: 10,
                      color: "rgba(255,255,255,.55)",
                      fontWeight: 700,
                    }}
                  >
                    {text}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Form */}
        <section className="auth-form-side">
          <div className="auth-form">
            <div className="auth-top">
              <button
                type="button"
                className="auth-back"
                onClick={() => navigate("/")}
              >
                ← Home
              </button>

              <div className="auth-status">
                <span className="auth-status-dot" />
                Fresh every day
              </div>
            </div>

            {/* Mobile logo/header */}
            <div className="auth-mobile-brand">
              <img
                src={LOGO_SRC}
                alt="Farm Fresh Dairy logo"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
              <div>
                <div className="auth-mobile-brand-name">
                  FarmFresh<span>Dairy</span>
                </div>
                <div className="auth-mobile-tagline">
                  FRESHNESS DELIVERED DAILY
                </div>
              </div>
            </div>

            <div className="auth-heading" key={`${selectedRole}-${isLogin}`}>
              <div className="auth-logo-wrap">
                <img
                  src={LOGO_SRC}
                  alt="Farm Fresh Dairy"
                  className="auth-logo"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>

              <div className="auth-eyebrow">{active.eyebrow}</div>
              <h2 className="auth-title">{active.title}</h2>
              <p className="auth-subtitle">{active.subtitle}</p>
            </div>

            {/* Mobile-first module selector */}
            <div className="auth-module-title">
              <span>Choose your portal</span>
              <small>Tap a module to continue</small>
            </div>

            <div className="auth-modules" role="tablist" aria-label="Choose portal">
              {[
                {
                  role: "customer",
                  label: "Customer",
                  short: "Shop & Subscribe",
                  icon: "customer",
                  tone: "green",
                },
                {
                  role: "admin",
                  label: "Admin",
                  short: "Manage Business",
                  icon: "admin",
                  tone: "blue",
                },
                {
                  role: "delivery",
                  label: "Delivery",
                  short: "Deliver Orders",
                  icon: "delivery",
                  tone: "orange",
                },
              ].map((item) => {
                const activeRole = selectedRole === item.role;

                return (
                  <button
                    key={item.role}
                    type="button"
                    role="tab"
                    aria-selected={activeRole}
                    className={`auth-module-card ${
                      activeRole ? "active" : ""
                    } ${item.tone}`}
                    onClick={() => changeRole(item.role)}
                  >
                    <span className="auth-module-icon">
                      {item.icon === "customer" && (
                        <img
                          src={LOGO_SRC}
                          alt=""
                          className="auth-module-customer-logo"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            e.currentTarget.nextElementSibling.style.display = "grid";
                          }}
                        />
                      )}

                      {item.icon === "customer" && (
                        <span className="auth-module-fallback">🥛</span>
                      )}

                      {item.icon === "admin" && (
                        <span className="auth-module-symbol">🛡️</span>
                      )}

                      {item.icon === "delivery" && (
                        <span className="auth-module-symbol">🚚</span>
                      )}
                    </span>

                    <span className="auth-module-text">
                      <strong>{item.label}</strong>
                      <small>{item.short}</small>
                    </span>

                    {activeRole && <span className="auth-module-check">✓</span>}
                  </button>
                );
              })}
            </div>

            <div className="auth-fields">
              {selectedRole === "customer" && !isLogin && (
                <ModernInput
                  label="Full name"
                  icon="👤"
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              )}

              {selectedRole === "customer" && !isLogin && (
                <ModernInput
                  label="Email address"
                  icon="✉️"
                  type="email"
                  placeholder="Your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              )}

              <ModernInput
                label={
                  selectedRole === "customer"
                    ? isLogin
                      ? "Phone or email"
                      : "Mobile number"
                    : selectedRole === "admin"
                    ? "Admin email"
                    : "Delivery username"
                }
                icon={selectedRole === "admin" ? "✉️" : "📱"}
                type={selectedRole === "admin" ? "email" : "text"}
                placeholder={
                  selectedRole === "customer"
                    ? isLogin
                      ? "Enter phone number or email"
                      : "Enter mobile number"
                    : selectedRole === "admin"
                    ? "Enter admin email"
                    : "Enter delivery username"
                }
                value={
                  selectedRole === "customer" && !isLogin
                    ? mobile
                    : loginId
                }
                onChange={(e) =>
                  selectedRole === "customer" && !isLogin
                    ? setMobile(e.target.value)
                    : setLoginId(e.target.value)
                }
              />

              <ModernInput
                label="Password"
                icon="🔒"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                rightAction={
                  <button
                    type="button"
                    className="auth-eye"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                }
              />

              {selectedRole === "customer" && isLogin && (
                <div className="auth-forgot">
                  <button
                    type="button"
                    className="auth-link"
                    onClick={() => navigate("/forgot-password")}
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <button
                type="button"
                className="auth-main-btn"
                onClick={handleSubmit}
                disabled={loading}
              >
                <span style={{ position: "relative", zIndex: 2 }}>
                  {loading ? "Please wait..." : active.button}
                  {!loading && "  →"}
                </span>
                <span className="auth-shine" />
              </button>

              {selectedRole === "customer" && (
                <button
                  type="button"
                  className="auth-switch"
                  onClick={() => {
                    setIsLogin((v) => !v);
                    setPassword("");
                    setShowPassword(false);
                  }}
                >
                  {isLogin ? (
                    <>
                      New to Farm Fresh?{" "}
                      <strong>Create an account</strong>
                    </>
                  ) : (
                    <>
                      Already have an account?{" "}
                      <strong>Sign in</strong>
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="auth-trust">
              {[
                ["🥛", "Fresh"],
                ["🚚", "Daily"],
                ["💚", "Reliable"],
              ].map(([icon, text]) => (
                <div className="auth-trust-item" key={text}>
                  <div className="auth-trust-icon">{icon}</div>
                  {text}
                </div>
              ))}
            </div>

            <div className="auth-bottom-logo">
              <img
                src={LOGO_SRC}
                alt=""
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
              Farm Fresh Dairy • Freshness delivered daily
            </div>
          </div>
        </section>
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
}) {
  return (
    <label>
      <span className="auth-label">{label}</span>

      <div className="auth-input-wrap">
        <span className="auth-input-icon">{icon}</span>

        <input
          className="auth-input"
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoComplete={type === "password" ? "current-password" : "on"}
        />

        {rightAction}
      </div>
    </label>
  );
}
