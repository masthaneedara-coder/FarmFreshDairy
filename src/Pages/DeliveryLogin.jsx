import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { deliveryLogin } from "../config/api";

export default function DeliveryLogin() {
  const navigate = useNavigate();

  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDeliveryLogin = async () => {
    if (!mobile || !password) {
      alert("Please enter mobile number and password");
      return;
    }

    try {
      setLoading(true);
     const res = await deliveryLogin(mobile, password);

        if (res.success) {

            localStorage.setItem("deliveryLogin", "true");
            localStorage.setItem("userRole", "delivery");

            localStorage.setItem(
                "deliveryBoy",
                JSON.stringify(res.deliveryBoy)
            );

            navigate("/delivery");

        } else {

            alert(res.message);

        }

      
    } catch (error) {
      console.error(error);
      alert("Delivery login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 px-3 sm:px-4 md:px-6 py-6 flex items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-5 sm:p-6 md:p-8 border border-orange-100">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-white flex items-center justify-center text-4xl shadow-xl">
            🚚
          </div>

          <h1 className="mt-4 text-3xl sm:text-4xl font-black text-orange-700">
            Delivery Login
          </h1>

          <p className="text-gray-500 mt-2 text-sm sm:text-base">
            Sign in to view assigned orders and update delivery status
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-left text-sm font-semibold text-gray-700 mb-2">
              Mobile Number
            </label>
            <input
              type="text"
              placeholder="Enter delivery mobile"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-left text-sm font-semibold text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              placeholder="Enter delivery password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 outline-none focus:border-orange-500"
            />
          </div>

          <button
            onClick={handleDeliveryLogin}
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3.5 rounded-2xl font-bold shadow-lg disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login as Delivery"}
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