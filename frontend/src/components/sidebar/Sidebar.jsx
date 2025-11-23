import React, { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { getConversations, getUserGroups } from "../../services/chatService";
import ConversationItem from "./ConversationItem";
import NewChatModal from "./NewChatModal";
import { useSocket } from "../../context/SocketContext";

export default function Sidebar({ onSelectChat }) {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [activeTab, setActiveTab] = useState("chats");
  const [conversations, setConversations] = useState([]);
  const [groups, setGroups] = useState([]);
  const [showNewChat, setShowNewChat] = useState(false);

  /* ----------------------------------------------
     Load Conversations & Groups
  ---------------------------------------------- */
  const loadConversations = async () => {
    try {
      const raw = await getConversations();
      const me = user?._id;

      const normalized = (raw || [])
        .map((c) => {
          if (!c) return null;

          // Private Chat
          if (Array.isArray(c.members)) {
            const other = c.members.find((m) => m && String(m._id) !== String(me));
            if (!other && !c.isGroup) return null;

            return {
              _id: c._id || other?._id,
              isGroup: c.isGroup || false,
              otherUser: other || null,
              name: c.isGroup ? c.name : other?.name || "Unknown",
              lastMessage: c.lastMessage || "",
              lastMessageTime: c.lastMessageTime || c.updatedAt || "",
            };
          }

          // Simple private chat structure
          if (c.otherUser) {
            return {
              _id: c._id || c.otherUser._id,
              isGroup: false,
              otherUser: c.otherUser,
              name: c.otherUser.name || "Unknown",
              lastMessage: c.lastMessage || "",
              lastMessageTime: c.lastMessageTime || "",
            };
          }

          // Group Chat
          if (c.isGroup) {
            return {
              _id: c._id,
              isGroup: true,
              name: c.name || "Group Chat",
              lastMessage: c.lastMessage || "",
              lastMessageTime: c.lastMessageTime || "",
            };
          }

          return null;
        })
        .filter(Boolean);

      setConversations(normalized);
    } catch {
      setConversations([]);
    }
  };

  const loadGroups = async () => {
    try {
      const raw = await getUserGroups();
      const me = user?._id;

      const normalized = (raw || []).map((g) => {
        const isYou = String(g.lastMessageSender) === String(me);

        return {
          _id: g._id,
          isGroup: true,
          name: g.name || "New Group",
          lastMessage: g.lastMessage || "",
          lastMessageTime: g.lastMessageTime || "",
          lastMessageSenderName: g.lastMessageSenderName || "",
          lastMessagePreview: g.lastMessage
            ? isYou
              ? `You: ${g.lastMessage}`
              : `${g.lastMessageSenderName}: ${g.lastMessage}`
            : "No messages yet",
          admins: g.admins || [],
        };
      });

      setGroups(normalized);
    } catch {
      setGroups([]);
    }
  };

  /* Load initial */
  useEffect(() => {
    loadConversations();
    loadGroups();
  }, []);

  /* ----------------------------------------------
     REAL-TIME LIVE UPDATE FOR SIDEBAR
  ---------------------------------------------- */
  useEffect(() => {
    if (!socket) return;

    const refresh = () => {
      loadConversations();
      loadGroups();
    };

    socket.on("message:receive", refresh);
    socket.on("group:message:receive", refresh);
    socket.on("users:online", refresh);
    socket.on("users:refresh", refresh);
    socket.on("groups:refresh", refresh);

    return () => {
      socket.off("message:receive", refresh);
      socket.off("group:message:receive", refresh);
      socket.off("users:online", refresh);
      socket.off("users:refresh", refresh);
      socket.off("groups:refresh", refresh);
    };
  }, [socket]);

  /* ----------------------------------------------
     When new chat created
  ---------------------------------------------- */
  const handleNewConversationCreated = (convo) => {
    setConversations((prev) => [
      convo,
      ...prev.filter((c) => c._id !== convo._id),
    ]);

    onSelectChat(convo);
  };

  /* ----------------------------------------------
     UI
  ---------------------------------------------- */
  return (
    <div className="w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full max-sm:absolute max-sm:left-0 max-sm:top-16 max-sm:w-full max-sm:h-[calc(100%-64px)] max-sm:z-30">

      {/* Tabs */}
      <div className="p-2 border-b border-gray-200 dark:border-gray-700">
        <div className="m-1 flex gap-2">
          <button
            onClick={() => setActiveTab("chats")}
            className={`flex-1 py-1 rounded ${
              activeTab === "chats"
                ? "bg-gray-200 dark:bg-gray-500 dark:text-white text-blue-600"
                : "text-gray-500"
            }`}
          >
            People
          </button>

          <button
            onClick={() => setActiveTab("groups")}
            className={`flex-1 py-1 rounded ${
              activeTab === "groups"
                ? "bg-gray-200 dark:bg-gray-500 dark:text-white text-blue-600"
                : "text-gray-500"
            }`}
          >
            Groups
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-2">
        {activeTab === "chats" ? (
          <>
            <button
              onClick={() => setShowNewChat(true)}
              className="w-full bg-blue-600 text-white py-2 mb-3 rounded"
            >
              + New Chat
            </button>

            {conversations.length === 0 ? (
              <p className="text-center text-gray-500 mt-6">
                No chats yet. Click "New Chat" to start.
              </p>
            ) : (
              conversations.map((c) => (
                <ConversationItem
                  key={c._id}
                  convo={c}
                  onClick={() => onSelectChat(c)}
                />
              ))
            )}
          </>
        ) : (
          <>
            <button
              onClick={() =>
                document.dispatchEvent(new CustomEvent("open-group-modal"))
              }
              className="w-full bg-blue-600 text-white py-2 mb-3 rounded"
            >
              + Create Group
            </button>

            {groups.length === 0 ? (
              <p className="text-center text-gray-500 mt-6">
                You are not in any groups.
              </p>
            ) : (
              groups.map((g) => (
                <div
                  key={g._id}
                  onClick={() =>
                    onSelectChat({ ...g, isGroup: true, members: g.members || [] })
                  }
                >
                  <ConversationItem convo={g} />
                </div>
              ))
            )}
          </>
        )}
      </div>

      {showNewChat && (
        <NewChatModal
          onClose={() => setShowNewChat(false)}
          onConversationCreated={handleNewConversationCreated}
        />
      )}
    </div>
  );
}
