const Conversation = require("../models/Conversation");
const User = require("../models/User");
const Message = require("../models/Message");

exports.getRecentChats = async (req, res) => {
  try {
    const userId = req.user._id;

    const convos = await Conversation.find({ members: userId })
      .sort({ updatedAt: -1 })
      .populate("members", "name email avatar")
      .lean();

    res.json(convos);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.startChatController = async (req, res) => {
  try {
    const loggedIn = req.user._id;
    const { userId } = req.body;

    let convo = await Conversation.findOne({
      isGroup: false,
      members: { $all: [loggedIn, userId] },
    });

    if (!convo) {
      convo = await Conversation.create({
        isGroup: false,
        members: [loggedIn, userId],
      });
    }

    res.json(convo);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    let conversations = await Conversation.find({
      members: userId,
      isGroup: false
    })
      .populate("members", "name email avatar")
      .sort({ updatedAt: -1 })
      .lean();

    conversations = conversations.map((c) => {
      const other = c.members.find((m) => m._id.toString() !== userId.toString());
      return {
        _id: c._id,
        otherUser: other,
        name: other?.name || "Unknown",
        lastMessage: c.lastMessage || "",
        lastMessageSender: c.lastMessageSender || null,
        lastMessageTime: c.lastMessageTime || null,
        isGroup: false,
      };
    });

    res.json(conversations);
  } catch (err) {
    console.error("❌ getConversations error:", err);
    res.status(500).json({ error: "Server error loading conversations" });
  }
};

exports.getOrCreateConversation = async (req, res) => {
  try {
    const myId = req.user._id;
    const otherId = req.params.userId;

    let convo = await Conversation.findOne({
      isGroup: false,
      members: { $all: [myId, otherId] }
    });

    if (!convo) {
      convo = await Conversation.create({
        isGroup: false,
        members: [myId, otherId]
      });
    }

    res.json({ conversation: convo });
  } catch (err) {
    console.error("❌ getOrCreateConversation:", err);
    res.status(500).json({ error: "Server error" });
  }
};
// -------------------------------------------------------------------
// POST /conversations → Start a new chat
// -------------------------------------------------------------------
exports.startChat = async (req, res) => {
  try {
    const { userId } = req.body;
    const me = req.user._id;

    if (!userId) return res.status(400).json({ error: "UserId required" });

    let convo = await Conversation.findOne({
      isGroup: false,
      members: { $all: [me, userId] },
    });

    if (!convo) {
      convo = await Conversation.create({
        isGroup: false,
        members: [me, userId],
        lastMessage: "",
      });
    }

    res.json(convo);
  } catch (err) {
    console.error("❌ startChat error:", err);
    res.status(500).json({ error: "Server error starting chat" });
  }
};