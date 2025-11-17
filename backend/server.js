const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const { createServer } = require("http");
const initSocket = require("./socket");
const path = require("path");
const fs = require("fs");

dotenv.config();
connectDB();

const app = express();

// ✅ CORS setup
app.use(
  cors({
    origin: "http://localhost:5173", "https://chatapp90.netlify.app/login",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    exposedHeaders: ["Content-Disposition"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Initialize HTTP + Socket.io
const server = createServer(app);
const io = initSocket(server);

// ✅ Make io accessible to controllers
const groupController = require("./controllers/groupController");
groupController.setIO(io);
app.set("io", io);

// ✅ Static file handler with proper MIME for media
app.use(
  "/uploads",
  (req, res, next) => {
    const filePath = path.join(__dirname, "uploads", req.url);

    // ✅ Audio MIME correction
    if (filePath.endsWith(".m4a")) res.type("audio/mp4");
    else if (filePath.endsWith(".mp3")) res.type("audio/mpeg");
    else if (filePath.endsWith(".ogg") || filePath.endsWith(".opus"))
      res.type("audio/ogg"); // ✅ opus uses ogg container
    else if (filePath.endsWith(".mp4")) res.type("video/mp4");

    res.header("Cross-Origin-Resource-Policy", "cross-origin");
    res.header("Access-Control-Allow-Origin", "http://localhost:5173");
    next();
  },
  express.static(path.join(__dirname, "uploads"))
);


// ✅ API routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/messages", require("./routes/messageRoutes"));
app.use("/api/groups", require("./routes/groupRoutes"));
app.use("/api/reports", require("./routes/reportRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/conversations", require("./routes/conversationRoutes"));

// ✅ Server start
const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);
