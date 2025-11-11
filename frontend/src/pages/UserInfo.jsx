import React, { useEffect, useState } from "react";
import { ArrowLeft, ShieldAlert, Ban } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";

export default function UserInfo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, [id]);

  const loadUser = async () => {
    try {
      const res = await api.get(`/users/${id}`);
      setUser(res.data);
    } catch (err) {
      console.error("Error loading user info:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleBlock = async () => {
    if (window.confirm(`Block ${user.name}?`)) {
      try {
        await api.put(`/users/${user._id}/block`);
        alert("User blocked successfully.");
      } catch (err) {
        console.error("Block failed:", err);
      }
    }
  };

  const handleReport = async () => {
    const reason = prompt("Enter report reason:");
    if (!reason) return;
    try {
      await api.post(`/reports`, { targetUser: user._id, reason });
      alert("User reported.");
    } catch (err) {
      console.error("Report failed:", err);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-full text-gray-500">
        Loading user info...
      </div>
    );

  if (!user) return <div className="p-6 text-center text-gray-400">User not found.</div>;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      {/* Header */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-4 left-4 text-gray-600 dark:text-gray-300 hover:text-gray-900"
      >
        <ArrowLeft size={24} />
      </button>

      {/* Profile Picture */}
      <div className="w-28 h-28 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white flex items-center justify-center text-4xl font-bold mb-4">
        {user.name.charAt(0).toUpperCase()}
      </div>

      {/* Name & Email */}
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
        {user.name}
      </h2>
      <p className="text-sm text-gray-500 mb-6">{user.email}</p>

      {/* Actions */}
      <div className="space-y-3 w-full max-w-xs">
        <button
          onClick={handleReport}
          className="w-full flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white py-2 rounded-lg font-medium transition"
        >
          <ShieldAlert size={16} /> Report User
        </button>

        <button
          onClick={handleBlock}
          className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-medium transition"
        >
          <Ban size={16} /> Block User
        </button>
      </div>
    </div>
  );
}
