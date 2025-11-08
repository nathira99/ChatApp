const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  createGroup,
  getGroups,
  sendGroupMessage,
  getGroupMessages,
} = require("../controllers/groupController");

// ✅ Create a new group
router.post("/", protect, createGroup);

// ✅ Get all groups for logged-in user
router.get("/", protect, getGroups);

// ✅ Get messages for a specific group
router.get("/:groupId/messages", protect, getGroupMessages);

// ✅ Send a message to a specific group
router.post("/:groupId/messages", protect, sendGroupMessage);

module.exports = router;
