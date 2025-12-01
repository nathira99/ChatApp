const { decapsulate } = require("crypto");
const mongoose = require("mongoose");

const ConversationSchema = new mongoose.Schema(
  {
    isGroup: { type: Boolean, default: false },
    name: { type: String }, // for groups

    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    lastMessage: { type: String, default: "" },
    lastMessageTime: { type: Date },
    lastMessageSender: { type: String, default: "" },
    unread:{
      type: Map,
      of: Number,
      default: {},
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Conversation", ConversationSchema, "conversations");