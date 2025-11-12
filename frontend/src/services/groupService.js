import api from "./api"; // ✅ pre-configured axios instance

// ✅ Get all groups for the logged-in user
export const getGroups = async () => {
  const token = localStorage.getItem("token");
  const res = await api.get("/groups", {
    headers: { Authorization: `Bearer ${token}`},
  });
  return res.data;
};

// ✅ Create new group
export const createGroup = async (name, members, description = "") => {
  const token = localStorage.getItem("token");
  const res = await api.post(
    "/groups",
    { name, description, members },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};

// ✅ Get messages from a group
export const getGroupMessages = async (groupId) => {
  const token = localStorage.getItem("token");
  const res = await api.get(`/groups/${groupId}/messages`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// ✅ Send a message to a group
export const sendGroupMessage = async (groupId, content) => {
  const token = localStorage.getItem("token");
  const res = await api.post(
    `/groups/${groupId}/messages`,
    { content },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};

const tokenHeader = () => (
  { 
    headers: 
    { Authorization: `Bearer("token")`}});

// Admin adds member
export const addGroupMember = async (groupId, userId) => {
  if (!groupId || !userId) throw new Error("groupId and userId required");
  const res = await api.post(`/groups/${groupId}/add-member`, { userId }, tokenHeader());
  return res.data;
};

// Admin removes member
export const removeGroupMember = async (groupId, userId) => {
  if (!groupId || !userId) throw new Error("groupId and userId required");
  const res = await api.post(`/groups/${groupId}/remove-member`, { userId }, tokenHeader());
  return res.data;
};

// Get updated single group (useful after add/remove)
export const getGroupDetails = async (groupId) => {
  const res = await api.get(`/groups/${groupId}, tokenHeader()`);
  return res.data;
};

export default {
  addGroupMember,
  removeGroupMember,
  getGroupDetails,
};

// ✅ Exit group (any user)
export const exitGroup = async (groupId) => {
  const token = localStorage.getItem("token");
  const { data } = await api.post(
    `/groups/${groupId}/exit`,
    {},
    { headers: { Authorization: `Bearer ${token}`} }
  );
  return data;
};

// ✅ Delete group (admin only)
export const deleteGroup = async (groupId) => {
  const token = localStorage.getItem("token");
  const { data } = await api.delete(`/groups/${groupId}`, {
    headers: { Authorization: `Bearer ${token}`},
  });
  return data;
};

export const groupService = {
  getGroups,
  createGroup,
  getGroupMessages,
  sendGroupMessage,
  addGroupMember,
  removeGroupMember,
  getGroupDetails,
  exitGroup,
  deleteGroup,
};