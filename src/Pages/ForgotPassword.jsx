import { useState } from "react";
import { forgotPassword } from "../config/api";
import { useNavigate } from "react-router-dom";

export default function ForgotPassword() {

  const navigate = useNavigate();

  const [email, setEmail] = useState("");

  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {

    e.preventDefault();

    try {

      setLoading(true);

      const res =
        await forgotPassword(email);

      alert(res.message);

      navigate("/auth");

    } catch (err) {

      alert(err.message);

    } finally {

      setLoading(false);

    }

  }

  return (

    <div className="min-h-screen flex justify-center items-center bg-gray-100">

      <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md">

        <h1 className="text-3xl font-bold mb-6">
          Forgot Password
        </h1>

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >

          <input
            type="email"
            placeholder="Registered Email"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            className="w-full border rounded-lg p-3"
            required
          />

          <button
            className="w-full bg-blue-600 text-white rounded-lg p-3"
            disabled={loading}
          >
            {loading
              ? "Sending..."
              : "Send Reset Link"}
          </button>

        </form>

      </div>

    </div>

  );

}