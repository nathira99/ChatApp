// src/pages/admin/AdminUsers.jsx
import { useEffect, useState } from "react";
import api from "../../services/api";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    api.get("/admin/users").then(res => setUsers(res.data));
  }, []);

  const handleBlock = async (id, blocked) => {
    const url = `/admin/users/${id}/${blocked ? "unblock" : "block"}`;
    await api.put(url);
    setUsers(prev =>
      prev.map(u => (u._id === id ? { ...u, blocked: !blocked } : u))
    );
  };

  const handleDelete = async id => {
    if (!window.confirm("Delete this user?")) return;
    await api.delete(`/admin/users/${id}`);
    setUsers(prev => prev.filter(u => u._id !== id));
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Manage Users</h1>
      <table className="w-full border">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 text-left">Name</th>
            <th className="p-2">Email</th>
            <th className="p-2">Status</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u._id} className="border-t">
              <td className="p-2"><b>{u.name}</b></td>
              <td className="p-2">{u.email}</td>
              <td className="p-2">{u.blocked ? "Blocked" : "Active"}</td>
              <td className="p-2 space-x-2">
                <button
                  onClick={() => handleBlock(u._id, u.blocked)}
                  className={`px-3 py-1 rounded ${
                    u.blocked
                      ? "bg-green-500 text-white"
                      : "bg-yellow-500 text-white"
                  }`}
                >
                  {u.blocked ? "Unblock" : "Block"}
                </button>
                <button
                  onClick={() => handleDelete(u._id)}
                  className="bg-red-600 text-white px-3 py-1 rounded"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
