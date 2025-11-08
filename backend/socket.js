const { Server } = require("socket.io");

// Store online users (userId → socketId)
const onlineUsers = new Map();

const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173", // your frontend
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("⚡ User connected:", socket.id);

    // ✅ Track when user goes online
    socket.on("user:online", (userId) => {
      if (userId) {
        onlineUsers.set(userId, socket.id);
        console.log(`🟢 User ${userId} connected`);
        io.emit("users:online", Array.from(onlineUsers.keys()));
      }
    });

    // ✅ Direct Message
    socket.on("message:send", (data) => {
      console.log("📨 Direct message:", data);

      const receiverSocketId = onlineUsers.get(data.receiver);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("message:receive", data);
      }

      // Also show the message to sender (for instant feedback)
      socket.emit("message:receive", data);
    });

    // ✅ Typing indicator for 1-to-1 chat
    socket.on("user:typing", ({ senderId, receiverId, typing }) => {
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("user:typing", { senderId, typing });
      }
    });

    // ✅ Group join / leave
    socket.on("join:group", (groupId) => {
      socket.join(groupId);
      console.log(`👥 User joined group: ${groupId}`);
    });

    socket.on("leave:group", (groupId) => {
      socket.leave(groupId);
      console.log(`🚪 User left group: ${groupId}`);
    });

    // ✅ Group messaging
    socket.on("group:message:send", (data) => {
      io.to(data.group).emit("group:message:receive", data);
      console.log("💬 Group message:", data);
    });

    // ✅ Group typing events
    socket.on("group:typing", ({ groupId, user }) => {
      socket.to(groupId).emit("group:typing:start", user);
    });

    socket.on("group:stopTyping", ({ groupId, user }) => {
      socket.to(groupId).emit("group:typing:stop", user);
    });

    // ✅ On disconnect
    socket.on("disconnect", () => {
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          break;
        }
      }
      console.log("🔴 User disconnected:", socket.id);
      io.emit("users:online", Array.from(onlineUsers.keys()));
    });
  });

  console.log("✅ Socket.io initialized successfully");

  return io;
};

module.exports = initSocket;
