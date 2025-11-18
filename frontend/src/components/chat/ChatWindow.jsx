import React, { useEffect, useState, useRef } from "react";
import { useSocket } from "../../context/SocketContext";
import { useAuth } from "../../hooks/useAuth";
import api from "../../services/api";
import {
  getMessages,
  sendMessage,
  clearChat,
} from "../../services/messageService";
import {
  getGroupMessages,
  sendGroupMessage,
  uploadGroupFile,
} from "../../services/groupService";
import {
  ArrowLeft,
  Search,
  MoreVertical,
  AlertTriangle,
  Ban,
  Trash2,
} from "lucide-react";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import { useNavigate } from "react-router-dom";
import * as CryptoJS from "crypto-js";

export default function ChatWindow({ chat, onClose, onMessageUpdate }) {
  const { socket } = useSocket();
  const { user } = useAuth();

  const [messages, setMessages] = useState([]);
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [searchMode, setSearchMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  const menuRef = useRef(null);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  const SECRET_KEY =
    import.meta.env.VITE_ENCRYPTION_KEY || "default_secret_key";
  const clearedOnceRef = useRef(false);

  useEffect(() => {
    function handleOutsideClick(e) {
      if (menuOpen && menuRef.current && !menuRef.current.contains(e.target))
        setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [menuOpen, searchMode]);

  useEffect(() => {
    if (!chat || !user) return;
    const loadMessages = async () => {
      setLoading(true);
      try {
        let data;
        if (chat.isGroup) {
          data = await getGroupMessages(chat._id);
          socket.emit("join:group", chat._id);
          socket.emit("group:refresh");
        } else {
          data = await getMessages(chat._id);
          socket.emit("join", user._id);
          socket.emit("users:refresh");
        }

        const cleared = JSON.parse(
          localStorage.getItem("clearedChats") || "{}"
        );
        const clearTime = cleared[chat._id];

        const raw = Array.isArray(data) ? data : data.messages || data;
        const decrypted = raw
          .map((msg) => {
            try {
              const bytes = CryptoJS.AES.decrypt(msg.content || "", SECRET_KEY);
              const text = bytes.toString(CryptoJS.enc.Utf8);
              return { ...msg, content: text || msg.content };
            } catch {
              return msg;
            }
          })
          .filter((msg) =>
            clearTime ? new Date(msg.createdAt).getTime() > clearTime : true
          );

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

  useEffect(() => {
    if (!searchTerm.trim()) setFilteredMessages(messages);
    else {
      const q = searchTerm.toLowerCase();
      setFilteredMessages(
        messages.filter((m) => (m.content || "").toLowerCase().includes(q))
      );
    }
  }, [searchTerm, messages]);

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

      const bytes = CryptoJS.AES.decrypt(newMsg.content || "", SECRET_KEY);
      const dec = bytes.toString(CryptoJS.enc.Utf8);
      const cleanMsg = { ...newMsg, content: dec || content };

      if (onMessageUpdate) onMessageUpdate(chat._id, cleanMsg.content, true);

      setMessages((prev) => [...prev, cleanMsg]);
    } catch (err) {
      console.error("❌ Send failed:", err);
    }
  };
  // ------------------ FILE SEND (FINAL FIXED) ------------------
  const handleFileSend = async (file) => {
    if (!file) return;

    try {
      let newMsg;

      if (chat.isGroup) {
        // GROUP FILE UPLOAD (correct endpoint + FormData)
        const formData = new FormData();
        formData.append("file", file);

        const res = await api.post(`/groups/${chat._id}/upload`, formData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "multipart/form-data",
          },
        });

        newMsg = res.data;
        socket.emit("group:message:send", newMsg);
      } else {
        // PERSONAL CHAT FILE UPLOAD
        const formData = new FormData();
        formData.append("file", file);
        formData.append("receiverId", chat._id);

        const res = await api.post("/messages/upload", formData, {
          headers: {
            Authorization: ` Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "multipart/form-data",
          },
        });

        newMsg = res.data;
        socket.emit("message:send", newMsg);
      }

      // decrypt if needed
      const bytes = CryptoJS.AES.decrypt(newMsg.content || "", SECRET_KEY);
      const dec = bytes.toString(CryptoJS.enc.Utf8);

      const cleanMsg = { ...newMsg, content: dec || newMsg.content };
      setMessages((prev) => [...prev, cleanMsg]);
    } catch (err) {
      console.error("❌ File upload failed:", err);
    }
  };

  const handleClearChat = () => {
    const ok = clearChat(chat._id);
    if (ok) {
      setMessages([]);
      setFilteredMessages([]);
      alert("Chat cleared!");
    }
    setMenuOpen(false);
  };

  if (loading)
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        Loading chat...
      </div>
    );

  return (
    <div className="flex flex-col h-full w-full bg-gray-50 dark:bg-gray-900">
      {/* HEADER: back button visible only on mobile (sm:hidden) */}
      <div className="sm:fixed sm:inset-x-0 sm:top-0 sm:z-10 sm:bg-gray-50 dark:sm:bg-gray-900 sm:px-4 py-2 border-b bg-white dark:bg-gray-800 flex items-center justify-between sm:mt-16">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="block sm:hidden p-2 dark:text-gray-200">
            <ArrowLeft className="w-6 h-6" />
          </button>

          <div
            className="cursor-pointer inline-flex items-center gap-2"
            onClick={() =>
              navigate(
                chat.isGroup
                  ? `/groups/${chat._id}/info`
                  : `/users/${chat._id}/info`
              )
            }
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white">
              {chat?.name?.charAt(0)?.toUpperCase() || "?"}
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                {chat?.name}
                {chat.isGroup && chat.admins?.includes(user._id) && (
                  <span className="text-[10px] bg-blue-600 text-white px-1 rounded">
                    Admin
                  </span>
                )}
              </h2>
              <div className="text-xs text-gray-500">
                {chat.isGroup ? (
                  <span className="truncate block max-w-[200px]">
                    {chat.members?.length
                      ? chat.members.map((m) => m.name).join(", ")
                      : "Group Chat"}
                  </span>
                ) : (
                  <span>Personal Chat</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((p) => !p)}
            className="p-2 rounded-full"
          >
            <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-200" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-gray-800 shadow-lg rounded-lg z-50">
              <div>
                <button
                  onClick={() => setSearchMode(true)}
                  className="w-full px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <Search size={14} /> Search
                </button>
              </div>

              <button
                onClick={handleClearChat}
                className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <Trash2 size={14} /> Clear Chat
              </button>

              <button
                onClick={async () => {
                  const reason = prompt("Why are you reporting this?");

                  if (!reason || !reason.trim()) return;

                  try {
                    if (chat.isGroup) {
                      // Report Group
                      await api.post("/reports", {
                        reason,
                        groupId: chat._id,
                      });
                    } else {
                      // Report User
                      await api.post("/reports", {
                        reason,
                        userId: chat._id,
                      });
                    }

                    alert("Report submitted successfully");
                  } catch (err) {
                    console.error("❌ Report failed:", err);
                    const msg = err?.response?.data?.message || "Failed to submit report";
                    alert(msg);
                  }
                }}
                className="w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center gap-2"
              >
                <AlertTriangle size={14} /> Report
              </button>

              {!chat.isGroup && (
                <button
                  onClick={() => alert("Block user functionality not yet implemented")}
                  className="w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center gap-2"
                >
                  <Ban size={14} /> Block
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* SEARCH */}
      {searchMode && (
        <div className="p-3 bg-gray-100 dark:bg-gray-800">
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search messages…"
            className="w-full px-3 py-2 rounded-lg"
          />
        </div>
      )}

      {/* MESSAGES */}
      <MessageList messages={filteredMessages} currentUserId={user?._id} />

      {/* INPUT */}
      <MessageInput onSend={handleSend} onFileSend={handleFileSend} />
    </div>
  );
}
