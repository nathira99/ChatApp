// src/pages/admin/AdminReports.jsx
import React, { useEffect, useState } from "react";
import api from "../../services/api";

export default function AdminReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const res = await api.get("/reports"); // adjust path if different
      setReports(res.data || []);
    } catch (err) {
      console.error("Error loading reports:", err);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await api.put(`/reports/${id}, { status }`);
      await loadReports();
    } catch (err) {
      console.error("Error updating report:", err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this report?")) return;
    try {
      await api.delete(`/reports/${id}`);
      setReports((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      console.error("Error deleting report:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full text-gray-500">
        Loading reports...
      </div>
    );
  }

  if (!reports.length) {
    return <div className="text-center text-gray-400 mt-10">No reports found.</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">
        Reports Management
      </h1>

      {reports.map((r) => {
  const reporterName = r.reporter?.name || "Unknown reporter";
  const targetLabel =
    r.targetUser && r.targetUser.name
      ? `User: ${r.targetUser.name}`
      : r.targetGroup && r.targetGroup.name
      ? `Group: ${r.targetGroup.name}`
      : "Target deleted or unavailable";

  return (
    <div
      key={r._id}
      className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex justify-between items-center"
    >
      <div>
        <p className="text-sm text-gray-700 dark:text-gray-100">
          <span className="font-semibold">{reporterName}</span> reported{" "}
          <span className="font-medium">{targetLabel}</span>
        </p>
        <p className="text-xs text-gray-500 mt-1 whitespace-pre-wrap">{r.reason}</p>
        <p className="text-xs text-gray-400 mt-1">
          Submitted: {new Date(r.createdAt).toLocaleString()}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <select
          value={r.status || "pending"}
          onChange={(e) => handleStatusChange(r._id, e.target.value)}
          className="text-sm border rounded-lg px-2 py-1"
        >
          <option value="pending">Pending</option>
          <option value="reviewed">Reviewed</option>
          <option value="resolved">Resolved</option>
        </select>

        <button
          onClick={() => handleDelete(r._id)}
          className="text-red-600 hover:text-red-800 text-sm font-medium"
        >
          Delete
        </button>
      </div>
    </div>
  );
})}
    </div>
  );
}