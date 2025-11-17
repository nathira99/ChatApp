// src/context/AuthContext.jsx
import React, { useContext,createContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // Load user from localStorage on mount
  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      const userData = localStorage.getItem("user");
      console.log("Auth user state changed:", user);
      
      if (token && userData && userData !== "undefined") {
        const parsed = JSON.parse(userData);
        if (parsed && parsed._id) {
          setUser(parsed);
        } else {
          // malformed stored user: clear it
          localStorage.removeItem("user");
          localStorage.removeItem("token");
        }
      }
    } catch (err) {
      console.error("AuthContext: failed reading localStorage user:", err);
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    }
  }, []);

  // Normalize login/register responses and persist
  const persistAuth = (data) => {
    // data might be { user: {...}, token } or { _id, name, email, token }
    const userObj = data.user ? data.user : ((data._id && data.name) ? {
      _id: data._id,
      name: data.name,
      email: data.email,
      avatar: data.avatar,
      isAdmin: data.isAdmin,
    } : null);

    const token = data.token ? data.token : data?.accessToken ?? null;

    if (!userObj || !token) {
      throw new Error("Invalid auth response shape");
    }

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userObj));
    setUser(userObj);
  };

  const login = async (email, password) => {
    try {
      const data = await authService.login(email, password);
      persistAuth(data);
      navigate("/");
      return data;
    } catch (err) {
      console.error("Login failed:", err);
      throw err;
    }
  };

  const register = async (name, email, password) => {
    try {
      const data = await authService.register(name, email, password);
      persistAuth(data);
      navigate("/");
      return data;
    } catch (err) {
      console.error("Registration failed:", err);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
  };

  const updateUser = (data) => {
    setUser((prev) => {
      const updated = {...prev, ...data};
    localStorage.setItem("user", JSON.stringify(updated));
    return updated;
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
