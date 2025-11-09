const express = require("express");
const router = express.Router();
const multer = require("multer");
const { protect } = require("../middleware/authMiddleware");
const {
  createGroup,
  getGroups,
  sendGroupMessage,
  getGroupMessages,
  addMember,
  removeMember,
  requestJoin,
  handleJoinRequest,
  uploadGroupFile
} = require("../controllers/groupController");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "_")),
});
const upload = multer({ storage });

// ✅ Create a new group
router.post("/", protect, createGroup);

// ✅ Get all groups for logged-in user
router.get("/", protect, getGroups);

// ✅ Get messages for a specific group
router.get("/:groupId/messages", protect, getGroupMessages);

// ✅ Send a message to a specific group
router.post("/:groupId/messages", protect, sendGroupMessage);
router.post("/:groupId/add-member", protect, addMember);
router.post("/:groupId/remove-member", protect, removeMember);
router.post("/:groupId/join", protect, requestJoin);
router.post("/:groupId/manage-request", protect, handleJoinRequest);
router.post("/:groupId/upload", protect, upload.single("file"), uploadGroupFile);

module.exports = router;
