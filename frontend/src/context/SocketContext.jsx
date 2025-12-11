import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import { io } from "socket.io-client";
import { getAvatarUrl } from "../utils/avatar";
import { useAuth } from "../hooks/useAuth";

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const socketRef = useRef(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [userProfiles, setUserProfiles] = useState({});

  // load all user profiles on connect 
async function loadInitialProfiles() {
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/users/all`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    const data = await res.json();

    // save into userProfiles
    const map = {};
    data.forEach(u => {
      map[u._id] = {
        ...u,
        avatar: getAvatarUrl(u.avatar),
        status: "offline", // initial until socket updates
      };
    });

    setUserProfiles(map);

  } catch (err) {
    console.error("Error loading initial profiles:", err);
  }
}
  // --------------------- CONNECT SOCKET --------------------------
  useEffect(() => {
    // user logged out → stop socket
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
      }
      return;
    }

    // prevent double connect
    if (socketRef.current) return;

    const newSocket = io(import.meta.env.VITE_SOCKET_URL, {
      transports: ["websocket", "polling"],
      auth: { token: localStorage.getItem("token"),
        userId: JSON.parse(localStorage.getItem("user"))?._id
       },
      withCredentials: true,
      autoConnect: true,
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    // --------------------- ON CONNECT --------------------------
    newSocket.on("connect", async () => {
      loadInitialProfiles();
      // console.log("✅ Socket connected:", newSocket.id, "for user:", user._id);
      console.log("✅ Socket connected");

      newSocket.emit("register", user._id);

      // Join all groups
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/groups/my`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        const groups = await res.json();

        if (Array.isArray(groups)) {
          groups.forEach((g) => newSocket.emit("join:group", g._id));
        }
      } catch (err) {
        console.error("Group auto join failed:", err);
      }

      const token = localStorage.getItem("token");
      if (token) newSocket.emit("user:connected", token);
    });

    // --------------------- ACCOUNT EVENTS --------------------------
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

    // --------------------- ONLINE USERS --------------------------
    newSocket.on("users:online", (users) => {
      setOnlineUsers(users || []);
    });

    // --------------------- USER STATUS --------------------------
    newSocket.on("user:status", ({ userId, status }) => {
      setUserProfiles((prev) => ({
        ...prev,
        [userId]: {
          ...(prev[userId] || {}),
          status,
        },
      }));
    });

    // --------------------- STATUS UPDATE EVENTS --------------------------
    newSocket.on("user:status:update", ({ userId, status, lastSeen }) => {
      // console.log(`⚡ Status update -> User: ${userId} | Status: ${status}`);
      setUserProfiles((prev) => ({
        ...prev,
        [userId]: {
          ...(prev[userId] || {}),
          status,
          lastSeen
        },
      }));
    });

    // --------------------- PROFILE UPDATED --------------------------
    newSocket.on("user:profile:update", (updatedUser) => {
      setUserProfiles((prev) => ({
        ...prev,
        [updatedUser._id]: {
          ...(prev[updatedUser._id] || {}),
          ...updatedUser,
          avatar: getAvatarUrl(updatedUser.avatar),
        },
      }));
      // console.log("🧩 Updated user profile:", updatedUser.name);
    });

    // --------------------- DISCONNECT --------------------------
    newSocket.on("disconnect", () => {
      console.log("❌ Socket disconnected");
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
      }
    };
  }, [user]);

  // --------------------- STATUS HANDLING (online/away) --------------------------
  useEffect(() => {
    if (!socket || !user) return;

    let lastStatus = null;
    let debounceTimer = null;

    const sendStatus = (status) => {
      if (status === lastStatus) return;

      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        socket.emit("user:status:update", { userId: user._id, status });
        lastStatus = status;
      }, 500);
    };

    const onFocus = () => sendStatus("online");
    const onBlur = () => sendStatus("away");

    window.addEventListener("focus", onFocus);
    window.addEventListener("blur", onBlur);

    sendStatus("online");

    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("blur", onBlur);
    };
  }, [socket, user]);

  // --------------------- MANUAL STATUS UPDATE --------------------------
  const updateStatus = (status) => {
    if (socket && socket.connected) {
      socket.emit("user:status:update", { userId: user._id, status });
    }
  };

  // --------------------- PROFILE BROADCAST --------------------------
  const broadcastProfileUpdate = (updatedUser) => {
    if (socket && socket.connected) {
      socket.emit("user:profile:update", updatedUser);
    }
  };

  const triggerRefresh = () => setRefreshTrigger(Date.now());

  return (
    <SocketContext.Provider
      value={{
        socket,
        onlineUsers,
        userProfiles,
        updateStatus,
        broadcastProfileUpdate,
        refreshTrigger,
        triggerRefresh,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);