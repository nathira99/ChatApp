const User = require("../models/User");

// ✅ Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users" });
  }
};

// ✅ Delete user (Admin only)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    await user.deleteOne();
    res.json({ message: "User removed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting user" });
  }
};
