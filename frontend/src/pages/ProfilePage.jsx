// src/pages/ProfilePage.jsx
import React, { useState, useEffect } from "react";
import api from "../services/api";
import { User, Mail, MessageCircle, Calendar, Power, User2 } from "lucide-react";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../hooks/useAuth";
import { getAvatarUrl } from "../utils/avatar";

export default function ProfilePage() {
  const { userProfiles } = useSocket();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async () => {
    try {
      const res = await api.get("/auth/profile");
      setUser(res.data);
    } catch (err) {
      console.error("Failed to load profile:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  // ---------------- REAL-TIME PROFILE SYNC ----------------
  useEffect(() => {
    if (!user) return;
    const live = userProfiles[user._id];
    if (live) {
      setUser((prev) => ({
        ...prev,
        ...live,
      }));
    }
  }, [userProfiles, user?._id]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen text-gray-400">
        Loading profile...
      </div>
    );

  if (!user) return null;

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-100 dark:bg-gray-950">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 shadow-xl rounded-2xl p-6 border border-gray-200 dark:border-gray-800">
        <h2 className="text-2xl font-bold text-center mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          My Profile
        </h2>

        {/* Avatar */}
        <div className="flex justify-center mb-4">
          <img
            src={getAvatarUrl(user.avatar)}
            alt="Avatar"
            className="w-24 h-24 rounded-full object-cover border-2 border-blue-500 shadow-md"
          />
        </div>

        {/* Basic Info */}
        <div className="space-y-4 text-gray-800 dark:text-gray-200">
          {/* Name */}
          <div className="flex items-center gap-3">
            <User className="text-blue-600" />
            <span className="font-semibold">{user.name}</span>
          </div>

          {/* Email */}
          <div className="flex items-center gap-3">
            <Mail className="text-purple-600" />
            <span>{user.email}</span>
          </div>

          {/* About */}
          <div className="flex items-center gap-3">
            <MessageCircle className="text-green-600" />
            <span>{user.about || "No bio added"}</span>
          </div>

          {/* Status */}
          <div className="flex items-center gap-3">
            <Power className="text-red-600" />
            <span className="capitalize">{user.status || "offline"}</span>
          </div>

          {/* Joined Date */}
          <div className="flex items-center gap-3">
            <Calendar className="text-yellow-600" />
            <span>Joined: {new Date(user.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* SETTINGS BUTTON */}
        <div className="mt-6 text-center">
          <button
            onClick={() => (window.location.href = "/settings")}
            className="w-full py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:opacity-90 transition"
          >
            Edit Profile
          </button>
        </div>
      </div>
    </div>
  );
}
