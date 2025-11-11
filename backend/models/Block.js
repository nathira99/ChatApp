// models/Block.js
const mongoose = require("mongoose");

const blockSchema = new mongoose.Schema(
  {
    blocker: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // who created the block (admin)
    blocked: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // who is blocked
    reason: { type: String },
    createdByAdmin: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Block", blockSchema, "blocks");
