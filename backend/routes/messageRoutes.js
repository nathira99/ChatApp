const express = require("express");
const router = express.Router();
const { sendMessage, getMessages, sendFileMessage } = require("../controllers/messageController");
const { protect } = require("../middleware/authMiddleware");
const multer = require("multer");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

const upload = multer({ storage });

// 🔹 Routes
router.post("/", protect, sendMessage);
router.get("/:userId", protect, getMessages);
router.post("/upload", protect, upload.single("file"), sendFileMessage);

module.exports = router;
