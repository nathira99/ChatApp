import React, { useEffect, useState, useRef } from "react";
import { useSocket } from "../../context/SocketContext";
import { useAuth } from "../../hooks/useAuth";
import { getMessages, sendMessage } from "../../services/messageService";
import {
  getGroupMessages,
  sendGroupMessage,
  addGroupMember,
  removeGroupMember,
} from "../../services/groupService";
import {
  ArrowLeft,
  Search,
  MoreVertical,
  Trash2,
  AlertTriangle,
  Ban,
  X,
} from "lucide-react";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import { useNavigate } from "react-router-dom";
import * as CryptoJS from "crypto-js";
import api from "../../services/api";

export default function ChatWindow({ chat, onClose }) {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [searchMode, setSearchMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showGroupPanel, setShowGroupPanel] = useState(false);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [newMember, setNewMember] = useState("");
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const SECRET_KEY = import.meta.env.VITE_ENCRYPTION_KEY || "default_secret_key";

  const toggleGroupPanel = () => setShowGroupPanel((prev) => !prev);
  const clearedOnceRef = useRef(false);
  // Load chat messages
useEffect(() => {
  if (!chat || !user) return(
    <div className="flex items-center justify-center h-full text-gray-500">
      Loading Chat...
    </div>
  );

  const loadMessages = async () => {
    setLoading(true);
    try {
      let data;
      if (chat.isGroup) {
        data = await getGroupMessages(chat._id);
        socket.emit("join:group", chat._id);
      } else {
        data = await getMessages(chat._id);
        socket.emit("join", user._id);
      }

      // ✅ Skip reloading cleared chats locally
      const clearedChats = JSON.parse(localStorage.getItem("clearedChats") || "{}");
      const isCleared = clearedChats[chat._id];

      if (isCleared && !clearedOnceRef.current) {
        clearedOnceRef.current = true;
        setMessages([]);
        setFilteredMessages([]);
        setLoading(false);
        return;
      }

      // continue normal message decryption
      const decrypted = data.map((msg) => {
        try {
          const bytes = CryptoJS.AES.decrypt(msg.content, SECRET_KEY);
          const text = bytes.toString(CryptoJS.enc.Utf8);
          return { ...msg, content: text || msg.content };
        } catch {
          return msg;
        }
      });

      setMessages(decrypted);
      setFilteredMessages(decrypted);
    } catch (err) {
      console.error("❌ Error loading messages:", err);
    } finally {
      setLoading(false);
    }
  };

  loadMessages();
}, [chat, user, socket]);


  // Search
  useEffect(() => {
    if (!searchTerm.trim()) setFilteredMessages(messages);
    else {
      const q = searchTerm.toLowerCase();
      setFilteredMessages(
        messages.filter((m) => m.content?.toLowerCase().includes(q))
      );
    }
  }, [searchTerm, messages]);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Send message
  const handleSend = async (content) => {
    if (!content.trim()) return;
    try {
      let newMsg;
      if (chat.isGroup) {
        newMsg = await sendGroupMessage(chat._id, content);
        socket.emit("group:message:send", newMsg);
      } else {
        newMsg = await sendMessage(chat._id, content);
        socket.emit("message:send", newMsg);
      }

      const bytes = CryptoJS.AES.decrypt(newMsg.content, SECRET_KEY);
      const dec = bytes.toString(CryptoJS.enc.Utf8);
      const cleanMsg = { ...newMsg, content: dec || content };
      setMessages((prev) => [...prev, cleanMsg]);
    } catch (err) {
      console.error("❌ Send failed:", err);
    }
  };

// ✅ File upload handler
const handleFileSend = async (file) => {
  try {
    const tempId = Date.now().toString();
    const previewUrl = URL.createObjectURL(file);

    // Temporary preview message
    const tempMsg = {
      _id: tempId,
      sender: { _id: user._id, name: user.name },
      fileUrl: previewUrl,
      fileType: file.type,
      fileName: file.name,
      createdAt: new Date().toISOString(),
      isTemporary: true,
    };
    setMessages((prev) => [...prev, tempMsg]);

    const formData = new FormData();
    formData.append("file", file);

    if (chat.isGroup) {
      formData.append("groupId", chat._id);
      const res = await api.post(`/groups/${chat._id}/upload`, formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      socket.emit("group:message:send", res.data);
      setMessages((prev) =>
        prev.map((msg) => (msg._id === tempId ? res.data : msg))
      );
    } else {
      formData.append("receiverId", chat._id);
      const res = await api.post("/messages/upload", formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      socket.emit("message:send", res.data);
      setMessages((prev) =>
        prev.map((msg) => (msg._id === tempId ? res.data : msg))
      );
    }
  } catch (err) {
    console.error("❌ File upload failed:", err);
    alert("File upload failed. Try again.");
  }
};


  // Block / Report
  const handleBlock = () => {
    alert(`${chat.name} has been blocked.`);
    setMenuOpen(false);
  };

  const handleReport = () => {
    setShowReportModal(true);
    setMenuOpen(false);
  };

  // Report submit
  const submitReport = async () => {
    if (!reportReason.trim()) {
      alert("Please select or enter a reason.");
      return;
    }
    try {
      await api.post("/reports", {
        ...(chat.isGroup ? { groupId: chat._id } : { reportedUserId: chat._id }),
        reason: reportReason,
      });
      alert("Report submitted successfully.");
      setShowReportModal(false);
      setReportReason("");
    } catch (err) {
      console.error("Report failed:", err);
      alert("Failed to submit report.");
    }
  };

  // Add/remove member (admin only)
  const handleAddMember = async (memberIdOrEmail) => {
    try {
      const userId = memberIdOrEmail;
      const result = await addGroupMember(chat._id, userId);
      if (result.group) {
        chat.members = result.group.members;
        chat.admins = result.group.admins;
      }
      alert(result.message || "Member added");
      setNewMember("");
    } catch (err) {
      console.error("Add member failed:", err);
      alert(err.response?.data?.message || err.message || "Failed to add member");
    }
  };

  const handleRemoveMember = async (userId) => {
    try {
      const result = await removeGroupMember(chat._id, userId);
      if (result.group) {
        chat.members = result.group.members;
        chat.admins = result.group.admins;
      }
      alert(result.message || "Member removed");
    } catch (err) {
      console.error("Remove member failed:", err);
      alert(err.response?.data?.message || err.message || "Failed to remove member");
    }
  };

  if (loading)
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        Loading chat...
      </div>
    );

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* HEADER */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800 relative">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-6 h-6" />
          </button>

          <div
            className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white flex items-center justify-center font-semibold cursor-pointer"
            onClick={() =>
              navigate(chat.isGroup ? `/groups/${chat._id}/info` : `/users/${chat._id}/info`)
            }
          >
            {chat.name.charAt(0).toUpperCase()}
          </div>

          <div
            className="flex flex-col cursor-pointer"
            onClick={() =>
              navigate(chat.isGroup ? `/groups/${chat._id}/info` : `/users/${chat._id}/info`)
            }
          >
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 hover:text-blue-600">
              {chat.name}
            </h2>
            <p className="text-xs text-gray-500">
              {chat.isGroup ? "Group Chat" : "Personal Chat"}
            </p>
          </div>
        </div>

        {/* ⋯ Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            <MoreVertical className="text-gray-600 dark:text-gray-300 w-5 h-5" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 z-50">
              <button
                onClick={() => setSearchMode((prev) => !prev)}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <Search size={14} /> Search
              </button>
              <button
                onClick={handleReport}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <AlertTriangle size={14} /> Report {chat.isGroup ? "Group" : "User"}
              </button>
              {!chat.isGroup && (
                <button
                  onClick={handleBlock}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <Ban size={14} /> Block User
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 🧩 Group Management Panel */}
{chat.isGroup && chat.admins?.includes(user._id) && (
  <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
    <div className="flex items-center justify-between px-4 py-2">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
        👥 Group Management
      </h3>
      <button
        onClick={toggleGroupPanel}
        className="text-xs text-blue-600 hover:underline"
      >
        {showGroupPanel ? "Hide" : "Manage"}
      </button>
    </div>

    {showGroupPanel && (
      <div className="px-4 pb-3">
        {/* Add member */}
        <div className="flex items-center gap-2 mb-3">
          <input
            type="text"
            placeholder="Enter user ID or email..."
            value={newMember}
            onChange={(e) => setNewMember(e.target.value)}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <button
            onClick={() => handleAddMember(newMember)}
            className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700"
          >
            Add
          </button>
        </div>

        {/* Members list */}
        <div className="max-h-32 overflow-y-auto space-y-2">
          {chat.members?.length > 0 ? (
            chat.members.map((m) => (
              <div
                key={m._id}
                className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-md"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-semibold">
                    {m.name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-200">{m.name}</span>
                </div>
                {m._id !== user._id && (
                  <button
                    onClick={() => handleRemoveMember(m._id)}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))
          ) : (
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              No members in this group.
            </p>
          )}
        </div>
      </div>
    )}
  </div>
)}
      {/* Search Bar */}
      {searchMode && (
        <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search messages..."
            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      )}

      {/* Messages */}
      <MessageList messages={filteredMessages} currentUserId={user._id} />

      <MessageInput onSend={handleSend} onFileSend={handleFileSend} />

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-80 relative">
            <button
              onClick={() => setShowReportModal(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
            >
              <X size={18} />
            </button>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
              Report {chat.isGroup ? "Group" : "User"}
            </h3>
            <select
              onChange={(e) => setReportReason(e.target.value)}
              value={reportReason}
              className="w-full mb-3 p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:text-gray-200"
            >
              <option value="">Select reason...</option>
              <option>Spam or fake activity</option>
              <option>Offensive or abusive behavior</option>
              <option>Sharing inappropriate content</option>
              <option>Other</option>
            </select>
            <textarea
              placeholder="Additional details (optional)..."
              onChange={(e) => setReportReason(e.target.value)}
              className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:text-gray-200 mb-3"
              rows={3}
            ></textarea>
            <button
              onClick={submitReport}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-md"
            >
              Submit Report
            </button>
          </div>
        </div>
      )}
    </div>
  );
}