// server.js
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const { createServer } = require("http");
const initSocket = require("./socket");
const path = require("path");

dotenv.config();
connectDB();

const app = express();

// ✅ enable CORS for frontend
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

const server = createServer(app);

const io = initSocket(server);
const groupController = require("./controllers/groupController");
groupController.setIO(io);

// ✅ your routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/messages", require("./routes/messageRoutes"));
app.use("/api/groups", require("./routes/groupRoutes"));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
