const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "..", "uploads"));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const unique = Date.now()+ "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + ext);
  },
});

module.exports = multer({ storage });