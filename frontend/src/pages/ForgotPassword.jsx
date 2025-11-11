import React, { useState } from "react";
import api from "../services/api"; // or "../../services/api" if it's in components/

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const res = await api.post("/auth/forgot-password", { email });
      setMessage(res.data.message || "Reset link sent to your email.");
    } catch (err) {
      setError(
        err.response?.data?.message || "Error sending reset link. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="bg-white p-6 rounded-xl shadow-md max-w-sm w-full">
        <h2 className="text-2xl font-bold text-blue-600 text-center mb-4">
          Forgot Password
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            name="email"
            autoComplete="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        {message && (
          <p className="text-sm text-center text-green-600 mt-3">{message}</p>
        )}
        {error && (
          <p className="text-sm text-center text-red-500 mt-3">{error}</p>
        )}
      </div>
    </div>
  );
}
// i catch one error, now i delete all users, then newly register i got verify email but without verify email i got entered in homepage, but then i try to login it wont allow me to enter into homepage