const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

// ===========================
// REGISTER (NO EMAIL REQUIRED)
// ===========================
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({
      name,
      email,
      password,
    });

    // Auto-login immediately
    const token = generateToken(user._id);

    res.status(201).json({
      message: "Registration successful",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        isAdmin: user.isAdmin,
      },
    });

  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ===========================
// LOGIN (NO VERIFICATION REQUIRED)
// ===========================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "User does not exist" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = generateToken(user._id);

    res.json({
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        isAdmin: user.isAdmin,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ===========================
// LOGOUT
// ===========================
exports.logout = async (req, res) => {
  try {
    res.json({ message: "Logout successful" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===========================
// RESET PASSWORD (MANUAL TOKEN)
// ===========================
exports.resetPassword = async (req, res) => {
  try {
    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user)
      return res.status(400).json({ message: "Invalid or expired token" });

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ message: "Server error resetting password" });
  }
};

// ===========================
// UPDATE PROFILE
// ===========================
exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    if (req.body.name) user.name = req.body.name;
    if (req.body.about) user.about = req.body.about;
    if (req.body.status) user.status = req.body.status;
    if (req.file) {
      console.log("avatar file:", req.file);
      user.avatar = req.file.path;
    }

    await user.save();

    // emit real-time profile update
    if (req.app.get("io")) {
      req.app.get("io").emit("user:profile:update", {
        _id: user._id,
        name: user.name,
        avatar: user.avatar,
        status: user.status,
        about: user.about,
      });
    }

    res.json({ message: "Profile updated", user });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ message: "Server error updating profile" });
  }
};

// ===========================
// GET PROFILE
// ===========================
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    res.json(user);
  } catch (err) {
    console.error("Profile fetch error:", err);
    res.status(500).json({ message: "Server error fetching profile" });
  }
};
