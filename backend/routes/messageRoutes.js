const express = require("express");
const router = express.Router();
const multer = require("multer");
const { protect } = require("../middleware/authMiddleware");
const {
  sendMessage,
  getMessages,
  sendFileMessage,
} = require("../controllers/messageController");

// ✅ 1. Define where uploads go
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

// ✅ 2. Define allowed file types (now includes audio)
const allowedMimeTypes = [
  "image/",
  "video/",
  "audio/",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.some((type) => file.mimetype.startsWith(type))) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type"), false);
  }
};

// ✅ 3. Init multer upload middleware
const upload = multer({ storage, fileFilter });

// ✅ 4. Routes
router.post("/", protect, sendMessage);
router.get("/:userId", protect, getMessages);
router.post("/upload", protect, upload.single("file"), sendFileMessage);

module.exports = router;
