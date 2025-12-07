const express = require("express");
const upload = require("../utils/uploads");
const { register, login, logout, updateProfile, getProfile } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", protect, logout);
// router.get("/verify/:token", verifyEmail);
// router.post("/forgot-password", forgotPassword);
// router.post("/reset-password/:token", resetPassword);
router.get("/profile", protect, getProfile);
router.put("/upload/profile", protect, upload.single("avatar"), updateProfile);

module.exports = router;
