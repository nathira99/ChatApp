// services/chatService.js
import api from "./api";

/**
 * Expectation:
 * - /conversations should return Conversation documents with members populated
 * - fallback will build conversations from recent messages
 */

const tokenHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});


export const getConversations = async () => {
  try {
    const res = await api.get("/conversations", tokenHeader());
    return res.data || [];
  } catch (err) {
    // fallback: try to build from recent messages
    try {
      const r = await api.get("/messages/recent", tokenHeader());
      const messages = r.data || [];
      const me = JSON.parse(localStorage.getItem("user"))?._id;
      const map = new Map();

      for (const m of messages) {
        if (m.group) continue; // skip groups here
        const partnerId =
          m.sender && m.sender._id === me
            ? (typeof m.receiver === "string" ? m.receiver : m.receiver?._id)
            : m.sender?._id;

        if (!partnerId) continue;
        const existing = map.get(partnerId) || {
          _id: partnerId,
          isGroup: false,
          otherUser: {
            _id: partnerId,
            name: (m.sender && m.sender._id === partnerId ? m.sender?.name : m.receiver?.name) || "Unknown",
            avatar: (m.sender && m.sender._id === partnerId ? m.sender?.avatar : m.receiver?.avatar) || "",
          },
          lastMessage: "",
          lastMessageSender: "",
          lastMessageTime: "",
        };

        // update last message if newer
        if (!existing.lastMessageTime || new Date(m.createdAt) > new Date(existing.lastMessageTime)) {
          existing.lastMessage = m.content || "";
          existing.lastMessageSender = m.sender?.name || (m.sender?._id === me ? "You" : "");
          existing.lastMessageTime = m.createdAt;
        }

        map.set(partnerId, existing);
      }

      return Array.from(map.values());
    } catch (e) {
      console.error("Failed to build conversations fallback", e);
      return [];
    }
  }
};

export const getUserGroups = async () => {
  const res = await api.get("/groups/my", tokenHeader());
  return res.data || [];
};

export const searchUsers = async (q) => {
  const res = await api.get(`/users?search=${encodeURIComponent(q)}`, tokenHeader());
  return res.data || [];
};

export const createConversation = async (userId) => {
  const res = await api.post("/conversations", { userId }, tokenHeader());
  return res.data;
};