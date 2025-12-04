const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getConversations,
  startChat,
  getRecentChats,
  resetPrivateUnread
} = require("../controllers/conversationController");

// GET recent chats
router.get("/", protect, getConversations);
router.get("/recent", protect, getRecentChats);
router.post("/", protect, startChat);

console.log('Protect type:', typeof protect);
console.log('resetPrivateUnread type:', typeof resetPrivateUnread);
router.put("/:convoId/unread/reset", protect, resetPrivateUnread);


module.exports = router;