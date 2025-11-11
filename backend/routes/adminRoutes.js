// routes/adminRoutes.js
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { isAdmin } = require("../middleware/adminMiddleware");
const adminCtrl = require("../controllers/adminController"); // ✅ added

// ✅ all routes below require authentication and admin
router.use(protect, isAdmin);

// 👤 user management
router.get("/users", adminCtrl.listUsers);
router.delete("/users/:id", adminCtrl.deleteUser);
router.put("/users/:id/block", adminCtrl.blockAccount);
router.put("/users/:id/unblock", adminCtrl.unblockAccount);

// 🚫 pair blocks
router.post("/blocks", adminCtrl.createPairBlock); // body: { blockerId, blockedId, reason }
router.delete("/blocks/:id", adminCtrl.removePairBlock);
router.post("/blocks/remove", adminCtrl.removePairBlock); // body: { blockerId, blockedId }

// 👥 group operations
router.delete("/groups/:id", adminCtrl.deleteGroup);
router.get("/groups/:id", adminCtrl.getGroupDetails);
router.get("/groups", adminCtrl.listGroups);


module.exports = router;
