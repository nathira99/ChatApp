import React, { useEffect, useState, useRef } from "react";
import { useSocket } from "../../context/SocketContext";
import { useAuth } from "../../hooks/useAuth";
import {
  getMessages,
  sendMessage,
} from "../../services/messageService";
import {
  getGroupMessages,
  sendGroupMessage,
  addGroupMember,
  removeGroupMember,
  requestGroupJoin,
  manageJoinRequest,
} from "../../services/groupService";
import { ArrowLeft, MoreVertical, Search, Trash2, AlertTriangle, Ban } from "lucide-react";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import * as CryptoJS from "crypto-js";
import api from "../../services/api";

export default function ChatWindow({ chat, onClose }) {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [searchMode, setSearchMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newMember, setNewMember] = useState("");
  const menuRef = useRef(null);

  const SECRET_KEY = import.meta.env.VITE_ENCRYPTION_KEY || "default_secret_key";

  // 🔹 Load chat messages
  useEffect(() => {
    if (!chat || !user) return;

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

  // 🔎 Search
  useEffect(() => {
    if (!searchTerm.trim()) setFilteredMessages(messages);
    else {
      const q = searchTerm.toLowerCase();
      setFilteredMessages(messages.filter((m) => m.content?.toLowerCase().includes(q)));
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

  // ✅ Send message
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

  // ✅ File upload
  const handleFileSend = async (file) => {
    try {
      const tempId = Date.now().toString();
      const previewUrl = URL.createObjectURL(file);

      const tempMsg = {
        _id: tempId,
        tempId,
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
      formData.append("receiverId", chat._id);

      const res = await api.post("/messages/upload", formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      setMessages((prev) => prev.map((msg) => (msg.tempId === tempId ? res.data : msg)));
      socket.emit("message:send", res.data);
    } catch (err) {
      console.error("❌ File upload failed:", err);
    }
  };

  // ✅ Typing
  const handleTyping = (typing) => {
    if (chat.isGroup)
      socket.emit(typing ? "group:typing" : "group:stopTyping", {
        groupId: chat._id,
        user,
      });
    else
      socket.emit("user:typing", {
        senderId: user._id,
        receiverId: chat._id,
        typing,
      });
  };

  // ✅ Group Admin Functions
  const handleAddMember = async (memberId) => {
    try {
      const res = await addGroupMember(chat._id, memberId);
      alert(res.message);
    } catch (err) {
      console.error(err);
      alert("Failed to add member.");
    }
  };

  const handleRemoveMember = async (memberId) => {
    try {
      const res = await removeGroupMember(chat._id, memberId);
      alert(res.message);
    } catch (err) {
      console.error(err);
      alert("Failed to remove member.");
    }
  };

  const handleJoinRequest = async () => {
    try {
      const res = await requestGroupJoin(chat._id);
      alert(res.message);
    } catch (err) {
      console.error(err);
      alert("Failed to send join request.");
    }
  };

  const handleRequestAction = async (userId, action) => {
    try {
      const res = await manageJoinRequest(chat._id, userId, action);
      alert(res.message);
    } catch (err) {
      console.error(err);
      alert("Failed to process join request.");
    }
  };

  // ✅ Clear / Report / Block
  const handleClearMessages = () => {
    if (window.confirm("Clear all messages?")) {
      setMessages([]);
      setFilteredMessages([]);
    }
    setMenuOpen(false);
  };
  const handleBlock = () => {
    alert(`Blocked ${chat.name}`);
    setMenuOpen(false);
  };
  const handleReport = () => {
    alert(`Reported ${chat.name}`);
    setMenuOpen(false);
  };

  if (loading)
    return <div className="flex-1 flex items-center justify-center text-gray-400">Loading chat...</div>;

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* HEADER */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3 bg-white dark:bg-gray-800 relative">
        <button onClick={onClose} className="text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-6 h-6" />
        </button>

        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white flex items-center justify-center font-semibold">
          {chat.name.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{chat.name}</h2>
          {chat.isGroup && <p className="text-xs text-gray-500">Group Chat</p>}
        </div>

        <div className="relative" ref={menuRef}>
          <button onClick={() => setMenuOpen((p) => !p)} className="text-gray-600 hover:text-gray-900">
            <MoreVertical className="w-6 h-6" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-8 w-44 bg-white dark:bg-gray-800 shadow-lg rounded-lg py-2 text-sm border border-gray-200 dark:border-gray-700 z-50">
              <button onClick={() => setSearchMode((p) => !p)} className="flex items-center gap-2 px-3 py-2 w-full hover:bg-gray-100 dark:hover:bg-gray-700">
                <Search size={14} /> Search
              </button>
              <button onClick={handleClearMessages} className="flex items-center gap-2 px-3 py-2 w-full hover:bg-gray-100 dark:hover:bg-gray-700">
                <Trash2 size={14} /> Clear Chat
              </button>
              <button onClick={handleReport} className="flex items-center gap-2 px-3 py-2 w-full hover:bg-gray-100 dark:hover:bg-gray-700">
                <AlertTriangle size={14} /> Report
              </button>
              <button onClick={handleBlock} className="flex items-center gap-2 px-3 py-2 w-full hover:bg-gray-100 dark:hover:bg-gray-700">
                <Ban size={14} /> Block
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 🧩 GROUP MANAGEMENT */}
      {chat.isGroup && (
        <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          {chat.admins?.includes(user._id) ? (
            <div>
              <h3 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                🧑‍💼 Group Management
              </h3>

              <div className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Enter user ID or email..."
                  value={newMember}
                  onChange={(e) => setNewMember(e.target.value)}
                  className="flex-1 px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                />
                <button
                  onClick={() => handleAddMember(newMember)}
                  className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700"
                >
                  Add
                </button>
              </div>

              <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                Members:
                {chat.members?.map((m) => (
                  <span
                    key={m._id}
                    className="inline-flex items-center bg-gray-200 dark:bg-gray-700 rounded-full px-2 py-1 ml-2"
                  >
                    {m.name}
                    <button
                      onClick={() => handleRemoveMember(m._id)}
                      className="ml-1 text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              {chat.joinRequests?.length > 0 && (
                <div className="mt-2 text-xs">
                  <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-1">Pending Requests:</h4>
                  {chat.joinRequests.map((reqUser) => (
                    <div
                      key={reqUser._id}
                      className="flex justify-between items-center bg-gray-100 dark:bg-gray-800 p-2 rounded mb-1"
                    >
                      <span>{reqUser.name || reqUser.email}</span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleRequestAction(reqUser._id, "approve")}
                          className="text-green-600 hover:underline text-xs"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleRequestAction(reqUser._id, "reject")}
                          className="text-red-600 hover:underline text-xs"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center">
              <button
                onClick={handleJoinRequest}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
              >
                🙋 Request to Join Group
              </button>
            </div>
          )}
        </div>
      )}

      {/* SEARCH */}
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

      {/* MESSAGES */}
      <MessageList messages={filteredMessages} currentUserId={user._id} />

      {/* TYPING */}
      {isTyping && <div className="px-4 text-sm italic text-gray-500 animate-pulse">Someone is typing...</div>}

      {/* INPUT */}
      <MessageInput onSend={handleSend} onTyping={handleTyping} onFileSend={handleFileSend} />
    </div>
  );
}
