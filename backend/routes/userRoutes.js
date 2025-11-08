const express = require("express");
const router = express.Router();
const { getAllUsers, deleteUser } = require("../controllers/userController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

router.get("/", protect, getAllUsers);
router.delete("/:id", protect, adminOnly, deleteUser);

module.exports = router;
