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

export default function Auth() {
  const navigate = useNavigate();
  const { login } = useAuthSession();
  const [loading, setLoading] = useState(false);

  /* -----------------------------
     STATES
  ------------------------------*/

  const [selectedRole, setSelectedRole] = useState("customer");
  const [isLogin, setIsLogin] = useState(true);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");

  /* -----------------------------
     REDIRECT
  ------------------------------*/
 

  const redirectUser = (defaultPath = "/") => {
    const redirectPath = getRedirectAfterLogin();

    if (redirectPath) {
      clearRedirectAfterLogin();
      navigate(redirectPath);
    } else {
      navigate(defaultPath);
    }
  };

  /* -----------------------------
     CUSTOMER SIGNUP
  ------------------------------*/
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
  /* -----------------------------
     CUSTOMER LOGIN
     Mobile OR Email
  ------------------------------*/
 const handleCustomerLogin = async () => {
  if (!loginId || !password) {
    alert("Please enter Email and Password");
    return;
  }

  try {
    setLoading(true);

    const res = await loginCustomer(
      loginId,
      password
    );

    if (!res.success) {
      alert(res.message);
      return;
    }

  setCustomerLogin(res.user);

      // Update React Context immediately
      login(res.user);

      localStorage.setItem(
        "supabase_session",
        JSON.stringify(res.session)
      );

        console.log(
          "Local Storage:",
          localStorage.getItem("customer")
        );
   
    redirectUser("/dashboard");

  } catch (error) {
    console.error(error);
    alert(error.message || "Login failed");
  } finally {
    setLoading(false);
  }
};

 
    /* -----------------------------
     ADMIN LOGIN
  ------------------------------*/

 const handleAdminLogin = async () => {
  if (!loginId || !password) {
    alert("Please enter Email and Password");
    return;
  }

  try {
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
  }
};

  /* -----------------------------
     DELIVERY LOGIN
  ------------------------------*/

 const handleDeliveryLogin = async () => {

    if (!loginId || !password) {
        alert("Please enter mobile number and password");
        return;
    }

    try {

        setLoading(true);

        const res = await deliveryLogin(
            loginId,
            password
        );

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

  /* -----------------------------
     SUBMIT
  ------------------------------*/

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
      handleAdminLogin();
      return;
    }

    if (selectedRole === "delivery") {
      handleDeliveryLogin();
      return;
    }

  };

  /* -----------------------------
     UI
  ------------------------------*/

  return (
    <div className="relative min-h-[100dvh] overflow-x-hidden bg-[#f5fbf7] text-slate-900">
      <style>{`
        @keyframes authPageIn {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes authBlob {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(0, -12px, 0) scale(1.06); }
        }

        @keyframes authFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-7px) rotate(2deg); }
        }

        @keyframes authShimmer {
          0% { transform: translateX(-140%); }
          100% { transform: translateX(260%); }
        }

        @keyframes authPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,.18); }
          50% { box-shadow: 0 0 0 10px rgba(16,185,129,0); }
        }

        .auth-page-in {
          animation: authPageIn .55s cubic-bezier(.22,1,.36,1) both;
        }

        .auth-blob {
          animation: authBlob 6s ease-in-out infinite;
        }

        .auth-float {
          animation: authFloat 4s ease-in-out infinite;
        }

        .auth-pulse {
          animation: authPulse 2.4s ease-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .auth-page-in, .auth-blob, .auth-float, .auth-pulse {
            animation: none !important;
          }
        }

        @media (max-width: 380px) {
          .auth-compact {
            padding-left: .75rem !important;
            padding-right: .75rem !important;
          }
        }
      `}</style>

      {/* Soft animated background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="auth-blob absolute -left-24 -top-20 h-72 w-72 rounded-full bg-emerald-200/40 blur-3xl" />
        <div
          className="auth-blob absolute -right-28 top-[35%] h-80 w-80 rounded-full bg-teal-200/30 blur-3xl"
          style={{ animationDelay: "1.5s" }}
        />
        <div
          className="auth-blob absolute -bottom-28 left-[20%] h-64 w-64 rounded-full bg-lime-100/45 blur-3xl"
          style={{ animationDelay: "3s" }}
        />
      </div>

      <main className="auth-compact relative mx-auto flex min-h-[100dvh] w-full max-w-xl flex-col px-4 pb-8 pt-5 sm:px-6 sm:pt-8 lg:max-w-6xl lg:justify-center lg:py-10">
        {/* Top bar */}
        <div className="mb-5 flex items-center justify-between sm:mb-7">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="group inline-flex min-h-10 items-center gap-2 rounded-full border border-white/80 bg-white/75 px-3.5 text-xs font-extrabold text-slate-600 shadow-sm backdrop-blur-xl transition active:scale-95 hover:border-emerald-200 hover:text-emerald-700"
          >
            <span className="transition-transform group-hover:-translate-x-0.5">←</span>
            Home
          </button>

          <div className="flex items-center gap-2 rounded-full border border-emerald-100 bg-white/75 px-3 py-2 text-[10px] font-black text-emerald-700 shadow-sm backdrop-blur-xl">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 auth-pulse" />
            Fresh every day
          </div>
        </div>

        <section className="auth-page-in overflow-hidden rounded-[30px] border border-white/90 bg-white/90 shadow-[0_24px_80px_rgba(15,23,42,.12)] backdrop-blur-xl lg:grid lg:grid-cols-[.85fr_1.15fr] lg:rounded-[38px]">
          {/* Desktop brand panel */}
          <aside className="relative hidden min-h-[680px] overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-800 to-teal-700 p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <div className="absolute -right-28 -top-28 h-80 w-80 rounded-full bg-emerald-300/15 blur-3xl" />
            <div className="absolute -bottom-28 -left-20 h-80 w-80 rounded-full bg-teal-300/10 blur-3xl" />

            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3.5 py-2 text-xs font-black backdrop-blur">
                <span>🌿</span>
                Farm Fresh Dairy
              </div>

              <div className="auth-float mt-12 flex h-20 w-20 items-center justify-center rounded-[28px] bg-white/10 text-5xl shadow-2xl ring-1 ring-white/10 backdrop-blur">
                🥛
              </div>

              <h1 className="mt-7 max-w-md text-5xl font-black leading-[1.02] tracking-tight">
                Freshness
                <span className="block text-emerald-200">delivered daily.</span>
              </h1>

              <p className="mt-5 max-w-md text-sm leading-6 text-white/65">
                Fresh milk, dairy products and subscriptions delivered to your doorstep.
              </p>
            </div>

            <div className="relative space-y-3">
              {[
                ["🥛", "Fresh dairy", "Milk, curd, ghee & paneer"],
                ["🚚", "Daily delivery", "Freshness at your doorstep"],
                ["🔄", "Easy subscription", "Pause, renew and manage easily"],
              ].map(([icon, title, description]) => (
                <div
                  key={title}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 p-3.5 backdrop-blur transition hover:bg-white/15"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-lg">
                    {icon}
                  </span>
                  <div>
                    <p className="text-sm font-black">{title}</p>
                    <p className="text-[10px] font-semibold text-white/50">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </aside>

          {/* Mobile / desktop form */}
          <div className="relative p-4 sm:p-7 lg:p-10">
            <div className="mx-auto w-full max-w-xl">
              {/* Mobile brand header */}
              <div className="mb-6 flex items-center justify-between lg:hidden">
                <div className="flex items-center gap-3">
                  <div className="auth-float flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-2xl shadow-lg shadow-emerald-200/70">
                    🥛
                  </div>
                  <div>
                    <p className="text-[17px] font-black tracking-tight">
                      FarmFresh<span className="text-emerald-600">Dairy</span>
                    </p>
                    <p className="text-[10px] font-bold text-slate-400">
                      Freshness delivered daily
                    </p>
                  </div>
                </div>

                <div className="rounded-full bg-emerald-50 px-2.5 py-1.5 text-[9px] font-black text-emerald-700">
                  100% Fresh
                </div>
              </div>

              {/* Heading */}
              <div className="text-center">
                <div className="auth-pulse mx-auto flex h-14 w-14 items-center justify-center rounded-[20px] bg-emerald-50 text-2xl ring-8 ring-emerald-50/60">
                  {selectedRole === "customer"
                    ? "🥛"
                    : selectedRole === "admin"
                    ? "🛡️"
                    : "🚚"}
                </div>

                <p className="mt-4 text-[9px] font-black uppercase tracking-[.24em] text-emerald-600">
                  {selectedRole === "customer"
                    ? isLogin
                      ? "Welcome back"
                      : "Join Farm Fresh"
                    : selectedRole === "admin"
                    ? "Admin portal"
                    : "Delivery portal"}
                </p>

                <h2 className="mt-1.5 text-[27px] font-black tracking-tight text-slate-950 sm:text-4xl">
                  {selectedRole === "customer"
                    ? isLogin
                      ? "Welcome back 👋"
                      : "Create your account"
                    : selectedRole === "admin"
                    ? "Admin Login"
                    : "Delivery Login"}
                </h2>

                <p className="mx-auto mt-2 max-w-xs text-[11px] font-semibold leading-5 text-slate-400 sm:text-sm">
                  {selectedRole === "customer"
                    ? isLogin
                      ? "Sign in to manage your dairy account."
                      : "Start your fresh daily delivery journey."
                    : selectedRole === "admin"
                    ? "Manage your Farm Fresh Dairy operations."
                    : "Access your assigned deliveries."}
                </p>
              </div>

              {/* Role switch */}
              <div className="mt-6 grid grid-cols-3 gap-1 rounded-2xl bg-slate-100/90 p-1.5 shadow-inner">
                {[
                  ["customer", "🥛", "Customer"],
                  ["admin", "🛡️", "Admin"],
                  ["delivery", "🚚", "Delivery"],
                ].map(([roleName, icon, label]) => {
                  const active = selectedRole === roleName;

                  return (
                    <button
                      type="button"
                      key={roleName}
                      onClick={() => {
                        setSelectedRole(roleName);
                        setIsLogin(true);
                        setLoginId("");
                        setPassword("");
                      }}
                      className={`flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-1.5 text-[10px] font-black transition-all duration-300 active:scale-95 sm:text-xs ${
                        active
                          ? "bg-white text-emerald-700 shadow-md ring-1 ring-slate-200/70"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <span>{icon}</span>
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Form */}
              <div className="mt-6 space-y-3">
                {selectedRole === "customer" && !isLogin && (
                  <ModernInput
                    label="Full name"
                    icon="👤"
                    placeholder="Your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                  />
                )}

                {selectedRole === "customer" && !isLogin && (
                  <ModernInput
                    label="Email address"
                    icon="✉️"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
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
                  inputMode={selectedRole === "admin" ? "email" : "tel"}
                  placeholder={
                    selectedRole === "customer"
                      ? isLogin
                        ? "Enter phone or email"
                        : "Enter mobile number"
                      : selectedRole === "admin"
                      ? "Enter admin email"
                      : "Enter delivery username"
                  }
                  value={selectedRole === "customer" && !isLogin ? mobile : loginId}
                  onChange={(e) =>
                    selectedRole === "customer" && !isLogin
                      ? setMobile(e.target.value)
                      : setLoginId(e.target.value)
                  }
                  autoComplete={selectedRole === "admin" ? "username" : "tel"}
                />

                <PasswordInput
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                {selectedRole === "customer" && isLogin && (
                  <div className="flex justify-end px-1">
                    <button
                      type="button"
                      onClick={() => navigate("/forgot-password")}
                      className="min-h-9 px-1 text-[11px] font-black text-emerald-700 transition active:scale-95 hover:text-emerald-900 hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className={`group relative mt-1 min-h-[52px] w-full overflow-hidden rounded-2xl text-sm font-black text-white shadow-lg transition-all duration-300 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-60 ${
                    selectedRole === "customer"
                      ? "bg-gradient-to-r from-emerald-600 to-teal-600 shadow-emerald-200 hover:from-emerald-700 hover:to-teal-700"
                      : selectedRole === "admin"
                      ? "bg-slate-900 shadow-slate-200 hover:bg-slate-800"
                      : "bg-gradient-to-r from-orange-500 to-amber-500 shadow-orange-200 hover:from-orange-600 hover:to-amber-600"
                  }`}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                        Please wait...
                      </>
                    ) : (
                      <>
                        {selectedRole === "customer"
                          ? isLogin
                            ? "Login"
                            : "Create Account"
                          : "Continue"}
                        <span className="text-base">→</span>
                      </>
                    )}
                  </span>

                  <span className="absolute inset-y-0 left-0 w-1/3 -translate-x-[140%] skew-x-[-12deg] bg-white/20 blur-md transition-transform duration-700 group-hover:translate-x-[420%]" />
                </button>

                {selectedRole === "customer" && (
                  <button
                    type="button"
                    onClick={() => setIsLogin(!isLogin)}
                    className="min-h-11 w-full rounded-xl px-2 text-[11px] font-bold text-slate-500 transition active:scale-[.98] hover:bg-emerald-50 hover:text-emerald-700"
                  >
                    {isLogin ? (
                      <>
                        New to Farm Fresh?{" "}
                        <span className="font-black text-emerald-700">Create an account</span>
                      </>
                    ) : (
                      <>
                        Already have an account?{" "}
                        <span className="font-black text-emerald-700">Sign in</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Trust strip */}
              <div className="mt-6 grid grid-cols-3 gap-2 border-t border-slate-100 pt-5">
                {[
                  ["🥛", "Fresh"],
                  ["🚚", "Daily"],
                  ["💚", "Reliable"],
                ].map(([icon, label]) => (
                  <div
                    key={label}
                    className="rounded-2xl bg-slate-50/80 py-2.5 text-center transition hover:bg-emerald-50"
                  >
                    <div className="text-base">{icon}</div>
                    <p className="mt-1 text-[8px] font-black uppercase tracking-[.16em] text-slate-400">
                      {label}
                    </p>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => navigate("/")}
                className="mt-4 min-h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 text-[11px] font-black text-slate-500 transition active:scale-[.98] hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
              >
                ← Back to Farm Fresh Dairy
              </button>
            </div>
          </div>
        </section>

        <p className="mt-4 text-center text-[9px] font-bold text-slate-400">
          Fresh milk • Easy ordering • Doorstep delivery
        </p>
      </main>
    </div>
  );
}

function ModernInput({
  label,
  icon,
  type = "text",
  inputMode,
  placeholder,
  value,
  onChange,
  autoComplete,
}) {
  return (
    <label className="block">
      <span className="mb-1.5 ml-1 block text-[9px] font-black uppercase tracking-[.14em] text-slate-400">
        {label}
      </span>

      <div className="group flex min-h-[52px] items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 transition-all duration-300 focus-within:border-emerald-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-50 focus-within:shadow-sm">
        <span className="shrink-0 text-base opacity-70 transition duration-300 group-focus-within:scale-110 group-focus-within:opacity-100">
          {icon}
        </span>

        <input
          type={type}
          inputMode={inputMode}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          className="min-w-0 flex-1 bg-transparent text-[13px] font-semibold text-slate-800 outline-none placeholder:text-slate-400"
        />
      </div>
    </label>
  );
}

function PasswordInput({ value, onChange }) {
  const [show, setShow] = useState(false);

  return (
    <label className="block">
      <span className="mb-1.5 ml-1 block text-[9px] font-black uppercase tracking-[.14em] text-slate-400">
        Password
      </span>

      <div className="group flex min-h-[52px] items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 transition-all duration-300 focus-within:border-emerald-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-50 focus-within:shadow-sm">
        <span className="shrink-0 text-base opacity-70 transition duration-300 group-focus-within:scale-110 group-focus-within:opacity-100">
          🔒
        </span>

        <input
          type={show ? "text" : "password"}
          placeholder="Enter your password"
          value={value}
          onChange={onChange}
          autoComplete="current-password"
          className="min-w-0 flex-1 bg-transparent text-[13px] font-semibold text-slate-800 outline-none placeholder:text-slate-400"
        />

        <button
          type="button"
          onClick={() => setShow((prev) => !prev)}
          className="shrink-0 rounded-lg px-2 py-1.5 text-[10px] font-black text-slate-400 transition active:scale-95 hover:bg-white hover:text-emerald-700"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? "Hide" : "Show"}
        </button>
      </div>
    </label>
  );
}
