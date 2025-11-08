import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { User, Settings } from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../hooks/useAuth";

export default function Sidebar({ onSelectChat }) {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const { user } = useAuth(); // ✅ Get logged-in user

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get("/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  // ✅ Filter: hide your own username and apply search filter
  const filtered = users.filter(
    (u) =>
      u._id !== user?._id && // hide current user
      u.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full">
      {/* 🔍 Search */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <input
          type="text"
          placeholder="Search users..."
          className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* 👥 User list */}
      <div className="flex-1 overflow-y-auto px-2 py-3">
        {filtered.length ? (
          filtered.map((user) => (
            <div
              key={user._id}
              className="flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition"
              onClick={() =>
                onSelectChat({
                  _id: user._id,
                  name: user.name,
                  email: user.email,
                  isGroup: false,
                })
              }
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white flex items-center justify-center font-semibold">
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-gray-800 dark:text-gray-200 font-medium">
                  {user.name}
                </p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 mt-4">No users found</p>
        )}
      </div>

      {/* ⚙️ Footer Navigation */}
      <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-3 flex justify-between">
        <Link
          to="/profile"
          className="flex bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-2 rounded-lg items-center gap-2 hover:opacity-90 transition"
        >
          <User size={18} /> Profile
        </Link>
        <Link
          to="/settings"
          className="flex bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-2 rounded-lg items-center gap-2 hover:opacity-90 transition"
        >
          <Settings size={18} /> Settings
        </Link>
      </div>
    </div>
  );
}
