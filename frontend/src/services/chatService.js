// services/chatService.js
import api from "./api";

// Attach auth token
const tokenHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

// ==============================
// GET 1-to-1 + Group Conversations
// ==============================
export const getConversations = async () => {
  try {
    const res = await api.get("/api/conversations", tokenHeader());
    return res.data || [];
  } catch (err) {
    console.error("❌ getConversations error:", err);
    return [];
  }
};

// ==============================
// GET User Groups
// ==============================
export const getUserGroups = async () => {
  const res = await api.get("/api/groups/my", tokenHeader());
  return res.data || [];
};

// ==============================
// SEARCH USERS
// ==============================
export const searchUsers = async (q) => {
  const res = await api.get(
    `/api/users?search=${encodeURIComponent(q)}`,
    tokenHeader()
  );
  return res.data || [];
};

// ==============================
// START NEW CONVERSATION
// ==============================
export const createConversation = async (userId) => {
  const res = await api.post(
    "/api/conversations",
    { userId },
    tokenHeader()
  );
  return res.data;
};