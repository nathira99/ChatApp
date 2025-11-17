// backend/controllers/conversationController.js
const Conversation = require("../models/Conversation");
const User = require("../models/User");
const Message = require("../models/Message");

// GET /api/conversations/recent
exports.getRecentChats = async (req, res) => {
  try {
    const userId = req.user._id;

    const convos = await Conversation.find({ members: userId })
      .sort({ updatedAt: -1 })
      .populate("members", "name email avatar")
      .lean();

    return res.json(convos);
  } catch (err) {
    console.error("❌ getRecentChats error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// GET /api/conversations
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    const conversations = await Conversation.find({
      members: userId,
      isGroup: false,
    })
      .populate("members", "name email avatar")
      .sort({ updatedAt: -1 })
      .lean();

    // Only include 1:1 convos and format other user
    const formatted = conversations
      .filter((c) => Array.isArray(c.members) && c.members.length === 2)
      .map((c) => {
        const other = c.members.find((m) => m._id.toString() !== userId.toString());
        return {
          _id: c._id,
          isGroup: false,
          otherUser: {
            _id: other._id,
            name: other.name,
            email: other.email,
            avatar: other.avatar || "",
          },
          name: other.name,
          lastMessage: c.lastMessage || "",
          lastMessageSender: c.lastMessageSender || "",
          lastMessageTime: c.lastMessageTime || null,
        };
      });

    return res.json(formatted);
  } catch (err) {
    console.error("❌ getConversations error:", err);
    return res.status(500).json({ error: "Server error loading conversations" });
  }
};

// POST /api/conversations -> start or return an existing 1:1 conversation
exports.startChat = async (req, res) => {
  try {
    const myId = req.user._id;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId required" });
    }

    // 🔍 Find or create conversation
    let convo = await Conversation.findOne({
      isGroup: false,
      members: { $all: [myId, userId] },
    });

    if (!convo) {
      convo = await Conversation.create({
        isGroup: false,
        members: [myId, userId],
        lastMessage: "",
        lastMessageTime: null,
      });
    }

    // 🧩 Populate members
    const populated = await convo.populate("members", "name email avatar");

    // Identify the "other" user
    const otherUser = populated.members.find(
      (m) => m._id.toString() !== myId.toString()
    );

    if (!otherUser) {
      return res.status(500).json({ error: "Conversation members invalid" });
    }

    // 🔥 Prepare response payload (matches frontend expectations)
    const payload = {
      _id: populated._id,
      isGroup: false,
      otherUser: {
        _id: otherUser._id,
        name: otherUser.name,
        email: otherUser.email,
        avatar: otherUser.avatar || "",
      },
      name: otherUser.name,
      lastMessage: populated.lastMessage || "",
      lastMessageSender: populated.lastMessageSender || "",
      lastMessageTime: populated.lastMessageTime || null,
    };

    // 📡 Emit real-time event to both users
    try {
      const io = req.app.get("io");
      if (io) {
        io.to(String(myId)).emit("conversation:created", payload);
        io.to(String(userId)).emit("conversation:created", payload);
      }
    } catch (emitErr) {
      console.warn("⚠ emit conversation:created failed:", emitErr);
    }

    // Final response
    return res.json(payload);

  } catch (err) {
    console.error("❌ startChat error:", err);
    return res.status(500).json({ error: "Server error starting chat" });
  }
};