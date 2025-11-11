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
  const res = await api.get(`/groups/${groupId}/messages`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const sendGroupMessage = async (groupId, content) => {
  const token = localStorage.getItem("token");
  const res = await api.post(
    `/groups/${groupId}/messages`,
    { content },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};

// ✅ Admin adds member
export const addGroupMember = async (groupId, memberId) => {
  const { data } = await api.post(`/groups/${groupId}/add-member`, { memberId });
  return data;
};

// ✅ Admin removes member
export const removeGroupMember = async (groupId, memberId) => {
  const { data } = await api.post(`/groups/${groupId}/remove-member`, { memberId });
  return data;
};

// ✅ User requests to join
export const requestGroupJoin = async (groupId) => {
  const { data } = await api.post(`/groups/${groupId}/join`);
  return data;
};

// ✅ Admin handles join request (approve/reject)
export const manageJoinRequest = async (groupId, userId, action) => {
  const { data } = await api.post(`/groups/${groupId}/manage-request`, { userId, action });
  return data;
};

export const groupService = {
  getGroupDetails: (id) => api.get(`/groups/${id}`).then((res) => res.data),
  removeMember: (groupId, memberId) =>
    api.delete(`/groups/${groupId}/members/${memberId}`).then((res) => res.data),
  exitGroup: (id) => api.post(`/groups/${id}/exit`).then((res) => res.data),
  deleteGroup: (id) => api.delete(`/groups/${id}`).then((res) => res.data),
};
