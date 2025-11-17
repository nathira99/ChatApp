const path = require("path");
const express = require("express");
require("dotenv").config();
const sendEmail = require("./utils/sendEmail");
const cors = require("cors");
const connectDB = require("./config/db");
const { createServer } = require("http");
const initSocket = require("./socket");
const fs = require("fs");

// dotenv.config();
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

// --- quick test route: POST /utils/test-send
app.post("/utils/test-send", async (req, res) => {
  try {
    // test target: prefer body.to, fallback to SMTP_USER
    const to = (req.body && req.body.to) || process.env.SMTP_USER;
    const subject = "ChatApp — test email";
    const html = `<p>This is a test email from ChatApp at ${new Date().toISOString()}</p>`;

    if (!to) {
      return res.status(400).json({ error: "No recipient provided and SMTP_USER not set" });
    }

    const info = await sendEmail(to, subject, html);
    console.log("✅ test-send success:", info);
    res.json({ ok: true, info });
  } catch (err) {
    console.error("❌ test-send error:", err && err.stack ? err.stack : err);
    res.status(500).json({ error: err.message || "send failed", stack: err.stack });
  }
});

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
