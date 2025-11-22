import React, { useEffect, useState } from "react";
import { adminService } from "../../services/adminService";
import { Trash2, Users, Shield } from "lucide-react";

export default function AdminGroups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const data = await adminService.getGroups();
      console.log("✅ Admin groups fetched:", data); // add this
      setGroups(data);
    } catch (err) {
      console.error("Error loading groups:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this group?")) return;
    try {
      await adminService.deleteGroup(id);
      setGroups(groups.filter((g) => g._id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-full text-gray-500">
        Loading groups...
      </div>
    );

  if (!groups.length)
    return <div className="text-center text-gray-400 mt-10">No groups found.</div>;

  return (
    <div className="p-6 mb-10">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">
        Group Management
      </h1>

      <div className="grid gap-4">
        {groups.map((g) => (
          <div
            key={g._id}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm"
          >
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-blue-600">
                  {g.name}
                </h2>
                <p className="text-sm text-gray-500">{g.description || "No description"}</p>
                <p className="text-xs mt-1 text-gray-400">
                  Created by: <span className="text-gray-300">{g.creator?.name || "Unknown"}</span>
                </p>
              </div>

              <button
                onClick={() => handleDelete(g._id)}
                className="text-red-600 hover:text-red-800 transition"
              >
                <Trash2 size={18} />
              </button>
            </div>

            <div className="flex flex-wrap gap-3 mt-3 text-sm">
              <span className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                <Users size={14} /> {g.members?.length || 0} members
              </span>
              <span className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                <Shield size={14} /> {g.admins?.length || 0} admins
              </span>
            </div>

            <div className="mt-3 border-t border-gray-200 dark:border-gray-700 pt-2 text-xs text-gray-500">
              Members: {g.members?.map((m) => m.name).join(", ") || "None"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
