import api from "./api"; // ✅ pre-configured axios instance

// ✅ Get all groups for the logged-in user
export const getGroups = async () => {
  const token = localStorage.getItem("token");
  const res = await api.get("/groups", {
    headers: { Authorization: `Bearer ${token}` },
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

export const getGroupMessages = async (groupId) => {
  const token = localStorage.getItem("token");
  const res = await api.get(`/messages/group/${groupId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const sendGroupMessage = async (groupId, content) => {
  const token = localStorage.getItem("token");
  const res = await api.post(
    "/messages/group",
    { groupId, content },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};
