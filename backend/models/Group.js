

const mongoose = require("mongoose");

const AuditSchema = new mongoose.Schema({
  action: { type: String, required: true }, // e.g., add_member, remove_member, update_group
  by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  meta: { type: Object, default: {} },
  createdAt: { type: Date, default: Date.now },
});

const GroupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    creator: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    admins: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    imageUrl: { type: String, default: "" },
    isPrivate: { type: Boolean, default: false },
    lastMessage: { type: String, default: "" },
    lastMessageAt: { type: Date },
    deleted: { type: Boolean, default: false }, // soft delete
    joinRequests: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        message: String,
        status: {
          type: String,
          enum: ["pending", "approved", "rejected"],
          default: "pending",
        },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    audit: [AuditSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Group", GroupSchema, "groups");