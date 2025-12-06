const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  filename: (req, file, cb) => {
    const ext = file.originalname.split(".").pop();
    const unique = Date.now()+ "-" + Math.round(Math.random() * 1E9);
    cb(null, `${unique}.${ext}`);
  },
});

module.exports = multer({ storage });