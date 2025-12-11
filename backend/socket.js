const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const { User } = require("./models/User");
const JWT_SECRET = process.env.JWT_SECRET || "secret";

// In-memory user tracking (userId → Set(socketId))
const onlineUsers = new Map();

// status string
const userStatus = new Map();

const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  const setOnline = (userId, socketId) => {
    if (!userId) return;
    const set = onlineUsers.get(userId) || new Set();
    set.add(socketId);
    onlineUsers.set(userId, set);
    userStatus.set(userId, "online");
    io.emit("user:status", { userId, status: "online" });
    io.emit("users:online", Array.from(onlineUsers.keys()));
    console.log(`⚡ Status update -> User: ${userId} | Status: ${userStatus.get(userId)}`);
  };

  const setAway = (userId) => {
    if (!userId) return;
    userStatus.set(userId, "away");
    io.emit("user:status", { userId, status: "away" });
    console.log(`⚙ Status updated: ${userId} → away`);
  };

  const setOfflineForSocket = (socketId) => {
  for (const [userId, set] of onlineUsers.entries()) {
    if (set.has(socketId)) {
      set.delete(socketId);

      const becameOffline = set.size === 0;

      if (becameOffline) {
        onlineUsers.delete(userId);
        userStatus.set(userId, "offline");
        io.emit("user:status", { userId, status: "offline" });
      } else {
        onlineUsers.set(userId, set);
      }

      io.emit("users:online", Array.from(onlineUsers.keys()));
      console.log(`🔴 User ${userId} disconnected (socket ${socketId}).`);

      return { userId, becameOffline };
    }
  }

  // ⭐ NEVER RETURN undefined — always return safe object
  return { userId: null, becameOffline: false };
};

  io.on("connection", (socket) => {
    console.log("⚡ User connected:", socket.id);
    const { token } = socket.handshake.auth;
    let userId = null;

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded.id;
      } catch (err) {
        console.error("Error verifying token:", err);
      }
    }

    socket.data.userId = userId || null;

    console.log("🟢 User connected:", socket.id, "userId:", userId);

    if (userId) {
      setOnline(userId, socket.id);
      socket.join(`user-${userId}`);
    } else {
      console.log("No UserId provided...");
    }

    // 🟢 REGISTER USER FOR TARGETED EVENTS (VERY IMPORTANT)
    socket.on("register", (userId) => {
      if (!userId) return;
      socket.data.userId = userId;
      setOnline(userId, socket.id);

      socket.join(userId);

      // PATCHED — FIXED BUG: Previously overwrote the Set
      const set = onlineUsers.get(userId) || new Set();
      set.add(socket.id);
      onlineUsers.set(userId, set);

      console.log("🟢 Registered user:", userId);
      io.emit("users:online", Array.from(onlineUsers.keys()));
    });

    // 🟢 User comes online
    socket.on("user:online", (userId) => {
      if (!userId) return;

      // PATCHED — FIXED SAME BUG
      const set = onlineUsers.get(userId) || new Set();
      set.add(socket.id);
      onlineUsers.set(userId, set);

      console.log(`🟢 User ${userId} connected`);
      io.emit("users:online", Array.from(onlineUsers.keys()));
    });

    // 💬 Direct Message
    socket.on("message:send", (data) => {
      const { receiverId, senderId } = data;

      const receiverSockets = onlineUsers.get(receiverId);
      const senderSockets = onlineUsers.get(senderId);

      if (receiverSockets) {
        for (const id of receiverSockets) {
          io.to(id).emit("message:receive", data);
          io.to(id).emit("users:refresh");
        }
      }

      if (senderSockets) {
        for (const id of senderSockets) {
          io.to(id).emit("message:receive", data);
          io.to(id).emit("users:refresh");
        }
      }
    });

    // 👥 Chat join & leave
    socket.on("join", (userId) => {
      socket.join(userId);
      console.log(`👥 Joined chat: ${userId}`);
    });

    // 👥 Group join & leave
    socket.on("join:group", (groupId) => {
      socket.join(groupId);
      console.log(`👥 Joined group: ${groupId}`);
    });

    socket.on("leave:group", (groupId) => {
      socket.leave(groupId);
      console.log(`🚪 Left group: ${groupId}`);
    });

    // 🧩 Profile update broadcast
    socket.on("user:profile:update", (updatedUser) => {
      io.emit("user:profile:update", updatedUser);
      console.log(`🧩 User profile updated: ${updatedUser.name}`);
    });

    // 🔄 Status change
    socket.on("user:status:update", ({ userId, status }) => {
      io.emit("user:status:update", { userId, status });
      console.log(`⚙ Status updated: ${userId} → ${status}`);
    });

    // 🔴 On disconnect
    socket.on("disconnect", async () => {
      // First remove socket and find out whether user actually went offline
      const { userId, becameOffline } = setOfflineForSocket(socket.id);

      if (userId && becameOffline) {
        const lastSeen = new Date();
        try {
          await User.findByIdAndUpdate(userId, {
            lastSeen,
            status: "offline",
          });

          io.emit("user:status:update", {
            userId,
            status: "offline",
            lastSeen,
          });

          console.log("Last seen saved for:", userId, lastSeen);
        } catch (err) {
          console.error("Failed to save last seen:", err);
        }
      } else if (userId) {
        // user still connected on other sockets — publish a status update if needed
        console.log(`User ${userId} disconnected one socket but still has active sockets.`);
      }

      console.log(`🔴 Socket disconnected: ${socket.id}`);
    });

    // ON AWAY STATUS
    socket.on("user:status:away", async({userId, status}) => {
      const update = { status };
      if (status === "away") update.lastSeen = new Date();

      await User.findByIdAndUpdate(userId, update);

      io.emit("user:status:update", { userId, status, lastSeen: update.lastSeen})
    });
  });

  console.log("✅ Socket.io initialized successfully");
  return io;
};

module.exports = initSocket;