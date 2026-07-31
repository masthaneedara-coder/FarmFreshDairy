import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { setAdminLogin } from "../config/auth";

export default function AdminLogin() {
  const navigate = useNavigate();

  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-fuchsia-50 px-3 sm:px-4 md:px-6 py-6 flex items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-5 sm:p-6 md:p-8 border border-purple-100">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-purple-600 to-fuchsia-500 text-white flex items-center justify-center text-4xl shadow-xl">
            👨‍💼
          </div>

          <h1 className="mt-4 text-3xl sm:text-4xl font-black text-purple-700">
            Admin Login
          </h1>

          <p className="text-gray-500 mt-2 text-sm sm:text-base">
            Sign in to manage products, orders and billing
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-left text-sm font-semibold text-gray-700 mb-2">
              Mobile Number
            </label>
            <input
              type="text"
              placeholder="Enter admin mobile"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-left text-sm font-semibold text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 outline-none focus:border-purple-500"
            />
          </div>

          <button
            onClick={handleAdminLogin}
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3.5 rounded-2xl font-bold shadow-lg disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login as Admin"}
          </button>

          <Link
            to="/"
            className="block w-full text-center bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-2xl font-semibold"
          >
            ← Back to Home
          </Link>
        </div>

       
      </div>
    </div>
  );
}