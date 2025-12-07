const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { getUserById, getAllUsers, deleteUser, searchUsers } = require("../controllers/userController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

router.get("/", protect, getAllUsers);
// ✅ Search users (for Add Member feature)
router.get("/search", protect, searchUsers);
router.get("/all", protect, async (req, res) => {
    const users = await User.find().select("_id name email avatar status");
    res.json(users);
})

router.get("/:id", protect, getUserById);
router.delete("/:id", protect, adminOnly, deleteUser);


module.exports = router;