import React, { useState, useEffect } from "react";
import api from "../services/api";

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get("/auth/profile");
        setUser(res.data);
        setName(res.data.name);
        setAvatar(res.data.avatar);
      } catch (error) {
        console.error("Failed to load profile:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.put("/auth/profile", { name, avatar });
      alert("Profile updated successfully!");
    } catch (err) {
      console.error("Update failed:", err);
    }
  };

  if (loading)
    return <p className="text-center text-gray-500 mt-10">Loading profile...</p>;

  return (
    <div className="p-6 max-w-xl mx-auto bg-white dark:bg-gray-900 shadow-lg rounded-xl border border-gray-200 dark:border-gray-700">
      <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        My Profile
      </h2>

      <form onSubmit={handleUpdate} className="space-y-4">
        <div className="flex items-center gap-4">
          <img
            src={avatar || "/default-avatar.png"}
            alt="Avatar"
            className="w-16 h-16 rounded-full object-cover border"
          />
          <input
            type="text"
            placeholder="Avatar URL"
            value={avatar}
            onChange={(e) => setAvatar(e.target.value)}
            className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Full Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          className="w-full py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 transition"
        >
          Update Profile
        </button>
      </form>
    </div>
  );
};

export default ProfilePage;
