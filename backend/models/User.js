const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatar: { type: String, default: "" },
    about: { type: String, default: "" },
    status: { type: String, enum: ["online", "offline", "away"], default: "offline" },
    isVerified: {
      type: Boolean,
      default: true,
    },
    joinDate: { type: Date, default: Date.now },
    lastSeen: { type: Date, default: null },
    verificationToken: String,
    verificationExpires: Date,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    isAdmin: { type: Boolean, default: false },
    blocked: { type: Boolean, default: false },
    isDeactivated: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

module.exports = mongoose.model("User", userSchema, "users");
