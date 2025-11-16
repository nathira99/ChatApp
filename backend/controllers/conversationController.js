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
      isGroup: false,
    })
      .populate("members", "name email avatar")
      .sort({ updatedAt: -1 })
      .lean();

    const formatted = conversations.filter(c => 
      Array.isArray(c.members) && c.members.length === 2
    )
    .map((c) => {
      const other = c.members.find(
        (m) => m._id.toString() !== userId.toString()
      );

      if(!other) {
        console.warn("conversation has no valid partner:", c._id)
      }
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
        isGroup: false,
      };
    });

    res.json(formatted);
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
      members: { $all: [myId, otherId] },
    });

    if (!convo) {
      convo = await Conversation.create({
        isGroup: false,
        members: [myId, otherId],
      });
    }
    const full = await convo.populate("members", "name email avatar");

    const other = full.members.find((m) => m._id.toString() !== myId.toString());

    res.json({ 
        _id: full._id,
        isGroup: false,
        otherUser: {
          _id: other._id,
          name: other.name,
          email: other.email,
          avatar: other.avatar || "",
        },
        name: other.name,
        lastMessage: full.lastMessage || "",
        lastMessageSender: full.lastMessageSender || "",
        lastMessageTime: full.lastMessageTime || null,
        isGroup: false
     });
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
    const loggedIn = req.user._id;
    const { userId } = req.body;

    if (!userId) return res.status(400).json({ error: "UserId required" });

    let convo = await Conversation.findOne({
      isGroup: false,
      members: { $all: [me, userId] },
    });

    if (!convo) {
      convo = await Conversation.create({
        isGroup: false,
        members: [loggedIn, userId],
        lastMessage: "",
        lastMessageTime: null,
      });
    }
    const full = await convo.populate("members", "name email avatar");

    const otherUser = full.members.find(
        (m) => m._id.toString() !== loggedIn.toString()
      );
    res.json({
      _id: full._id,
      isGroup: false,
      otherUser: {
        _id: otherUser._id,
        name: otherUser.name,
        email: otherUser.email,
        avatar: otherUser.avatar || "",
      },
      name: otherUser.name,
      lastMessage: full.lastMessage || "",
      lastMessageTime: full.lastMessageTime || null,
    });
  } catch (err) {
    console.error("❌ startChat error:", err);
    res.status(500).json({ error: "Server error starting chat" });
  }
};
