// backend/routes/groupRoutes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const { protect } = require("../middleware/authMiddleware");
const groupController = require("../controllers/groupController");

// multer storage (same as you used)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "_")),
});
const upload = multer({ storage });

// Create, list
router.post("/", protect, groupController.createGroup);
router.get("/", protect, groupController.getGroups);

// Group detail / update / delete / exit
router.get("/:id", protect, groupController.getGroupDetails);
router.put("/:id", protect, groupController.updateGroup);
router.delete("/:id", protect, groupController.deleteGroup);
router.post("/:id/exit", protect, groupController.exitGroup);

// group messages
router.get("/:groupId/messages", protect, groupController.getGroupMessages);
router.post("/:groupId/messages", protect, groupController.sendGroupMessage);

// membership operations (use :groupId to be explicit)
router.post("/:groupId/add-member", protect, groupController.addMember);
router.post("/:groupId/remove-member", protect, groupController.removeMember);
// router.post("/:groupId/join", protect, groupController.requestJoin);
// router.post("/:groupId/manage-request", protect, groupController.handleJoinRequest);

// upload file to group
router.post(
  "/:groupId/upload",
  protect,
  upload.single("file"),
  groupController.uploadGroupFile
);

module.exports = router;