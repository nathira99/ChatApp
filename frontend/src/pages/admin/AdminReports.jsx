import React, { useEffect, useState } from "react";
import api from "../../services/api";
import { Trash2, UserX, UserCheck } from "lucide-react";

export default function AdminReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const res = await api.get("/reports");
      setReports(res.data || []);
    } catch (err) {
      console.error("Error loading reports:", err);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  // ------------------ UPDATE REPORT STATUS ------------------
  const handleStatusChange = async (id, status) => {
    try {
      await api.put(`/reports/${id}/status`, { status });
      await loadReports();
    } catch (err) {
      console.error("Error updating report:", err);
    }
  };

  // ------------------ DELETE REPORT ------------------
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this report?")) return;
    try {
      await api.delete(`/reports/${id}`);
      setReports((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      console.error("Error deleting report:", err);
    }
  };

  // ------------------ USER ACTIONS ------------------
  const deactivateUser = async (userId) => {
    if (!window.confirm("Deactivate this user account?")) return;
    try {
      await api.put(`/admin/users/${userId}/deactivate`);
      alert("User deactivated");
    } catch (err) {
      console.error(err);
      alert("Failed to deactivate user");
    }
  };

  const activateUser = async (userId) => {
    if (!window.confirm("Reactivate this user?")) return;
    try {
      await api.put(`/admin/users/${userId}/reactivate`);
      alert("User activated");
    } catch (err) {
      console.error(err);
      alert("Failed to activate user");
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm("Permanently delete this user?")) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      alert("User deleted");
    } catch (err) {
      console.error(err);
      alert("Failed to delete user");
    }
  };

  // ------------------ GROUP ACTION ------------------
  const deleteGroup = async (groupId) => {
    if (!window.confirm("Delete this group?")) return;
    try {
      await api.delete(`/groups/${groupId}`);
      alert("Group deleted");
    } catch (err) {
      console.error(err);
      alert("Failed to delete group");
    }
  };

  // ------------------ UI ------------------

  if (loading)
    return (
      <div className="flex justify-center items-center h-full text-gray-500">
        Loading reports...
      </div>
    );

  if (!reports.length)
    return <div className="text-center text-gray-400 mt-10">No reports found.</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">
        Reports Management
      </h1>

      <div className="space-y-4">
        {reports.map((r) => {
          const reporter = r.reporter?.name || "Unknown";

          let targetType = "";
          let targetName = "";
          let targetId = null;
          let isUserDeactivated = false;

          if (r.targetUser) {
            targetType = "user";
            targetName = r.targetUser.name;
            targetId = r.targetUser._id;
            isUserDeactivated = r.targetUser.isDeactivated;
          } else if (r.targetGroup) {
            targetType = "group";
            targetName = r.targetGroup.name;
            targetId = r.targetGroup._id;
          } else {
            targetType = "unknown";
            targetName = "Deleted entity";
          }

          return (
            <div
              key={r._id}
              className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl p-4 shadow-sm"
            >
              {/* Report details */}
              <p className="text-sm text-gray-700 dark:text-gray-200">
                <b>{reporter}</b> reported{" "}
                <b>{targetType === "user" ? "User" : "Group"}:</b>{" "}
                {targetName}
              </p>

              <p className="text-xs text-gray-500 mt-1">{r.reason}</p>

              <p className="text-xs text-gray-400 mt-1">
                {new Date(r.createdAt).toLocaleString()}
              </p>

              {/* Actions */}
              <div className="flex flex-wrap gap-6 mt-4 justify-end items-center max-sm:flex-col">

                {/* Change report status */}
                <select
                  value={r.status}
                  onChange={(e) => handleStatusChange(r._id, e.target.value)}
                  className="border px-3 py-1 rounded-lg text-sm "
                >
                  <option value="pending">Pending</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="resolved">Resolved</option>
                </select>

                {/* USER ACTIONS */}
                {targetType === "user" && (
                  <>
                    {isUserDeactivated ? (
                      <button
                        onClick={() => activateUser(targetId)}
                        className="flex items-center gap-1 bg-green-600 text-white px-3 py-1 rounded-lg"
                      >
                        <UserCheck size={14} /> Activate
                      </button>
                    ) : (
                      <button
                        onClick={() => deactivateUser(targetId)}
                        className="flex items-center gap-1 bg-yellow-600 text-white px-3 py-1 rounded-lg"
                      >
                        <UserX size={14} /> Deactivate
                      </button>
                    )}

                    <button
                      onClick={() => deleteUser(targetId)}
                      className="flex items-center gap-1 bg-red-600 text-white px-3 py-1 rounded-lg"
                    >
                      <Trash2 size={14} /> Delete User
                    </button>
                  </>
                )}

                {/* GROUP ACTION */}
                {targetType === "group" && (
                  <button
                    onClick={() => deleteGroup(targetId)}
                    className="flex items-center gap-1 bg-red-600 text-white px-3 py-1 rounded-lg"
                  >
                    <Trash2 size={14} /> Delete Group
                  </button>
                )}

                {/* Delete Report */}
                <button
                  onClick={() => handleDelete(r._id)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Remove Report
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}