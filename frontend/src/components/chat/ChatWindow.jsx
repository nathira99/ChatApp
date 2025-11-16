import React, { useEffect, useState, useRef } from "react";
import { useSocket } from "../../context/SocketContext";
import { useAuth } from "../../hooks/useAuth";
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
  X,
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

  // ------------------ CLOSE PANELS ON OUTSIDE CLICK ------------------
  useEffect(() => {
    function handleOutsideClick(e) {
      if (menuOpen && menuRef.current && !menuRef.current.contains(e.target))
        setMenuOpen(false);

      if (
        searchMode &&
        searchRef.current &&
        !searchRef.current.contains(e.target)
      ) {
        setSearchMode(false);
        setSearchTerm("");
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [menuOpen, searchMode]);
  // -------------------------------------------------------------------

  // ------------------ LOAD MESSAGES ------------------
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

        // check cleared timestamp
        const cleared = JSON.parse(
          localStorage.getItem("clearedChats") || "{}"
        );
        const clearTime = cleared[chat._id];

        // decrypt and filter
        const decrypted = data
          .map((msg) => {
            try {
              const bytes = CryptoJS.AES.decrypt(msg.content, SECRET_KEY);
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
  // ----------------------------------------------------

  // ------------------ SEARCH ------------------
  useEffect(() => {
    if (!searchTerm.trim()) setFilteredMessages(messages);
    else {
      const q = searchTerm.toLowerCase();
      setFilteredMessages(
        messages.filter((m) => m.content?.toLowerCase().includes(q))
      );
    }
  }, [searchTerm, messages]);
  // ----------------------------------------------------

  // ------------------ SEND MESSAGE ------------------
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

      if (onMessageUpdate) onMessageUpdate(chat._id, cleanMsg.content, true);

      setMessages((prev) => [...prev, cleanMsg]);
    } catch (err) {
      console.error("❌ Send failed:", err);
    }
  };
  // ----------------------------------------------------

  // ------------------ FILE SEND ------------------
  const handleFileSend = async () => {
    alert("File upload code moved out for clarity. Will re-add when needed.");
  };
  // ----------------------------------------------------

  // ------------------ CLEAR CHAT ------------------
  const handleClearChat = () => {
    const ok = clearChat(chat._id);
    if (ok) {
      setMessages([]);
      setFilteredMessages([]);
    }
    setMenuOpen(false);
  };
  // ----------------------------------------------------

  if (loading)
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        Loading chat...
      </div>
    );

  // --------------------------- UI ----------------------------
  return (
  <div className="flex flex-col h-full w-full bg-gray-50 dark:bg-gray-900">

    {/* HEADER */}
    <div className="px-4 py-2 border-b bg-white dark:bg-gray-800 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button onClick={onClose} className="sm:hidden">
          <ArrowLeft className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center">
            {chat?.name?.charAt(0)}
          </div>

          <div>
            <h2 className="font-semibold text-gray-800 dark:text-gray-200">
              {chat.name}
            </h2>
            <p className="text-xs text-gray-500">
              {chat.isGroup ? "Group Chat" : "Personal Chat"}
            </p>
          </div>
        </div>
      </div>

      {/* MENU */}
      <div className="relative" ref={menuRef}>
        <button onClick={() => setMenuOpen(!menuOpen)}>
          <MoreVertical className="w-5 h-5 text-gray-600" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 mt-2 bg-white dark:bg-gray-800 shadow-lg rounded-lg w-40">
            <button
              onClick={handleClearChat}
              className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              Clear Chat
            </button>

            {!chat.isGroup && (
              <button
                onClick={() => alert("Block later")}
                className="w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
              >
                Block User
              </button>
            )}
          </div>
        )}
      </div>
    </div>

    {/* SEARCH BAR */}
    {searchMode && (
      <div className="p-3 bg-gray-100 dark:bg-gray-800">
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 rounded-lg"
          placeholder="Search messages..."
        />
      </div>
    )}

    {/* MESSAGE LIST */}
    <MessageList messages={filteredMessages} currentUserId={user._id} />

    {/* INPUT */}
    <MessageInput onSend={handleSend} />
  </div>
);
}
