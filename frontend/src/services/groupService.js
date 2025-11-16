import api from "./api"; 

// ---------------- TOKEN HEADER ----------------
const tokenHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
});

// ---------------- GET ALL GROUPS ----------------
export const getGroups = async () => {
  const res = await api.get("/groups", tokenHeader());
  return res.data;
};

// ---------------- CREATE GROUP ----------------
export const createGroup = async (name, members, description = "") => {
  const res = await api.post(
    "/groups",
    { name, description, members },
    tokenHeader()
  );
  return res.data;
};

// ---------------- GET GROUP MESSAGES ----------------
export const getGroupMessages = async (groupId) => {
  const res = await api.get(`/groups/${groupId}/messages`, tokenHeader());
  return res.data;
};

// ---------------- SEND GROUP MESSAGE ----------------
export const sendGroupMessage = async (groupId, content) => {
  const res = await api.post(
    `/groups/${groupId}/messages`,
    { content },
    tokenHeader()
  );
  return res.data;
};

// ---------------- ADD MEMBER ----------------
export const addGroupMember = async (groupId, userId) => {
  const res = await api.post(
    `/groups/${groupId}/add-member`,
    { userId },
    tokenHeader()
  );
  return res.data;
};

// ---------------- REMOVE MEMBER ----------------
export const removeGroupMember = async (groupId, userId) => {
  const res = await api.post(
    `/groups/${groupId}/remove-member`,
    { userId },
    tokenHeader()
  );
  return res.data;
};

// ---------------- GROUP DETAILS ----------------
export const getGroupDetails = async (groupId) => {
  const res = await api.get(`/groups/${groupId}`, tokenHeader());
  return res.data;
};

// ---------------- EXIT GROUP ----------------
export const exitGroup = async (groupId) => {
  const res = await api.post(`/groups/${groupId}/exit`, {}, tokenHeader());
  return res.data;
};

// ---------------- DELETE GROUP ----------------
export const deleteGroup = async (groupId) => {
  const res = await api.delete(`/groups/${groupId}`, tokenHeader());
  return res.data;
};

export const uploadGroupFile = async (groupId, file) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await api.post(
    `/groups/${groupId}/upload`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "multipart/form-data",
      }
    }
  );

  return res.data;
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
  uploadGroupFile
};