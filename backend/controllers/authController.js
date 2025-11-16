const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const { error } = require("console");

// Register
// Register
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 🔥 VALIDATION FIX — missing in your code
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ message: "User already exists" });

    const verificationToken = crypto.randomBytes(32).toString("hex");

    const user = await User.create({
      name,
      email,
      password,
      verificationToken,
      verificationExpires: Date.now() + 10 * 60 * 1000,
    });

    const verifyUrl = `${process.env.FRONTEND_URL}/verify/${verificationToken}`;

const html = `
<div style="font-family: Arial, sans-serif; background-color: #f4f7fb; padding: 30px;">
  <table align="center" cellpadding="0" cellspacing="0" width="100%" 
         style="max-width: 500px; background: white; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
    <tr>
      <td style="padding: 25px 30px; text-align: center;">
        <img src="${process.env.FRONTEND_URL}/public/chat-message-heart-svgrepo-com.svg" 
             alt="ChatApp" style="width: 70px; margin-bottom: 10px;">
        <h2 style="color: #111; margin-bottom: 5px;">Verify Your ChatApp Account</h2>
        <p style="color: #555; font-size: 15px;">Hi ${user.name},</p>
        <p style="color: #666; font-size: 14px; line-height: 1.6;">
          Thanks for signing up! Please confirm your email address by clicking the button below.
        </p>
        <a href="${verifyUrl}" 
          style="display:inline-block; margin-top: 20px; padding: 12px 30px; background: linear-gradient(90deg,#4f46e5,#7c3aed);
          color: white; text-decoration: none; font-weight: 600; border-radius: 8px;">
          Verify My Email
        </a>
        <p style="margin-top: 25px; color: #999; font-size: 12px;">
          This link will expire in 10 minutes.<br>
          If you didn’t create an account, please ignore this email.
        </p>
      </td>
    </tr>
  </table>
</div>
`;

    await sendEmail(user.email, "Verify Your ChatApp Account", html);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      isAdmin: user.isAdmin,
      token: generateToken(user),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });
    if (!user.isVerified)
      return res
        .status(401)
        .json({ message: "Please verify your email before logging in." });

    if(user.isDeleted){
      return res.status(401).json({ 
        message: "Your account has been deleted by ChatApp admin." });
    }

    if(user.isDeactivated){
      return res.status(401).json({ 
        error: "Deactivated",
        message: "Your account has been deactivated by ChatApp admin." });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Invalid credentials" });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      token: generateToken(user),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Logout User
exports.logout = async (req, res) => {
  try {
    res.json({ message: "Logout successful" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// Verify email
exports.verifyEmail = async (req, res) => {
  const { token } = req.params;
  const user = await User.findOne({
    verificationToken: token,
    verificationExpires: { $gt: Date.now() },
  });

  if (!user)
    return res.status(400).json({ message: "Invalid or expired token" });

  user.isVerified = true;
  user.verificationToken = undefined;
  user.verificationExpires = undefined;
  await user.save();

  res.json({ message: "Email verified successfully" });
};
// Forgot Password
exports.forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user)
      return res.status(404).json({ message: "No user with that email" });

    // 1️⃣ Generate plain reset token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // 2️⃣ Hash and store in DB
    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 min
    await user.save({ validateBeforeSave: false });

    // 3️⃣ Send email with the plain token
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

   const html = `
<div style="font-family: Arial, sans-serif; background-color: #f4f7fb; padding: 30px;">
  <table align="center" cellpadding="0" cellspacing="0" width="100%" 
         style="max-width: 500px; background: white; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
    <tr>
      <td style="padding: 25px 30px; text-align: center;">
        <img src="${process.env.FRONTEND_URL}/public/chat-message-heart-svgrepo-com.svg" 
             alt="ChatApp" style="width: 60px; margin-bottom: 10px;">
        <h2 style="color: #111; margin-bottom: 5px;">Reset Your Password</h2>
        <p style="color: #555; font-size: 15px;">Hi ${user.name},</p>
        <p style="color: #666; font-size: 14px; line-height: 1.6;">
          You requested to reset your ChatApp password. Click below to reset it.
        </p>
        <a href="${resetUrl}" 
          style="display:inline-block; margin-top: 20px; padding: 12px 30px; background: linear-gradient(90deg,#4f46e5,#7c3aed);
          color: white; text-decoration: none; font-weight: 600; border-radius: 8px;">
          Reset My Password
        </a>
        <p style="margin-top: 25px; color: #999; font-size: 12px;">
          This link will expire in 15 minutes.<br>
          If you didn’t request a password reset, ignore this message.
        </p>
      </td>
    </tr>
  </table>
</div>
`;

    await sendEmail({
      to: user.email,
      subject: "ChatApp Password Reset",
      html,
    });
    res.json({ message: "Reset link sent successfully" });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ message: "Server error sending reset email" });
  }
};

// Reset Password
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

// Update User Profile
exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (req.body.name) user.name = req.body.name;
    if (req.body.about) user.about = req.body.about;
    if (req.body.status) user.status = req.body.status;
    if (req.file) user.avatar = `/uploads/${req.file.filename}`;

    await user.save();
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

// Get User Profile
exports.getProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }
    res.json({
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      about: req.user.about,
      avatar: req.user.avatar,
      status: req.user.status,
    });
  } catch (err) {
    console.error("Profile fetch error:", err);
    res.status(500).json({ message: "Server error fetching profile" });
  }
};