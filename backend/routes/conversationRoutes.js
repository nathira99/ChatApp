const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getConversations,
  startChat,
  getRecentChats
} = require("../controllers/conversationController");

// GET recent chats
router.get("/", protect, getConversations);
router.get("/recent", protect, getRecentChats);
router.post("/", protect, startChat);


module.exports = router;