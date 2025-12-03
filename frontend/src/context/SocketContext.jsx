import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { getAvatarUrl } from "../utils/avatar";

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [userProfiles, setUserProfiles] = useState({}); // 🧩 store all user info (avatar, status, etc.)

  useEffect(() => {
    if (socket) return;

    // connect socket
    const newSocket = io(import.meta.env.VITE_SOCKET_URL, {
      transports: ["websocket", "polling"],
      withCredentials: true,
    });

    newSocket.on("connect",async () => {
      console.log("✅ Socket connected:", newSocket.id);
      const user = JSON.parse(localStorage.getItem("user"));
      if (user?._id) {
        newSocket.emit("register", user._id);
      }
      try{
        const res = await fetch(`${import.meta.env.VITE_API_URL}/groups/my`, {
          headers:{
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const groups = await res.json();
        groups.forEach(g => {
          newSocket.emit("join:group", g._id);
        })
      }catch(err){
        console.error("Group auto join failed:", err);
      }
      const token = localStorage.getItem("token");
      if (token) newSocket.emit("user:connected", token); // identify logged user to backend
    });

    newSocket.on("account:deactivated", (data) => {
      alert(data.message || "Your account has been deactivated.");
      localStorage.clear();
      window.location.href = "/register";
    });

    newSocket.on("account:deleted", (data) => {
      alert(data.message || "Your account has been deleted.");
      localStorage.clear();
      window.location.href = "/register";
    });

    newSocket.on("account:activated", (data) => {
      alert(data.message);
    });

    // 🔹 Handle online users list
    newSocket.on("users:online", (users) => {
      setOnlineUsers(users);
    });

    // 🔹 Handle real-time user profile updates
    newSocket.on("user:profile:update", (updatedUser) => {
      setUserProfiles((prev) => ({
        ...prev,
        [updatedUser._id]: {
          ...prev[updatedUser._id],
          ...updatedUser,
          avatar: getAvatarUrl(updatedUser.avatar),
        },
      }));
      console.log("🧩 Updated user profile:", updatedUser.name);
    });

    // 🔹 Handle user status changes (online/offline/busy)
    newSocket.on("user:status:update", ({ userId, status }) => {
      setUserProfiles((prev) => ({
        ...prev,
        [userId]: { ...prev[userId], status },
      }));
    });

    newSocket.on("disconnect", () => {
      console.log("❌ Socket disconnected");
    });

    setSocket(newSocket);
    return () => newSocket.close();
  }, []);

  /**
   * Emit status change (used when user goes offline/online/busy)
   */
  const updateStatus = (status) => {
    if (socket && socket.connected) {
      socket.emit("user:status:update", status);
    }
  };

  /**
   * Broadcast local profile update immediately after saving
   */
  const broadcastProfileUpdate = (updatedUser) => {
    if (socket && socket.connected) {
      socket.emit("user:profile:update", updatedUser);
    }
  };

  const triggerRefresh = () => { 
    setRefreshTrigger(Date.now());
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        onlineUsers,
        userProfiles,
        updateStatus,
        broadcastProfileUpdate,
        refreshTrigger,
        triggerRefresh
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
