const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { getUserById, getAllUsers, deleteUser, searchUsers } = require("../controllers/userController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

router.get("/", protect, getAllUsers);
// ✅ Search users (for Add Member feature)
router.get("/search", protect, searchUsers);

router.get("/:id", protect, getUserById);
router.delete("/:id", protect, adminOnly, deleteUser);


module.exports = router;