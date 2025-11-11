// models/Report.js
const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    targetUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // optional
    targetGroup: { type: mongoose.Schema.Types.ObjectId, ref: "Group" }, // optional
    messageId: { type: mongoose.Schema.Types.ObjectId, ref: "Message" }, // optional
    reason: { type: String, required: true },
    details: { type: String },
    status: { type: String, enum: ["open", "in_review", "resolved", "rejected"], default: "open" },
    handledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // admin who handled
    resolutionNote: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Report", reportSchema, "reports");
