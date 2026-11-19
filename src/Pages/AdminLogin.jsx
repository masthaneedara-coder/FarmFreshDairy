
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { setAdminLogin } from "../config/auth";
import { adminLogin } from "../services/adminService";

export default function AdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAdminLogin = async () => {
    if (!email.trim() || !password) {
      alert("Please enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await adminLogin(email.trim(), password);

      if (!response?.admin || !response?.token) {
        throw new Error("Admin login token was not received.");
      }

      setAdminLogin(
        {
          id: response.admin.id,
          full_name: response.admin.full_name,
          name: response.admin.full_name,
          email: response.admin.email,
          phone: response.admin.phone,
          role: response.admin.role,
        },
        response.token
      );

      navigate("/admin");
    } catch (error) {
      console.error("Admin login error:", error);
      alert(error.message || "Invalid admin credentials.");
    } finally {
      setLoading(false);
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
              Admin Email
            </label>

            <input
              type="email"
              placeholder="Enter admin email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
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
              autoComplete="current-password"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdminLogin();
              }}
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
