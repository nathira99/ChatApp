import React, { useState, useEffect } from "react";
import { X, Plus } from "lucide-react";
import api from "../../services/api";

export default function CreateGroup({ onClose, onGroupCreated }) {
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get("/users");
      setUsers(res.data);
    } catch (err) {
      console.error("❌ Error fetching users:", err);
    }
  };

  const toggleUser = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) return alert("Please enter a group name");
    if (selectedUsers.length < 2)
      return alert("Select at least 2 members for the group");

    setLoading(true);
    try {
      const res = await api.post("/groups", {
        name: groupName,
        description,
        members: selectedUsers,
        isPrivate,
      });

      onGroupCreated(res.data);
      onClose();
    } catch (err) {
      console.error("❌ Error creating group:", err);
      alert("Failed to create group");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
            Create New Group
          </h2>
          <button
            onClick={onClose}
            className="text-gray-600 dark:text-gray-300 hover:text-red-500"
          >
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Group Name */}
          <input
            type="text"
            placeholder="Group Name"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:text-gray-200"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            required
          />

          {/* Description */}
          <textarea
            placeholder="Description (optional)"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:text-gray-200"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          {/* Privacy Option */}
          <div className="mt-3">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Privacy:
              </label>
              <select
                value={isPrivate ? "private" : "public"}
                onChange={(e) => setIsPrivate(e.target.value === "private")}
                className="px-2 py-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </div>
            <p className="text-xs text-gray-500 mt-1 ml-1 dark:text-gray-400">
              • <b>Public:</b> Anyone can view and request to join. 
              • <b>Private:</b> Only members can see or access messages.
            </p>
          </div>

          {/* User Selection */}
          <div className="max-h-48 overflow-y-auto space-y-2">
            {users.map((user) => (
              <div
                key={user._id}
                onClick={() => toggleUser(user._id)}
                className={`flex justify-between items-center px-4 py-2 rounded-lg cursor-pointer transition ${
                  selectedUsers.includes(user._id)
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                <span>{user.name}</span>
                {selectedUsers.includes(user._id) && <Plus size={16} />}
              </div>
            ))}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:opacity-90 transition"
          >
            {loading ? "Creating..." : "Create Group"}
          </button>
        </form>
      </div>
    </div>
  );
}
