import React, { useState, useEffect } from "react";
import api from "../services/api";
import {
  User,
  Mail,
  MessageCircle,
  Power,
  CheckCircle,
  Loader2,
  Upload,
} from "lucide-react";

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [name, setName] = useState("");
  const [about, setAbout] = useState("");
  const [status, setStatus] = useState("online");
  const [avatar, setAvatar] = useState("");
  const [preview, setPreview] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get("/auth/profile");
        const userData = res.data || {};

        setUser(userData);
        setPreview(userData.avatar || "/avatar.png");
        setName(userData.name || "");
        setStatus(userData.status || "offline");
        setAbout(userData.about || "");
        setAvatar(userData.avatar || "");
      } catch (error) {
        console.error("Failed to load profile:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setAvatar(reader.result);
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const formData = new FormData();
      if (avatar) formData.append("avatar", avatar);
      formData.append("name", name);
      formData.append("about", about);
      formData.append("status", status);

      await api.put("/auth/profile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMsg("✅ Profile updated successfully");
      setTimeout(() => setMsg(""), 2000);
    } catch (err) {
      console.error("Update failed:", err);
      setMsg("❌ Failed to update profile");
    } finally {
      setUpdating(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen text-gray-400 text-lg">
        Loading profile...
      </div>
    );

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-100 dark:bg-gray-950">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 shadow-2xl rounded-2xl p-6 border border-gray-200 dark:border-gray-800 relative">
        <h2 className="text-2xl font-bold text-center mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          My Profile
        </h2>

        {/* Top Avatar + User Info */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            <img
              src={preview || "/avatar.png"}
              alt="Avatar"
              className="w-20 h-20 rounded-full object-cover border-2 border-blue-500 shadow-lg"
            />
            <label className="absolute bottom-0 right-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full p-1 cursor-pointer hover:scale-105 transition">
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
              <Upload size={12} />
            </label>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
              {name || "User"}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
              {status}
            </p>
          </div>
        </div>

        <form onSubmit={handleUpdate} className="space-y-4">
          {/* Name */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1">
              <User size={18} /> Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Your name"
            />
          </div>

          {/* About */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1">
              <MessageCircle size={18} /> About
            </label>
            <input
              type="text"
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Something about you..."
            />
          </div>

          {/* Status */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1">
              <Power size={18} /> Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="online">Online</option>
              <option value="away">Away</option>
              <option value="busy">Busy</option>
              <option value="offline">Offline</option>
            </select>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            disabled={updating}
            className="w-full py-2 rounded-lg text-white font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 transition flex items-center justify-center gap-2"
          >
            {updating ? (
              <>
                <Loader2 className="animate-spin" size={18} /> Updating...
              </>
            ) : (
              <>
                <CheckCircle size={18} /> Save Changes
              </>
            )}
          </button>
        </form>

        {msg && (
          <p className="text-center mt-4 text-sm text-blue-600 dark:text-blue-400">
            {msg}
          </p>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;