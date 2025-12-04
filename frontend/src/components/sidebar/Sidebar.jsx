import React, { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { getConversations, getUserGroups } from "../../services/chatService";
import ConversationItem from "./ConversationItem";
import NewChatModal from "./NewChatModal";
import { useSocket } from "../../context/SocketContext";
import api from "../../services/api";
import { triggerRefresh } from "../../utils/triggerRefresh";

export default function Sidebar({ onSelectChat, openChatId }) {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [activeTab, setActiveTab] = useState("chats");
  const [conversations, setConversations] = useState([]);
  const [groups, setGroups] = useState([]);
  const [showNewChat, setShowNewChat] = useState(false);
  const [unread, setUnread] = useState({});

  // ----------------------------------------------
  // Notifications
  // ----------------------------------------------
  useEffect(() => {
    if (!socket || !user) return;

    const playSound = () => {
      const audio = new Audio("/notify.mp3");
      audio.play().catch(() => {});
    };

    const notify = (chatId, title, body) => {
      if (String(chatId) === String(openChatId)) return;

      setUnread((prev) => ({
        ...prev,
        [chatId]: (prev[chatId] || 0) + 1,
      }));

      playSound();

      if (Notification.permission === "granted") {
        new Notification(title, {
          body,
          icon: "/chat-message-heart-svgrepo-com.svg",
          tag: chatId,
          renotify: true,
        });
      }
    };

    const privateListener = (msg) => {
      const chatId = msg.conversationId;
      notify(
        chatId,
        msg.sender?.name || "New Message",
        msg.content || "Message received"
      );
    };

    const groupListener = (msg) => {
      if (msg.sender?._id === user._id) return;

      const groupId = msg.conversationId;

      if (String(openChatId) === String(groupId)) return;

      // notification only
      notify(
        groupId,
        groups.find((g) => String(g._id) === String(groupId))?.name || "Group",
        msg.sender?.name || "New Group Message",
        msg.content || "Message received"
      );
      playSound();

      // setUnread((prev) => ({
      //   ...prev,
      //   [groupId]: (prev[groupId] || 0) + 1,
      // }));

      // triggerRefresh();
      // important for unread badge
      loadGroups();
    };

    socket.on("message:receive", privateListener);
    socket.on("group:message:receive", groupListener);

    return () => {
      socket.off("message:receive", privateListener);
      socket.off("group:message:receive", groupListener);
    };
  }, [socket, user, openChatId]);

  /* ----------------------------------------------
      Load Conversations & Groups
  ---------------------------------------------- */
  const loadConversations = async () => {
    try {
      const raw = await getConversations();
      const me = user?._id;

      const normalized = (raw || []).map((c) => {
        const other = c.otherUser; // backend gives this always
        const unread = c.unread?.[me] || 0;

        setUnread((prev) => ({
          ...prev,
          [c._id]: unread,
        }));
        return {
          _id: c._id,
          conversationId: c._id,
          isGroup: false,

          // ⭐ IMPORTANT — this is the user you must message
          userId: other?._id || null,

          // ⭐ FIX: No more UNKNOWN
          name: other?.name || "Unknown",

          lastMessage: c.lastMessage || "",
          lastMessageTime: c.lastMessageTime || "",

          // ⭐ BACKEND unread Map
          unreadCount: unread,

          otherUser: other,
        };
      });

      setConversations(normalized);
    } catch (err) {
      console.error("Load conversations failed:", err);
      setConversations([]);
    }
  };

  const loadGroups = async () => {
    try {
      const raw = await getUserGroups();
      const me = user?._id;

      const normalized = (raw || []).map((g) => {
        const isYou = String(g.lastMessageSender) === String(me);

        const unread = g.unread?.[me] || 0;

        setUnread((prev) => ({
          ...prev,
          [g._id]: unread,
        }));

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
          unreadCount: unread,
          admins: g.admins || [],
        };
      });

      setGroups(normalized);
    } catch {
      setGroups([]);
    }
  };

  useEffect(() => {
    loadConversations();
    loadGroups();
  }, []);

  /* ----------------------------------------------
      REAL-TIME SIDEBAR REFRESH
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
      On new chat created
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
                  unreadCount={unread[c._id] || 0}
                  onClick={async () => {
                    try {
                      await api.put(`/conversations/${c._id}/unread/reset`);
                    } catch (err) {
                      console.error("Conversation unread reset failed:", err);
                    }
                    setUnread((prev) => ({ ...prev, [c._id]: 0 }));
                    onSelectChat(c);
                  }}
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
              groups.map((g) => {
                const groupUnread = unread[g._id] ?? g.unreadCount ?? 0;

                return (
                  <div
                    key={g._id}
                    onClick={async () => {
                      // 1️⃣ Reset backend unread
                      try {
                        await api.put(`/groups/${g._id}/unread/reset`);
                      } catch (err) {
                        console.error("Group unread reset failed:", err);
                      }
                      // setGroups((prev) =>
                      //   prev.map((x) =>
                      //     x._id === g._id ? { ...x, unreadCount: 0 } : x
                      //   )
                      // );

                      setUnread((prev) => ({ ...prev, [g._id]: 0 }));

                      onSelectChat({
                        ...g,
                        isGroup: true,
                        members: g.members || [],
                      });
                    }}
                  >
                    <ConversationItem convo={g} unreadCount={groupUnread} />
                  </div>
                );
              })
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
