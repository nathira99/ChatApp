// src/services/authService.js
import api from "./api";

export const authService = {
  login: async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    // Backend returns { _id, name, email, token } — normalize:
    const data = res.data;
    const user = data.user ? data.user : {
      _id: data._id,
      name: data.name,
      email: data.email,
      avatar: data.avatar,
      isAdmin: data.isAdmin,
    };
    const token = data.token;
    return { user, token };
  },

  register: async (name, email, password) => {
    const res = await api.post("/auth/register", { name, email, password });
    window.location.href = "/login";
    const data = res.data;
    const user = data.user ? data.user : {
      _id: data._id,
      name: data.name,
      email: data.email,
      avatar: data.avatar,
      isAdmin: data.isAdmin,
    };
    // const token = data.token;
    return { user };
  },

  forgotPassword: async (email) => {
    const res = await api.post("/auth/forgot-password", { email });
    return res.data;
  },

  resetPassword: async (token, password) => {
    const res = await api.post(`auth/reset-password/${token}`, { token, password });
    return res.data;
  },

  getCurrentUser: async () => {
    const res = await api.get("/auth/me");
    return res.data;
  },

  updateUser: async (data) => {
    const form = new FormData(data);

    if(data.avatarFile) form.append("avatar", data.avatarFile);
    if(data.name) form.append("name", data.name);
    if(data.about) form.append("about", data.about);
    if(data.status) form.append("status", data.status);

    const res = await api.put("/auth/upload/profile", form, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return res.data;
  },
};
