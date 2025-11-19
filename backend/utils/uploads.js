const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("./cloudinary");

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: "chatapp_uploads",
    resource_type: "auto",
    allowed_formats: [
      "jpg",
      "png",
      "jpeg",
      "gif",
      "mp4",
      "mp3",
      "wav",
      "pdf",
      "doc",
      "docx",
      "ppt",
    ],
  }),
});

const upload = multer({ storage });

module.exports = upload;