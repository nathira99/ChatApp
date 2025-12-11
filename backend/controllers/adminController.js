// controllers/adminController.js
const User = require("../models/User");
const Block = require("../models/Block");
const Group = require("../models/Group");
const Report = require("../models/Report");

// 🧾 Get all users (excluding passwords)
exports.listUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    console.log("User Data:", users )
    res.json(users);
  } catch (err) {
    console.error("Error listing users:", err);
    res.status(500).json({ message: "Server error listing users" });
  }
};

// ❌ Delete user + clean related data
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user._id.toString() === id)
      return res.status(400).json({ message: "Admins cannot delete themselves." });

    // Remove user from all groups
    await Group.updateMany({}, { $pull: { members: id, admins: id } });

    // Delete reports & blocks related to user
    await Report.deleteMany({ $or: [{ reporter: id }, { targetUser: id }] });
    await Block.deleteMany({ $or: [{ blocker: id }, { blocked: id }] });

    await User.findByIdAndDelete(id);
    res.json({ message: "User and related data removed successfully." });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({ message: "Server error deleting user" });
  }
};

// 🚫 Suspend entire account
exports.blockAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndUpdate(id, { blocked: true }, { new: true }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User account blocked.", user });
  } catch (err) {
    console.error("Error blocking account:", err);
    res.status(500).json({ message: "Server error blocking account" });
  }
};

// ✅ Reactivate suspended account
exports.unblockAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndUpdate(id, { blocked: false }, { new: true }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User account unblocked.", user });
  } catch (err) {
    console.error("Error unblocking account:", err);
    res.status(500).json({ message: "Server error unblocking account" });
  }
};

// 🧱 Block pair (hide chat between two users)
exports.createPairBlock = async (req, res) => {
  try {
    const { blockerId, blockedId, reason } = req.body;
    if (!blockerId || !blockedId)
      return res.status(400).json({ message: "blockerId and blockedId required" });

    const exists = await Block.findOne({ blocker: blockerId, blocked: blockedId });
    if (exists) return res.status(400).json({ message: "Block already exists" });

    const block = await Block.create({
      blocker: blockerId,
      blocked: blockedId,
      reason,
      createdByAdmin: true,
    });
    res.status(201).json(block);
  } catch (err) {
    console.error("Error creating pair block:", err);
    res.status(500).json({ message: "Server error creating pair block" });
  }
};

// ❎ Remove pair block
exports.removePairBlock = async (req, res) => {
  try {
    const { id } = req.params;
    const { blockerId, blockedId } = req.body;

    if (id) {
      await Block.findByIdAndDelete(id);
      return res.json({ message: "Pair block removed by ID." });
    }

    if (blockerId && blockedId) {
      await Block.deleteMany({ blocker: blockerId, blocked: blockedId });
      return res.json({ message: "Pair block removed by pair IDs." });
    }

    res.status(400).json({ message: "Provide block ID or blockerId + blockedId." });
  } catch (err) {
    console.error("Error removing pair block:", err);
    res.status(500).json({ message: "Server error removing pair block" });
  }
};

// 👥 Delete group (optional: clean messages too)
exports.deleteGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const group = await Group.findByIdAndDelete(id);
    if (!group) return res.status(404).json({ message: "Group not found" });

    // If you store messages linked to group
    // await Message.deleteMany({ group: id });

    res.json({ message: "Group deleted successfully.", group });
  } catch (err) {
    console.error("Error deleting group:", err);
    res.status(500).json({ message: "Server error deleting group" });
  }
};

// 🔍 Inspect group (see members + admins)
exports.getGroupDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const group = await Group.findById(id)
      .populate("members admins", "name email")
      .lean();

    if (!group) return res.status(404).json({ message: "Group not found" });
    res.json(group);
  } catch (err) {
    console.error("Error fetching group details:", err);
    res.status(500).json({ message: "Server error fetching group details" });
  }
};
exports.listGroups = async (req, res) => {
  try {
    const groups = await Group.find()
      .populate("members", "name email")
      .populate("creator", "name email")
      
      .populate("admins", "name email")
      .lean();
    res.json(groups);
  } catch (err) {
    console.error("❌ listGroups error:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.deactivateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.isDeactivated = true;
    await user.save();

    // Send real-time logout event
    req.app.get("io").to(userId).emit("account:deactivated", {
      message: "Your account has been deactivated by ChatApp admin."
    });

    res.json({ message: "User deactivated successfully" });
  } catch (err) {
    console.error("Deactivate error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.reactivateUser = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.isDeactivated = false;
    await user.save();

    res.json({ message: "User reactivated successfully" });
  } catch (err) {
    console.error("Reactivate error:", err);
    res.status(500).json({ message: "Server error" });
  }
};