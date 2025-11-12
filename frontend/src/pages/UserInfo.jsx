import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";

export default function UserInfo() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // report state
  const [reason, setReason] = useState("");
  const [reporting, setReporting] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/users/${id}`);
        setUser(res.data);
      } catch (err) {
        console.error("Error loading user:", err);
        setMsg({ type: "error", text: "User not found or server error." });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleReport = async () => {
    if (!reason.trim()) {
      setMsg({ type: "error", text: "Please add a reason." });
      return;
    }

    setReporting(true);
    setMsg(null);

    try {
      // IMPORTANT: send userId as target
      await api.post("/reports", { userId: user._id, reason });
      setReason("");
      setMsg({ type: "success", text: "Report submitted. Admin will review." });
    } catch (err) {
      console.error("Error submitting report:", err);
      const text =
        err.response?.data?.message || "Failed to submit report. Try again.";
      setMsg({ type: "error", text });
    } finally {
      setReporting(false);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Loading user...</p>
      </div>
    );

  if (!user)
    return (
      <div className="p-6">
        <p className="text-red-500">User not found.</p>
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto p-6">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 text-sm text-blue-600 hover:underline"
      >
        ← Back
      </button>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white flex items-center justify-center text-2xl font-semibold">
            {user.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
              {user.name}
            </h2>
            <p className="text-sm text-gray-500">{user.email}</p>
            {user.isAdmin && (
              <span className="inline-block mt-1 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                Admin
              </span>
            )}
          </div>
        </div>

        <div className="mt-6">
          <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
            Report this user
          </h3>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Give a short reason (harassment, spam, other...)"
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:text-gray-200"
            rows={1}
          />
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={handleReport}
              disabled={reporting}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60"
            >
              {reporting ? "Reporting..." : "Report User"}
            </button>
            <button
              onClick={() => {
                setReason("");
                setMsg(null);
              }}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              Cancel
            </button>
          </div>

          {msg && (
            <div
              className={`mt-3 p-3 rounded ${
                msg.type === "error" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
              }`}
            >
              {msg.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}