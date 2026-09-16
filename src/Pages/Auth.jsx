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
    <div className="relative min-h-screen overflow-hidden bg-[#f6fbf8] px-3 pb-10 pt-28 sm:px-5 sm:pt-32">
      <style>{`
        @keyframes authFadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes authFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(2deg); }
        }
        @keyframes authGlow {
          0%, 100% { opacity: .45; transform: scale(1); }
          50% { opacity: .8; transform: scale(1.08); }
        }
        @keyframes authShine {
          0% { transform: translateX(-130%) rotate(12deg); }
          100% { transform: translateX(230%) rotate(12deg); }
        }
        .auth-fade-up { animation: authFadeUp .65s cubic-bezier(.22,1,.36,1) both; }
        .auth-float { animation: authFloat 4.5s ease-in-out infinite; }
        .auth-glow { animation: authGlow 4s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .auth-fade-up, .auth-float, .auth-glow { animation: none !important; }
        }
      `}</style>

      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="auth-glow absolute -left-28 top-20 h-72 w-72 rounded-full bg-emerald-200/45 blur-3xl" />
        <div className="auth-glow absolute -right-28 bottom-10 h-80 w-80 rounded-full bg-teal-200/35 blur-3xl" />
        <div className="absolute left-[18%] top-36 text-3xl opacity-20 auth-float">🥛</div>
        <div className="absolute right-[15%] top-44 text-2xl opacity-15 auth-float" style={{ animationDelay: "1s" }}>🌿</div>
        <div className="absolute bottom-24 left-[10%] text-2xl opacity-15 auth-float" style={{ animationDelay: "2s" }}>🥛</div>
      </div>

      <main className="relative mx-auto w-full max-w-6xl">
        <div className="mb-5 flex items-center justify-between sm:mb-7">
          <button
            onClick={() => navigate("/")}
            className="group inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3.5 py-2 text-xs font-black text-slate-600 shadow-sm backdrop-blur transition hover:-translate-x-0.5 hover:border-emerald-200 hover:text-emerald-700"
          >
            <span className="transition-transform group-hover:-translate-x-1">←</span>
            Back to home
          </button>

          <div className="hidden items-center gap-2 rounded-full border border-emerald-100 bg-white/70 px-3 py-2 text-[10px] font-black text-emerald-700 shadow-sm backdrop-blur sm:flex">
            <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,.7)]" />
            Farm Fresh Dairy
          </div>
        </div>

        <section className="grid overflow-hidden rounded-[32px] border border-white bg-white/75 shadow-[0_30px_90px_rgba(15,23,42,.12)] backdrop-blur-xl lg:grid-cols-[.9fr_1.1fr]">

          {/* Brand panel */}
          <div className="relative hidden overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-800 to-teal-700 p-8 text-white lg:flex lg:min-h-[690px] lg:flex-col lg:justify-between lg:p-10">
            <div className="absolute -right-28 -top-28 h-80 w-80 rounded-full bg-emerald-300/15 blur-3xl" />
            <div className="absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-teal-300/10 blur-3xl" />

            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3.5 py-2 text-xs font-black backdrop-blur">
                🌿 Farm Fresh Dairy
              </div>

              <div className="mt-10 flex h-16 w-16 items-center justify-center rounded-3xl bg-white/10 text-4xl shadow-xl backdrop-blur">
                🥛
              </div>

              <h1 className="mt-6 max-w-lg text-5xl font-black leading-[1.02] tracking-tight">
                Freshness
                <span className="block text-emerald-200">delivered daily.</span>
              </h1>

              <p className="mt-5 max-w-md text-sm leading-6 text-white/65">
                Fresh milk, groceries and subscriptions delivered to your doorstep with a simple, reliable experience.
              </p>
            </div>

            <div className="relative mt-10 space-y-3">
              {[
                ["🥛", "Fresh dairy", "Milk, curd, ghee & paneer"],
                ["🚚", "Daily delivery", "Freshness at your doorstep"],
                ["🔄", "Easy subscription", "Manage your daily routine"],
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
          </div>

          {/* Form panel */}
          <div className="relative bg-white p-5 sm:p-8 lg:p-10">
            <div className="mx-auto max-w-xl">
              {/* Mobile brand */}
              <div className="mb-6 flex items-center gap-3 lg:hidden">
                <div className="auth-float flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-2xl shadow-sm">
                  🥛
                </div>
                <div>
                  <p className="text-base font-black text-slate-900">
                    FarmFresh<span className="text-emerald-600">Dairy</span>
                  </p>
                  <p className="text-[10px] font-semibold text-slate-400">Freshness delivered daily</p>
                </div>
              </div>

              <div className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[20px] bg-emerald-50 text-2xl shadow-sm ring-8 ring-emerald-50/50">
                  {selectedRole === "customer" ? "🥛" : selectedRole === "admin" ? "🛡️" : "🚚"}
                </div>

                <p className="mt-5 text-[10px] font-black uppercase tracking-[.22em] text-emerald-600">
                  {selectedRole === "customer"
                    ? isLogin
                      ? "Welcome back"
                      : "Join Farm Fresh"
                    : selectedRole === "admin"
                    ? "Admin portal"
                    : "Delivery portal"}
                </p>

                <h2 className="mt-1 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                  {selectedRole === "customer"
                    ? isLogin
                      ? "Welcome back 👋"
                      : "Create your account"
                    : selectedRole === "admin"
                    ? "Admin Login"
                    : "Delivery Login"}
                </h2>

                <p className="mt-2 text-xs font-medium text-slate-400 sm:text-sm">
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
              <div className="mt-7 grid grid-cols-3 gap-1 rounded-2xl bg-slate-100 p-1.5">
                {[
                  ["customer", "🥛", "Customer"],
                  ["admin", "🛡️", "Admin"],
                  ["delivery", "🚚", "Delivery"],
                ].map(([roleName, icon, label]) => {
                  const active = selectedRole === roleName;

                  return (
                    <button
                      key={roleName}
                      onClick={() => {
                        setSelectedRole(roleName);
                        setIsLogin(true);
                        setLoginId("");
                        setPassword("");
                      }}
                      className={`relative flex items-center justify-center gap-1.5 rounded-xl px-2 py-3 text-[10px] font-black transition-all duration-300 sm:text-xs ${
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
              <div className="mt-7 space-y-3.5">

                {selectedRole === "customer" && !isLogin && (
                  <ModernInput
                    label="Full name"
                    icon="👤"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                )}

                {selectedRole === "customer" && !isLogin && (
                  <ModernInput
                    label="Email address"
                    icon="✉️"
                    type="email"
                    placeholder="Enter your email address"
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
                  value={selectedRole === "customer" && !isLogin ? mobile : loginId}
                  onChange={(e) =>
                    selectedRole === "customer" && !isLogin
                      ? setMobile(e.target.value)
                      : setLoginId(e.target.value)
                  }
                />

                <ModernInput
                  label="Password"
                  icon="🔒"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                {selectedRole === "customer" && isLogin && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => navigate("/forgot-password")}
                      className="text-xs font-black text-emerald-700 transition hover:text-emerald-900 hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className={`group relative mt-1 w-full overflow-hidden rounded-2xl py-3.5 text-sm font-black text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 ${
                    selectedRole === "customer"
                      ? "bg-emerald-600 shadow-emerald-200 hover:bg-emerald-700"
                      : selectedRole === "admin"
                      ? "bg-slate-900 shadow-slate-200 hover:bg-slate-800"
                      : "bg-orange-500 shadow-orange-200 hover:bg-orange-600"
                  }`}
                >
                  <span className="relative z-10">
                    {loading
                      ? "Please wait..."
                      : selectedRole === "customer"
                      ? isLogin
                        ? "Login →"
                        : "Create Account →"
                      : "Continue →"}
                  </span>
                  <span className="absolute inset-y-0 left-0 w-1/3 -translate-x-[130%] bg-white/20 blur-md transition-transform duration-700 group-hover:translate-x-[330%]" />
                </button>

                {selectedRole === "customer" && (
                  <button
                    onClick={() => setIsLogin(!isLogin)}
                    className="w-full py-2 text-xs font-black text-slate-500 transition hover:text-emerald-700"
                  >
                    {isLogin ? (
                      <>
                        New to Farm Fresh?{" "}
                        <span className="text-emerald-700">Create an account</span>
                      </>
                    ) : (
                      <>
                        Already have an account?{" "}
                        <span className="text-emerald-700">Sign in</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Trust footer */}
              <div className="mt-7 grid grid-cols-3 gap-2 border-t border-slate-100 pt-5">
                {[
                  ["🥛", "Fresh"],
                  ["🚚", "Daily"],
                  ["💚", "Reliable"],
                ].map(([icon, label]) => (
                  <div key={label} className="text-center">
                    <div className="text-lg">{icon}</div>
                    <p className="mt-1 text-[9px] font-black uppercase tracking-wider text-slate-400">
                      {label}
                    </p>
                  </div>
                ))}
              </div>

              <button
                onClick={() => navigate("/")}
                className="mt-5 w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 text-xs font-black text-slate-500 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
              >
                ← Back to Farm Fresh Dairy
              </button>
            </div>
          </div>
        </section>
      </main>
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
}) {
  return (
    <label className="block">
      <span className="mb-1.5 ml-1 block text-[10px] font-black uppercase tracking-[.12em] text-slate-400">
        {label}
      </span>
      <div className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 transition-all duration-300 focus-within:border-emerald-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-50">
        <span className="text-base opacity-70 transition group-focus-within:scale-110 group-focus-within:opacity-100">
          {icon}
        </span>
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400"
        />
      </div>
    </label>
  );
}
