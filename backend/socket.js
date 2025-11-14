const { Server } = require("socket.io");

// In-memory user tracking (userId → socketId)
const onlineUsers = new Map();

const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173", // frontend origin
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("⚡ User connected:", socket.id);

    // 🟢 User comes online
    socket.on("user:online", (userId) => {
      if (!userId) return;
      onlineUsers.set(userId, socket.id);
      console.log(`🟢 User ${userId} connected`);
      io.emit("users:online", Array.from(onlineUsers.keys()));
    });

    // 💬 Direct Message
    socket.on("message:send", (data) => {
      console.log("📨 Direct message:", data);
      const receiverSocketId = onlineUsers.get(data.receiver);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("message:receive", data);
      }
      // echo back to sender
      socket.emit("message:receive", data);
    });

    socket.on("join", (userId) => {
      socket.join(userId);
      console.log(`👥 Joined chat: ${userId}`);
    })

    // 👥 Group join & leave
    socket.on("join:group", (groupId) => {
      socket.join(groupId);
      console.log(`👥 Joined group: ${groupId}`);
    });

    socket.on("leave:group", (groupId) => {
      socket.leave(groupId);
      console.log(`🚪 Left group: ${groupId}`);
    });

    // 💭 Group messages
    socket.on("group:message:send", (data) => {
      io.to(data.group).emit("group:message:receive", data);
      console.log("💬 Group message sent:", data.group);
    });

    // 🧩 Profile update broadcast (when user updates profile)
    socket.on("user:profile:update", (updatedUser) => {
      io.emit("user:profile:update", updatedUser);
      console.log(`🧩 User profile updated: ${updatedUser.name}`);
    });

    // 🔄 Status change (online, offline, busy, etc.)
    socket.on("user:status:update", ({ userId, status }) => {
      io.emit("user:status:update", { userId, status });
      console.log(`⚙ Status updated: ${userId} → ${status}`);
    });

    // 🔴 On disconnect
    socket.on("disconnect", () => {
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          console.log(`🔴 User ${userId} disconnected`);
          break;
        }
      }
      io.emit("users:online", Array.from(onlineUsers.keys()));
    });
  });

  console.log("✅ Socket.io initialized successfully");
  return io;
};

module.exports = initSocket;