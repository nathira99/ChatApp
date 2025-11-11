// src/pages/admin/AdminReports.jsx
import { useEffect, useState } from "react";
import api from "../../services/api";

export default function AdminReports() {
  const [reports, setReports] = useState([]);

  useEffect(() => {
    api.get("/api/reports").then(res => setReports(res.data));
  }, []);

  const handleResolve = async id => {
    await api.delete(`/api/reports/${id}`);
    setReports(prev => prev.filter(r => r._id !== id));
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">User Reports</h1>
      {reports.length === 0 ? (
        <p className="text-gray-500">No active reports</p>
      ) : (
        reports.map(r => (
          <div
            key={r._id}
            className="border p-3 rounded mb-2 flex justify-between items-center"
          >
            <div>
              <p className="font-medium">
                Reporter: {r.reporter?.name} → Target: {r.targetUser?.name}
              </p>
              <p className="text-sm text-gray-500">{r.reason}</p>
            </div>
            <button
              onClick={() => handleResolve(r._id)}
              className="bg-green-600 text-white px-3 py-1 rounded"
            >
              Resolve
            </button>
          </div>
        ))
      )}
    </div>
  );
}
