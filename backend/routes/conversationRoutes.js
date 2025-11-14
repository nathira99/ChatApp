const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  startChat,
  getOrCreateConversation,
  getConversations,
  startChatController,
  getRecentChats
} = require("../controllers/conversationController");

// GET recent chats
router.get("/", protect, getConversations);
router.get("/recent", protect, getRecentChats);
router.post("/start", protect, startChatController);

// CREATE new chat or return existing
router.post("/", protect, startChat);

// GET or create conversation
router.get("/:userId", protect, getOrCreateConversation);

module.exports = router;