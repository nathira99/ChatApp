import api from "./api";

// ✅ Fetch direct (1-to-1) chat messages
export const getMessages = async (receiverId) => {
  const token = localStorage.getItem("token");
  const res = await api.get(`/messages/${receiverId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// ✅ Send message to another user
export const sendMessage = async (receiverId, content) => {
  const token = localStorage.getItem("token");
  const res = await api.post(
    "/messages",
    { receiverId, content },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};

// ✅ Upload and send file (images, docs)
export const uploadFileMessage = async (receiverId, file) => {
  const token = localStorage.getItem("token");
  const formData = new FormData();
  formData.append("file", file);
  formData.append("receiverId", receiverId);

  const res = await api.post("/messages/upload", formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};
