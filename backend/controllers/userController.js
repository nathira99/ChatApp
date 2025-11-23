const User = require("../models/User");

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    return res.status(400).json({ message: "Invalid user ID" });
  }
};

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
exports.searchUsers = async (req, res) => {
  try {
    const query = req.query.query?.trim();
    if (!query) return res.json([]);
    const users = await User.find({
      name: { $regex: query, $options: "i" },
    }).select("name email");
    res.json(users);
  } catch (err) {
    console.error("User search failed:", err);
    res.status(500).json({ message: "Search error" });
  }
};
