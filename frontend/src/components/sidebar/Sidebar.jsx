import React, { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { getConversations, getUserGroups } from "../../services/chatService";
import ConversationItem from "./ConversationItem";
import NewChatModal from "./NewChatModal";
import { PlusIcon } from "lucide-react";
import { SocketProvider, useSocket } from "../../context/SocketContext";

export default function Sidebar({ onSelectChat }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("chats");
  const [conversations, setConversations] = useState([]);
  const [groups, setGroups] = useState([]);
  const [showNewChat, setShowNewChat] = useState(false);
  const { refreshTrigger } = useSocket;
  const { socket } = useSocket();

  const triggerRefresh = () => {
    socket.emit("users:refresh");
    socket.emit("groups:refresh");
  };

  useEffect(() => {
    loadConversations();
    loadGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger]);

  useEffect(() => {
  if (!socket) return;

  socket.on("users:refresh", loadConversations);
  socket.on("groups:refresh", loadGroups);

  return () => {
    socket.off("users:refresh");
    socket.off("groups:refresh");
  };
}, [socket]);
  const normalizeConversations = (list = [], myId) => {
    return (list || [])
      .map((c) => {
        if (!c) return null;

        if (c.members && Array.isArray(c.members) && c.members.length > 0) {
          const other = c.members.find((m) => m && String(m._id) !== String(myId));
          if (!other && !c.isGroup) return null;

          const name = c.isGroup ? c.name : other?.name || c.name || "Unknown";
          return {
            _id: c._id || other?._id,
            isGroup: !!c.isGroup,
            otherUser: other
              ? {
                  _id: other._id,
                  name: other.name || "Unknown",
                  email: other.email || "",
                  avatar: other.avatar || "",
                }
              : null,
            name,
            lastMessage: c.lastMessage || "",
            lastMessageSender: c.lastMessageSender || "",
            lastMessageTime: c.lastMessageTime || c.updatedAt || "",
            imageUrl: c.imageUrl || "",
          };
        }

        if (c.otherUser) {
          return {
            _id: c._id || c.otherUser._id,
            isGroup: !!c.isGroup,
            otherUser: c.otherUser,
            name: c.name || c.otherUser.name || "Unknown",
            lastMessage: c.lastMessage || "",
            lastMessageSender: c.lastMessageSender || "",
            lastMessageTime: c.lastMessageTime || "",
            imageUrl: c.imageUrl || c.otherUser.avatar || "",
          };
        }

        if (c.isGroup) {
          return {
            _id: c._id,
            isGroup: true,
            name: c.name || "Group Chat",
            lastMessage: c.lastMessage || "",
            lastMessageSender: c.lastMessageSender || "",
            lastMessageSenderName: c.lastMessageSenderName || "",
            lastMessageTime: c.lastMessageTime || "",
            imageUrl: c.imageUrl || "",
          };
        }
        return null;
      })
      .filter(Boolean);
  };

  const normalizeGroups = (groups = []) => {
    const myId = JSON.parse(localStorage.getItem("user"))._id;
    return groups.map((g) => {
      const isYou = String(g.lastMessageSender) === String(myId);
      const preview = g.lastMessage
        ? isYou
          ? `You: ${g.lastMessage}`
          : `${g.lastMessageSenderName || "User"}: ${g.lastMessage}`
        : "No messages yet";

      return {
        _id: g._id,
        isGroup: true,
        name: g.name || g.title || "New Group",
        lastMessage: g.lastMessage || "",
        lastMessageSender: g.lastMessageSender || "",
        lastMessageSenderName: g.lastMessageSenderName || "",
        lastMessagePreview: preview,
        lastMessageTime: g.lastMessageTime || "",
        imageUrl: g.imageUrl || [],
        admins: g.admins || [],
      };
    });
  };

  const loadConversations = async () => {
    try {
      const raw = await getConversations();
      const me = user?._id;
      const normalized = normalizeConversations(raw, me);
      setConversations(normalized);
    } catch (err) {
      console.error("Failed loading conversations", err);
      setConversations([]);
    }
  };

  const loadGroups = async () => {
    try {
      const raw = await getUserGroups();
      const normalized = normalizeGroups(raw);
      setGroups(normalized);
    } catch (err) {
      console.error("Failed loading groups", err);
      setGroups([]);
    }
  };

  const handleNewConversationCreated = (convo) => {
    setConversations((prev) => [convo, ...prev.filter((c) => c._id !== convo._id)]);
    onSelectChat(convo);
  };

  return (
    <div
      className="w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 
      flex flex-col h-full
      max-sm:absolute max-sm:left-0 max-sm:top-16 
      max-sm:w-full max-sm:h-[calc(100%-64px)] max-sm:z-30 "
    >
      {/* header */}
      <div className="p-2 border-b border-gray-200 dark:border-gray-700">

        {/* tabs */}
        <div className="m-1 flex gap-2">
          <button
            onClick={() => setActiveTab("chats")}
            className={`flex-1 py-1 rounded ${activeTab === "chats" ? "bg-gray-200 dark:bg-gray-500 text-blue-600" : "text-gray-500"}`}
          >
            People
          </button>

          <button
            onClick={() => setActiveTab("groups")}
            className={`flex-1 py-1 rounded ${activeTab === "groups" ? "bg-gray-200 dark:bg-gray-500 text-blue-600" : "text-gray-500"}`}
          >
            Groups
          </button>
        </div>
      </div>

      {/* list */}
      <div className="flex-1 overflow-y-auto p-2">
        {activeTab === "chats" ? (
          <>
            <button onClick={() => setShowNewChat(true)} className="w-full bg-blue-600 text-white py-2 mb-3 rounded">
              + New Chat
            </button>

            {conversations.length === 0 ? (
              <p className="text-center text-gray-500 mt-6">No chats yet. Click "New Chat" to start.</p>
            ) : (
              conversations.map((c) => <ConversationItem key={c._id || c.otherUser?._id} convo={c} onClick={() => onSelectChat(c)} />)
            )}
          </>
        ) : (
          <>
            <button
              onClick={() => document.dispatchEvent(new CustomEvent("open-group-modal"))}
              className="w-full bg-blue-600 text-white py-2 mb-3 rounded"
            >
              + Create Group
            </button>

            {groups.length === 0 ? (
              <p className="text-center text-gray-500 mt-6">You are not in any groups.</p>
            ) : (
              groups.map((g) => (
                <div key={g._id} onClick={() => onSelectChat({ ...g, isGroup: true, members: g.members || [] })}>
                  <ConversationItem
                    convo={{
                      ...g,
                      name: g.name,
                      lastMessage: g.lastMessage || "",
                      lastMessageSender: g.lastMessageSender || "",
                      lastMessageSenderName: g.lastMessageSenderName || "",
                      lastMessageTime: g.lastMessageTime || "",
                      admins: g.admins || [],
                    }}
                  />
                </div>
              ))
            )}
          </>
        )}
      </div>

      {showNewChat && <NewChatModal onClose={() => setShowNewChat(false)} onConversationCreated={handleNewConversationCreated} />}
    </div>
  );
}