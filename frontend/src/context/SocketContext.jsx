import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [userProfiles, setUserProfiles] = useState({}); // 🧩 store all user info (avatar, status, etc.)

  useEffect(() => {
    if (socket) return;

    // connect socket
    const newSocket = io("http://localhost:5000", {
      transports: ["websocket", "polling"],
      withCredentials: true,
    });

    newSocket.on("connect", () => {
      console.log("✅ Socket connected:", newSocket.id);
      const token = localStorage.getItem("token");
      if (token) newSocket.emit("user:connected", token); // identify logged user to backend
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

  return (
    <SocketContext.Provider
      value={{
        socket,
        onlineUsers,
        userProfiles,
        updateStatus,
        broadcastProfileUpdate,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);