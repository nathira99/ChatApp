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
import { triggerRefresh } from "../../utils/triggerRefresh";

export default function ChatWindow({ chat, onClose }) {
  const { socket } = useSocket();
  const { user } = useAuth();

  const [messages, setMessages] = useState([]);
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [searchMode, setSearchMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  const menuRef = useRef(null);
  const navigate = useNavigate();

  console.log("ACTIVE CHAT:", chat);
  // -------- Close menu when click outside ----------
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuOpen && menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [menuOpen]);

  // -------- LOAD MESSAGES ----------
  useEffect(() => {
    if (!chat || !user) return;

    const loadMessages = async () => {
      setLoading(true);

      try {
        let data = chat.isGroup
          ? await getGroupMessages(chat._id)
          : await getMessages(chat.userId);

        // join socket rooms
        chat.isGroup
          ? socket.emit("join:group", chat._id)
          : socket.emit("join", user._id);

        const cleared = JSON.parse(
          localStorage.getItem("clearedChats") || "{}"
        );
        const clearTime = cleared[chat._id];

        const raw = Array.isArray(data) ? data : data.messages || data;

        const filtered = raw.filter((msg) =>
          clearTime ? new Date(msg.createdAt).getTime() > clearTime : true
        );

        setMessages(filtered);
        setFilteredMessages(filtered);
      } catch (err) {
        console.error("Error loading messages:", err);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [chat, user, socket]);

  // -------- SOCKET REALTIME LISTENERS ----------
useEffect(() => {
  if (!socket || !chat) return;

  const activeId = chat.conversationId || chat._id;

  const handler = (msg) => {
    if (String(msg.conversationId) !== String(activeId)) return;
    setMessages((prev) => {
      if (prev.some((m) => String(m._id) === String(msg._id))) return prev;
      return [...prev, msg];
    });
 };

  // Always remove old listener first (prevents double emit)
  socket.off("group:message:receive", handler);
  socket.off("message:receive", handler);

  socket.on("group:message:receive", handler);
  socket.on("message:receive", handler);

  return () => {
    socket.off("group:message:receive", handler);
    socket.off("message:receive", handler);
  };

}, [socket, chat?._id]);

  // -------- SEARCH FILTER ----------
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredMessages(messages);
    } else {
      const q = searchTerm.toLowerCase();
      setFilteredMessages(
        messages.filter((m) => (m.content || "").toLowerCase().includes(q))
      );
    }
  }, [searchTerm, messages]);

  // -------- SEND TEXT ----------
  const handleSend = async (content) => {
    if (!content.trim()) return;

    try { 
      if(chat.isGroup){
         await sendGroupMessage(chat._id, content);
        }
        else {
      const newMsg = await sendMessage(chat.userId, content);
      setMessages((prev) => [...prev, newMsg]);}

      triggerRefresh();
    } catch (err) {
      console.error("Send failed:", err);
    }
  };

  // -------- SEND FILE ----------
  const handleFileSend = async (file) => {
    if (!file) return;

    try {
      let newMsg;

      if (chat.isGroup) {
        const formData = new FormData();
        formData.append("file", file);

        const res = await api.post(`/groups/${chat._id}/upload`, formData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "multipart/form-data",
          },
        });
        console.log(`${chat._id}`);

        newMsg = res.data;

        // setMessages((prev) => [...prev, newMsg]);

        triggerRefresh();
      } else {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("receiverId", chat.userId);

        const res = await api.post("/messages/upload", formData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "multipart/form-data",
          },
        });

        newMsg = res.data;

        setMessages((prev) => [...prev, newMsg]);

        triggerRefresh();
      }
    } catch (err) {
      console.error("File upload failed:", err);
    }
  };

  // -------- CLEAR CHAT ----------
  const handleClearChat = async () => {
    try {
      await clearChat(chat._id);
      setMessages([]);
      setFilteredMessages([]);
      alert("Chat cleared!");
    } catch {
      alert("Failed to clear chat");
    } finally {
      setMenuOpen(false);
    }
  };

  if (loading)
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        Loading chat...
      </div>
    );

  return (
    <div className="flex flex-col h-[100dvh] bg-gray-50 dark:bg-gray-900 dark:text-gray-200">
      {/* HEADER */}
      <div className="bg-white dark:bg-gray-800 sm:bg-gray-50 dark:sm:bg-gray-900 sm:px-4 py-2 border-b dark:border-gray-700 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="block sm:hidden p-2 dark:text-gray-200"
          >
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
              <h2 className="text-lg font-semibold flex items-center gap-2">
                {chat?.name}
                {chat.isGroup && chat.admins?.includes(user._id) && (
                  <span className="text-[10px] bg-blue-600 text-white px-1 rounded">
                    Admin
                  </span>
                )}
              </h2>
              <div className="text-xs text-gray-500">
                {chat.isGroup ? "Group Chat" : "Personal Chat"}
              </div>
            </div>
          </div>
        </div>

        {/* MENU */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((p) => !p)}
            className="p-2 rounded-full"
          >
            <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-200" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-gray-800 shadow-lg rounded-lg z-50">
              <button
                onClick={() => setSearchMode(true)}
                className="w-full px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <Search size={14} /> Search
              </button>

              <button
                onClick={handleClearChat}
                className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <Trash2 size={14} /> Clear Chat
              </button>

              {!chat.isGroup && (
                <button className="w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center gap-2">
                  <Ban size={14} /> Block
                </button>
              )}
            </div>
          )}
        </div>
      </div>

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

      {/* MESSAGE AREA */}
      <div className="flex flex-col flex-1 min-h-0">
        <div className="flex-1 overflow-y-auto">
          <MessageList messages={filteredMessages} currentUserId={user?._id} />
        </div>

        <div className="border-t bg-white dark:bg-gray-800 p-2 flex-shrink-0">
          <MessageInput onSend={handleSend} onFileSend={handleFileSend} />
        </div>
      </div>
    </div>
  );
}
