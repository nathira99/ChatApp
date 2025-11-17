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
    origin: ["http://localhost:5173", "https://chatapp90.netlify.app"],
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

const allowedOrigins = ["http://localhost:5173", "https://chatapp90.netlify.app"];

// ✅ Static file handler with proper MIME for media
app.use(
  "/uploads",
  (req, res, next) => {
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    }
    res.header("Cross-Origin-Resource-Policy", "cross-origin");
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
