import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border border-green-100">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-green-700">
            Admin Login
          </h1>

          <p className="text-gray-500 mt-2">
            Farm Fresh Dairy Admin Panel
          </p>
        </div>

        <form
          onSubmit={handleAdminLogin}
          className="space-y-5"
        >
          <div>
            <label className="block font-semibold mb-2 text-gray-700">
              Admin Email
            </label>

            <input
              type="email"
              placeholder="Enter admin email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              className="w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block font-semibold mb-2 text-gray-700">
              Password
            </label>

            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              className="w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-2xl font-bold text-lg shadow-lg"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}