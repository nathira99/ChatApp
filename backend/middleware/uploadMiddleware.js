const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const path = require("path");
const fs = require("fs");
const cloudinary = require("../config/cloudinary");

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// ✅ Configure Multer storage
const storage = new CloudinaryStorage({
  cloudinary,
  params:{
    folder: "chatapp_uploads",
    allowedFormats: ["jpg", "png", "jpeg", "svg", "pdf"],
  },
});
const upload = multer({ storage });

module.exports = upload;
