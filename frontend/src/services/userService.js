// services/userService.js
import api from "./api";

/* ------------------------------------------------------
   BLOCK USER
------------------------------------------------------- */
export const blockUser = async (userId) => {
  const res = await api.post(`/users/block/${userId}`);
  return res.data;
};

/* ------------------------------------------------------
   UNBLOCK USER
------------------------------------------------------- */
export const unblockUser = async (userId) => {
  const res = await api.delete(`/users/block/${userId}`);
  return res.data;
};

/* ------------------------------------------------------
   REPORT USER
------------------------------------------------------- */
export const reportUser = async (userId, reason) => {
  const res = await api.post(`/users/report/${userId}`, { reason }); 
  return res.data;
};