import { useState,useEffect } from "react";
import { useSearchParams,useNavigate } from "react-router-dom";
import { resetPassword } from "../config/api";
import { supabase } from "../config/supabase";

export default function ResetPassword(){
    useEffect(() => {

  async function init() {

    const {
      data,
    } = await supabase.auth.getSession();

    console.log(data.session);

  }

  init();

}, []);

  const navigate=useNavigate();

  const [searchParams]=useSearchParams();

  const access_token=
    searchParams.get("access_token");

  const refresh_token=
    searchParams.get("refresh_token");

  const [password,setPassword]=useState("");

  const [confirmPassword,setConfirmPassword]=useState("");

  const [loading,setLoading]=useState(false);

 async function handleSubmit(e) {

  e.preventDefault();

  if (password !== confirmPassword) {

    alert("Passwords do not match");

    return;

  }

  try {

    setLoading(true);

    const { error } =
      await supabase.auth.updateUser({

        password,

      });

    if (error) {

      throw error;

    }

    alert("Password updated successfully.");

    navigate("/auth");

  } catch (err) {

    alert(err.message);

  } finally {

    setLoading(false);

  }

}

return (
  <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-emerald-50 flex items-center justify-center px-4 py-6">

    <div className="w-full max-w-md bg-white rounded-[30px] shadow-2xl border border-green-100 p-6 sm:p-8">

      {/* Logo */}
      <div className="flex justify-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center text-4xl">
          🔒
        </div>
      </div>

      {/* Heading */}
      <div className="text-center mt-5">
        <h1 className="text-3xl sm:text-4xl font-black text-green-700">
          Reset Password
        </h1>

        <p className="text-gray-500 mt-2 text-sm sm:text-base">
          Create a new password for your account.
        </p>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="mt-8 space-y-5"
      >

        <div>
          <label className="block mb-2 font-semibold text-gray-700">
            New Password
          </label>

          <input
            type="password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            placeholder="Enter new password"
            className="w-full rounded-2xl border border-green-200 px-5 py-4 focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
        </div>

        <div>
          <label className="block mb-2 font-semibold text-gray-700">
            Confirm Password
          </label>

          <input
            type="password"
            value={confirmPassword}
            onChange={(e) =>
              setConfirmPassword(e.target.value)
            }
            placeholder="Confirm password"
            className="w-full rounded-2xl border border-green-200 px-5 py-4 focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-bold py-4 transition-all"
        >
          {loading
            ? "Updating Password..."
            : "Update Password"}
        </button>

      </form>

      {/* Back Button */}
      <button
        onClick={() => navigate("/auth")}
        className="w-full mt-4 rounded-2xl bg-gray-100 hover:bg-gray-200 py-3 font-bold text-gray-700 transition"
      >
        ← Back to Login
      </button>

    </div>

  </div>
);

}