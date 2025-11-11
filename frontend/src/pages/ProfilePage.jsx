import React, { useState, useEffect } from "react";
import api from "../services/api";
import { User, Mail, MessageCircleWarning, OctagonPauseIcon } from "lucide-react";

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [about, setAbout] = useState("");
  const [status, setStatus] = useState("");
  const [email, setEmail] = useState("");
  const [avatar, setAvatar] = useState("");
  const [preview, setPreview] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get("/auth/profile");
        setUser(res.data);
        setPreview(res.data.avatar);
        setName(res.data.name);
        setEmail(res.data.email);
        setStatus(res.data.status);
        setAbout(res.data.about);
        setAvatar(res.data.avatar);
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
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setAvatar(reader.result);
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  }
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("avatar", avatar);
      formData.append("name", name);
      formData.append("about", about);
      formData.append("status", status);
      formData.append("email", email);
      await api.put("/auth/profile", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
      );
      setMsg("Updating profile...");
      setTimeout(() => setMsg(""), 2000);
    } catch (err) {
      console.error("Update failed:", err);
    }
  };

  if (loading)
    return (
      <p className="text-center text-gray-500 mt-10">Loading profile...</p>
    );

  return (
    <div className="p-6 max-w-xl mx-auto bg-white dark:bg-gray-900 shadow-lg rounded-xl border border-gray-200 dark:border-gray-700">
      <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        My Profile
      </h2>

      <form onSubmit={handleUpdate} className="space-y-4">
        <div className="flex items-center gap-4">
          <img
            src={ avatar || "/frontend/public/avatar.png"}
            alt="Avatar"
            className="w-16 h-16 rounded-full object-cover border"
          />
          <input
            type="text"
            placeholder="Avatar URL"
            value={avatar}
            onChange={handleAvatarChange}
            className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="flex space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
            <User size={ 18 } />
            <span>Name</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="flex space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
            <Mail size={ 18 } />
            <span>Email</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="flex space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
            <MessageCircleWarning size={ 18 } />
            <span>About</span>
          </label>
          <input
            type="text"
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            placeholder="About me"
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="flex space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
            <OctagonPauseIcon size={ 18 } />
            <span>Status</span>
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="online">Online</option>
            <option value="offline">Offline</option>
            <option value="away">Away</option>
            <option value="busy">Busy</option>
          </select>
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
