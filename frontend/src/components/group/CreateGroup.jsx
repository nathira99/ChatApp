import React, { useState, useEffect } from "react";
import { X, Plus } from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import { Socket } from "socket.io-client";
import { useSocket } from "../../context/SocketContext";
import { triggerRefresh } from "../../utils/triggerRefresh";

export default function CreateGroup({ onClose, onGroupCreated }) {
  const { user } = useAuth(); // logged-in user
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);
  const { socket } = useSocket();

  useEffect(() => {
    fetchUsers();
  }, []);

  // ----------------------------------------------------
  // FETCH ALL USERS (EXCEPT MYSELF)
  // ----------------------------------------------------
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get("/users", {
        headers: { Authorization: `Bearer ${token}` },
      });

      // filter out myself
      const cleaned = (res.data || []).filter(
        (u) => String(u._id) !== String(user._id)
      );

      setUsers(cleaned);
    } catch (err) {
      console.error("❌ Error fetching users:", err);
    }
  };

  // ----------------------------------------------------
  // SELECT / UNSELECT USERS
  // ----------------------------------------------------
  const toggleUser = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  // ----------------------------------------------------
  // CREATE GROUP
  // ----------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) return alert("Please enter group name");
    if (selectedUsers.length < 1)
      return alert("Select at least 2 members");

    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      // Backend expects:
      // name, description, members, isPrivate
      const res = await api.post(
        "/groups",
        {
          name: groupName,
          description,
          members: selectedUsers,
          isPrivate,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      onGroupCreated && onGroupCreated(res.data);
      onClose();
      triggerRefresh(socket);
    } catch (err) {
      console.error("❌ Error creating group:", err);
      alert("Failed to create group");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl shadow-lg p-6">

        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Create New Group</h2>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-red-500"
          >
            <X size={22} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Group Name */}
          <input
            type="text"
            placeholder="Group Name"
            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-gray-200"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            required
          />

          {/* Description */}
          <textarea
            placeholder="Description (optional)"
            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-gray-200"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          {/* Privacy */}
          <div>
            <label className="text-sm font-medium">Privacy:</label>
            <select
              value={isPrivate ? "private" : "public"}
              onChange={(e) => setIsPrivate(e.target.value === "private")}
              className="ml-2 px-2 py-1 border rounded bg-white dark:bg-gray-700 dark:text-gray-200"
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>

          {/* Users */}
          <div className="max-h-48 overflow-y-auto space-y-2 mt-2">
            {users.map((u) => (
              <div
                key={u._id}
                onClick={() => toggleUser(u._id)}
                className={`flex justify-between items-center px-4 py-2 rounded-lg cursor-pointer ${
                  selectedUsers.includes(u._id)
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700"
                }`}
              >
                <span>{u.name}</span>
                {selectedUsers.includes(u._id) && <Plus size={16} />}
              </div>
            ))}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg"
          >
            {loading ? "Creating..." : "Create Group"}
          </button>
        </form>
      </div>
    </div>
  );
}