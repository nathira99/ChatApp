const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const upload = require("../utils/uploads")

const {
  sendMessage,
  getMessages,
  sendFileMessage,
  clearChat
} = require("../controllers/messageController");

router.post("/", protect, sendMessage);
router.get("/:userId", protect, getMessages);

// Cloudinary upload
router.post("/upload", protect, upload.single("file"), sendFileMessage);

router.delete("/clear", protect, clearChat);

module.exports = router;