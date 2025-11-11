const express = require("express");
const router = express.Router();
const multer = require("multer");
const { protect } = require("../middleware/authMiddleware");
const {
  createGroup,
  getGroups,
  sendGroupMessage,
  getGroupMessages,
  getGroupDetails,
  addMember,
  removeMember,
  exitGroup,
  deleteGroup,
  requestJoin,
  handleJoinRequest,
  uploadGroupFile,
} = require("../controllers/groupController");

// 🔹 Multer setup for group file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "_")),
});
const upload = multer({ storage });

// ✅ Create new group
router.post("/", protect, createGroup);

// ✅ Fetch all groups for the logged-in user
router.get("/", protect, getGroups);

// ✅ Get details of one group
router.get("/:id", protect, getGroupDetails);

// ✅ Delete group (creator only)
router.delete("/:id", protect, deleteGroup);

// ✅ Exit group (any member)
router.post("/:id/exit", protect, exitGroup);

// ✅ Add or remove members
router.post("/:groupId/add-member", protect, addMember);
router.delete("/:groupId/remove-member/:memberId", protect, removeMember);

// ✅ Join request system
router.post("/:groupId/join", protect, requestJoin);
router.post("/:groupId/manage-request", protect, handleJoinRequest);

// ✅ Group messages
router.get("/:groupId/messages", protect, getGroupMessages);
router.post("/:groupId/messages", protect, sendGroupMessage);

// ✅ Upload a file to the group chat
router.post("/:groupId/upload", protect, upload.single("file"), uploadGroupFile);

module.exports = router;
