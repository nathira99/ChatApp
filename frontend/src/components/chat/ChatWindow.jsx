import React, { useEffect, useState } from "react";
import { useSocket } from "../../context/SocketContext";
import { useAuth } from "../../hooks/useAuth";
import { getMessages, sendMessage } from "../../services/messageService";
import {
  getGroupMessages,
  sendGroupMessage,
} from "../../services/groupService";
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

  // 🔐 Encryption key fallback
  const SECRET_KEY =
    import.meta.env.VITE_ENCRYPTION_KEY || "default_secret_key";

  console.log("🧩 ChatWindow received chat:", chat);
  console.log("👤 Current user:", user);
  console.log("Chat ID:", chat?._id);

  // ✅ Load and decrypt messages
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

        // 🔓 Decrypt messages
        const decrypted = data.map((msg) => {
          if (!msg.content) return msg;
          try {
            const bytes = CryptoJS.AES.decrypt(msg.content, SECRET_KEY);
            const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
            return { ...msg, content: decryptedText || msg.content };
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

    // ✅ Socket listeners
    socket.on("message:receive", (msg) => {
      if (!msg) return;

      const isGroupMsg = chat.isGroup && msg.group?._id === chat._id;
      const isDirectMsg =
        !chat.isGroup &&
        ((msg.sender._id === chat._id && msg.receiver._id === user._id) ||
          (msg.receiver._id === chat._id && msg.sender._id === user._id));

      if (isGroupMsg || isDirectMsg) {
        setMessages((prev) => {
          const exists = prev.some((m) => m._id === msg._id);
          return exists ? prev : [...prev, msg];
        });
      }
    });

    socket.on("user:typing", (data) => {
      if (
        (chat.isGroup && data.groupId === chat._id) ||
        (!chat.isGroup && data.senderId === chat._id)
      ) {
        setIsTyping(data.typing);
      }
    });

    return () => {
      socket.off("message:receive");
      socket.off("user:typing");
    };
  }, [chat, socket, user]);

  // ✅ Send message
  const handleSend = async (content) => {
    if (!content.trim()) return;

    try {
      let newMessage;
      if (chat.isGroup) {
        newMessage = await sendGroupMessage(chat._id, content);
      } else {
        newMessage = await sendMessage(chat._id, content);
      }

      let decryptedText = content;
      try {
        const bytes = CryptoJS.AES.decrypt(newMessage.content, SECRET_KEY);
        const dec = bytes.toString(CryptoJS.enc.Utf8);
        decryptedText = dec || content;
      } catch (e) {
        console.warn("Decryption failed:", e);
      }

      const cleanMsg = { ...newMessage, content: decryptedText };

      setMessages((prev) => {
        const exists = prev.some((msg) => msg._id === cleanMsg._id);
        return exists ? prev : [...prev, cleanMsg];
      });

      socket.emit("message:send", cleanMsg);
    } catch (err) {
      console.error("❌ Error sending message:", err);
    }
  };

  // ✅ Typing indicator
  const handleTyping = (typing) => {
    if (chat.isGroup) {
      socket.emit("user:typing", { groupId: chat._id, typing:true });
    } else {
      socket.emit("user:typing", {
        senderId: user._id,
        receiverId: chat._id,
        typing,
      });
    }
  };

  // ✅ Loading & empty states
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

  // ✅ UI
  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3 bg-white dark:bg-gray-800">
        <button
  onClick={() => navigate(-1)}
  className="text-gray-600 hover:text-gray-900"
>
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
