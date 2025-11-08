import React, { useEffect, useState } from "react";
import { useSocket } from "../../context/SocketContext";
import { useAuth } from "../../hooks/useAuth";
import { getMessages, sendMessage } from "../../services/messageService";
import { getGroupMessages, sendGroupMessage } from "../../services/groupService";
import { useNavigate } from "react-router-dom";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import { ArrowLeft } from "lucide-react";
import * as CryptoJS from "crypto-js";

export default function ChatWindow({ chat }) {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const SECRET_KEY = import.meta.env.VITE_ENCRYPTION_KEY || "default_secret_key";

  console.log("🧩 ChatWindow received chat:", chat);
  console.log("👤 Current user:", user);
  console.log("Chat ID:", chat?._id);

  // ✅ Load messages when chat changes
  useEffect(() => {
    if (!chat || !user) return;

    setMessages([]);
    setLoading(true);

    const loadMessages = async () => {
      try {
        let data;
        if (chat.isGroup) {
          data = await getGroupMessages(chat._id);
          socket.emit("join:group", chat._id);
        } else {
          data = await getMessages(chat._id);
          socket.emit("join", user._id);
        }

        // 🔓 Decrypt all messages
        const decrypted = data.map((msg) => {
          if (!msg.content) return msg;
          try {
            const bytes = CryptoJS.AES.decrypt(msg.content, SECRET_KEY);
            const text = bytes.toString(CryptoJS.enc.Utf8);
            return { ...msg, content: text || msg.content };
          } catch {
            return msg;
          }
        });

        setMessages(decrypted);
      } catch (err) {
        console.error("❌ Error loading messages:", err);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();

    // ✅ Listen for incoming messages
    socket.on("message:receive", (msg) => {
      if (!msg) return;

      const isGroupMsg = chat.isGroup && msg.group?._id === chat._id;
      const isDirectMsg =
        !chat.isGroup &&
        ((msg.sender._id === chat._id && msg.receiver._id === user._id) ||
          (msg.receiver._id === chat._id && msg.sender._id === user._id));

      if (isGroupMsg || isDirectMsg) {
        // Prevent duplicates using both _id and tempId
        setMessages((prev) => {
          const exists = prev.some((m) => m._id === msg._id || m.tempId === msg.tempId);
          if (exists) return prev;

          // 🔓 Decrypt incoming message if still encrypted
          try {
            const bytes = CryptoJS.AES.decrypt(msg.content, SECRET_KEY);
            const text = bytes.toString(CryptoJS.enc.Utf8);
            msg.content = text || msg.content;
          } catch {}
          return [...prev, msg];
        });
      }
    });

    // ✅ Typing indicators
    socket.on("user:typing", (data) => {
      if (!chat.isGroup && data.senderId === chat._id) {
        setIsTyping(data.typing);
      }
    });

    socket.on("group:typing:start", () => {
      if (chat.isGroup) setIsTyping(true);
    });

    socket.on("group:typing:stop", () => {
      if (chat.isGroup) setIsTyping(false);
    });

    return () => {
      socket.off("message:receive");
      socket.off("user:typing");
      socket.off("group:typing:start");
      socket.off("group:typing:stop");
    };
  }, [chat, socket, user]);

  // ✅ Send message (unified logic)
  const handleSend = async (content) => {
    if (!content.trim()) return;

    const tempId = Date.now().toString();

    // 🕐 Optimistic message (decrypted)
    const tempMessage = {
      _id: tempId,
      tempId,
      sender: { _id: user._id, name: user.name },
      content,
      createdAt: new Date().toISOString(),
      isTemporary: true,
    };
    setMessages((prev) => [...prev, tempMessage]);

    try {
      let newMessage;
      if (chat.isGroup) {
        newMessage = await sendGroupMessage(chat._id, content);
      } else {
        newMessage = await sendMessage(chat._id, content);
      }

      // 🔓 Decrypt backend response
      try {
        const bytes = CryptoJS.AES.decrypt(newMessage.content, SECRET_KEY);
        const dec = bytes.toString(CryptoJS.enc.Utf8);
        newMessage.content = dec || content;
      } catch {}

      // 🧹 Replace temporary message with saved one
      setMessages((prev) =>
        prev.map((m) => (m.tempId === tempId ? newMessage : m))
      );

      // 🔥 Only emit for group — backend echoes private messages
      if (chat.isGroup) socket.emit("group:message:send", newMessage);
    } catch (err) {
      console.error("❌ Error sending message:", err);
      // Remove temp if failed
      setMessages((prev) => prev.filter((m) => m.tempId !== tempId));
    }
  };

  // ✅ Handle typing
  const handleTyping = (typing) => {
    if (chat.isGroup) {
      socket.emit(typing ? "group:typing" : "group:stopTyping", {
        groupId: chat._id,
        user,
      });
    } else {
      socket.emit("user:typing", {
        senderId: user._id,
        receiverId: chat._id,
        typing,
      });
    }
  };

  // ✅ UI States
  if (loading)
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        Loading chat...
      </div>
    );

  if (!chat)
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        Select a chat to start messaging 💬
      </div>
    );

  // ✅ UI Layout
  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3 bg-white dark:bg-gray-800">
        <button onClick={() => navigate(-1)} className="text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white flex items-center justify-center font-semibold">
          {chat.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            {chat.name}
          </h2>
          {chat.isGroup && <p className="text-xs text-gray-500">Group Chat</p>}
        </div>
      </div>

      {/* Messages */}
      <MessageList messages={messages} currentUserId={user._id} />

      {/* Typing Indicator */}
      {isTyping && (
        <div className="px-4 text-sm italic text-gray-500 animate-pulse">
          Someone is typing...
        </div>
      )}

      {/* Input */}
      <MessageInput onSend={handleSend} onTyping={handleTyping} />
    </div>
  );
}
