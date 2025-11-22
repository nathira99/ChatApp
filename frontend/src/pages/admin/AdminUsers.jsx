// src/pages/admin/AdminUsers.jsx
import { useEffect, useState } from "react";
import api from "../../services/api";
import { Loader2 } from "lucide-react";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // ------------------ LOAD USERS ------------------
  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/users");
      setUsers(res.data || []);
    } catch (err) {
      console.error("Error loading users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // ------------------ ACTIVATE / DEACTIVATE ------------------
  const toggleActive = async (id, isDeactivated) => {
    if (!window.confirm("Are you sure you want to deactivate this user?")) return;

    try {
      const action = isDeactivated ? "reactivate" : "deactivate";
      await api.put(`/admin/users/${id}/${action}`);

      setUsers((prev) =>
        prev.map((u) =>
          u._id === id ? { ...u, isDeactivated: !isDeactivated } : u
        )
      );
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  // ------------------ DELETE USER ------------------
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      await api.delete(`/admin/users/${id}`);
      setUsers((prev) => prev.filter((u) => u._id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  // ------------------ UI ------------------

  if (loading)
    return (
      <div className="flex justify-center items-center h-full text-gray-500">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );

  return (
    <div className="p-2 mb-10 ">
      <h1 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">
        User Management
      </h1>

      <div className="max-w-[90vw] overflow-auto bg-white dark:bg-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl">
  <table className="min-w-[600px] text-sm ">
    <thead className="bg-gray-100 dark:bg-gray-700">
      <tr>
        <th className="p-3 text-left">Name</th>
        <th className="p-3 text-left">Email</th>
        <th className="p-3 text-center">Joined At</th>
        <th className="p-3 text-center">Status</th>
        <th className="p-3 text-center">Actions</th>
      </tr>
    </thead>

    <tbody>
      {users.map((u) => (
        <tr
          key={u._id}
          className="border-t border-gray-200 dark:border-gray-700"
        >
          <td className="p-3 font-medium whitespace-nowrap">{u.name}</td>

          <td className="p-3 whitespace-nowrap">{u.email}</td>

          <td className="p-3 text-center whitespace-nowrap">
            {new Date(u.createdAt).toLocaleString()}
          </td>

          <td className="p-3 text-center whitespace-nowrap">
            <span
              className={`px-3 py-1 rounded-full text-xs ${
                u.isDeactivated
                  ? "bg-red-200 text-red-800"
                  : "bg-green-200 text-green-800"
              }`}
            >
              {u.isDeactivated ? "Deactivated" : "Active"}
            </span>
          </td>

          <td className="p-3 text-center whitespace-nowrap space-x-2">
            <button
              onClick={() => toggleActive(u._id, u.isDeactivated)}
              className={`px-3 py-1 rounded text-white ${
                u.isDeactivated ?  "bg-green-600" : "bg-yellow-600"
              }`}
            >
              {u.isDeactivated ? "Activate" : "Deactivate"}
            </button>

            <button
              onClick={() => handleDelete(u._id)}
              className="px-3 py-1 rounded bg-red-600 text-white"
            >
              Delete
            </button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
    </div>
  );
}