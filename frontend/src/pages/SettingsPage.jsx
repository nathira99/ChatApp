import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../hooks/useAuth";
import { getAvatarUrl } from "../utils/avatar";

import {
  User,
  MessageCircle,
  Upload,
  Power,
  Save,
  Loader2,
} from "lucide-react";

export default function SettingsPage() {
  const { broadcastProfileUpdate } = useSocket();
  const { updateUser } = useAuth(); // <-- GLOBAL CONTEXT UPDATE

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [about, setAbout] = useState("");
  const [status, setStatus] = useState("online");
  const [preview, setPreview] = useState("/avatar.png");
  const [avatarFile, setAvatarFile] = useState(null);

  // ---------------- LOAD PROFILE ----------------
  const loadProfile = async () => {
    try {
      const res = await api.get("/auth/profile");
      const u = res.data;

      setUser(u);
      setName(u.name || "");
      setAbout(u.about || "");
      setStatus(u.status || "online");
      setPreview(getAvatarUrl(u.avatar));
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  // ---------------- AVATAR SELECT ----------------
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];

    if (!allowedTypes.includes(file.type)) {
      alert("Invalid file type, must be JPEG, PNG, or JPG");
      e.target.value = "";
      return;
    };

    setAvatarFile(file);

    // Preview local temporary image
    setPreview(URL.createObjectURL(file));
  };

  // ---------------- SAVE CHANGES ----------------
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const form = new FormData();
      form.append("name", name);
      form.append("about", about);
      form.append("status", status);
      if (avatarFile) form.append("avatar", avatarFile);

      const res = await api.put("/auth/upload/profile", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const updated = res.data.user;

      // console.log("Profile update response:", updated);

      // Update Global AuthContext + localStorage
      updateUser(updated);

      // Fix avatar URL when saved
      setPreview(getAvatarUrl(updated.avatar));

      // Real-time socket broadcast
      broadcastProfileUpdate(updated);

      alert("Profile updated successfully");
      navigate("/");
    } catch (err) {
      console.error(err);
      alert("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  // ---------------- SELF DEACTIVATE ----------------
  const handleDeactivate = async () => {
    if (!window.confirm("Deactivate account?")) return;

    try {
      await api.put("/auth/deactivate");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/profile");
    } catch (err) {
      console.error(err);
      alert("Failed to deactivate your account");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete your account permanently?")) return;

    try {
      await api.delete("/auth/delete");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/register";
    } catch (err) {
      console.error(err);
      alert("Failed to delete your account");
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen text-gray-400">
        Loading settings...
      </div>
    );

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-100 dark:bg-gray-950 dark:text-gray-200">
      <div className="w-full max-w-lg bg-white dark:bg-gray-900 shadow-xl rounded-2xl p-6 border">

        <h2 className="text-2xl font-bold text-center mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Profile Settings
        </h2>

        {/* Avatar */}
        <div className="flex justify-center mb-4 relative">
          <img
            src={preview}
            alt="avatar"
            className="w-24 h-24 rounded-full object-cover border-2 border-blue-500 shadow-lg"
          />

          <label className="absolute bottom-0 right-48 bg-blue-600 text-white rounded-full p-1 cursor-pointer">
            <Upload size={14} />
            <input type="file" accept="image/*"
              className="hidden" onChange={handleAvatarChange} />
          </label>
        </div>

        {/* FORM */}
        <form className="space-y-4" onSubmit={handleSave}>
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold mb-1"><User size={18} /> Name</label>
            <input className="w-full px-3 py-2 rounded-lg border bg-gray-50 dark:bg-gray-800"
              value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-semibold mb-1"><MessageCircle size={18} /> About</label>
            <input className="w-full px-3 py-2 rounded-lg border bg-gray-50 dark:bg-gray-800"
              value={about} onChange={(e) => setAbout(e.target.value)} />
          </div>

          {/* <div>
            <label className="flex items-center gap-2 text-sm font-semibold mb-1"><Power size={18} /> Status</label>
            <select className="w-full px-3 py-2 rounded-lg border bg-gray-50 dark:bg-gray-800"
              value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="online">Online</option>
              <option value="away">Away</option>
              <option value="offline">Offline</option>
            </select>
          </div> */}

          <button type="submit" disabled={saving}
            className="w-full py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg flex items-center justify-center gap-2">
            {saving ? <Loader2 className="animate-spin" /> : <Save size={16} />}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>

        <button onClick={handleDeactivate}
          className="mt-6 w-full py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition">
          Deactivate Account
        </button>

        <button onClick={handleDelete}
          className="mt-4 w-full py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
          Delete Account
        </button>
      </div>
    </div>
  );
}