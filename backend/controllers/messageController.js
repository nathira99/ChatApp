const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const Block = require("../models/Block");

// ==============================
// SEND TEXT MESSAGE (PLAIN TEXT)
// ==============================
exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    const senderId = req.user._id;

    if (!receiverId || !content) {
      return res
        .status(400)
        .json({ error: "Receiver and content are required." });
    }

    // Block check
    const pairBlocked = await Block.exists({
      $or: [
        { blocker: senderId, blocked: receiverId },
        { blocker: receiverId, blocked: senderId },
      ],
    });

    if (pairBlocked) {
      return res
        .status(403)
        .json({ error: "Messaging blocked between these users." });
    }

    // Create message (plain text)
    const message = await Message.create({
      sender: senderId,
      receiver: receiverId,
      content,
    });

    // Find or create conversation
    let conversation = await Conversation.findOne({
      isGroup: false,
      members: { $all: [senderId, receiverId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        isGroup: false,
        members: [senderId, receiverId],
      });
    }

    // Update conversation summary
    conversation.lastMessage = content;
    conversation.lastMessageTime = new Date();
    conversation.lastMessageSender = String(senderId);
    await conversation.save();

    const populated = await message.populate("sender receiver", "name email");

    // Emit real-time updates
    if (req.io) {
      req.io.to(receiverId.toString()).emit("message:receive", {
        ...populated.toObject(),
        conversationId: conversation._id,
      });
      req.io.to(senderId.toString()).emit("message:receive", {
        ...populated.toObject(),
        conversationId: conversation._id,
      });
    }

    res.status(201).json({
      ...populated.toObject(),
      conversationId: conversation._id,
    });
  } catch (err) {
    console.error("❌ Error sending message:", err);
    res.status(500).json({ error: "Server error sending message" });
  }
};

// ==============================
// SEND FILE MESSAGE
// ==============================
exports.sendFileMessage = async (req, res) => {
  try {
    const file = req.file;
    const { receiverId } = req.body;
    const senderId = req.user._id;

    if (!file) return res.status(400).json({ message: "No file uploaded" });

    // Block check
    const pairBlocked = await Block.exists({
      $or: [
        { blocker: senderId, blocked: receiverId },
        { blocker: receiverId, blocked: senderId },
      ],
    });

    if (pairBlocked) {
      return res
        .status(403)
        .json({ message: "File sharing blocked between these users." });
    }

    // Detect type
    let type = "document";
    if (file.mimetype.startsWith("image/")) type = "image";
    else if (file.mimetype.startsWith("video/")) type = "video";
    else if (file.mimetype.startsWith("audio/")) type = "audio";

    // Save message
    const message = await Message.create({
      sender: senderId,
      receiver: receiverId,
      content: file.originalname,
      fileUrl: file.path,
      fileName: file.originalname,
      fileSize: file.size,
      fileType: file.mimetype,
      type,
    });

    const populated = await message.populate("sender receiver", "name email");

    if (req.io) {
      req.io.to(receiverId.toString()).emit("message:receive", populated);
      req.io.to(senderId.toString()).emit("message:receive", populated);
    }

    res.status(201).json({
      ...populated.toObject(),
      conversationId: conversation._id,
    });
  } catch (error) {
    console.error("❌ File message error:", error);
    res.status(500).json({ message: "Server error sending file" });
  }
};

// ==============================
// GET MESSAGES
// ==============================
exports.getMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    const pairBlocked = await Block.exists({
      $or: [
        { blocker: currentUserId, blocked: userId },
        { blocker: userId, blocked: currentUserId },
      ],
    });

    if (pairBlocked) return res.json([]);

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId },
      ],
    })
      .populate("sender receiver", "name email")
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    console.error("❌ Error fetching messages:", error);
    res.status(500).json({ error: "Server error fetching messages" });
  }
};

// ==============================
// CLEAR CHAT
// ==============================
exports.clearChat = async (req, res) => {
  try {
    const userId = req.user._id;
    const { otherUserId } = req.params;

    if (!otherUserId) {
      return res.status(400).json({ message: "otherUserId required" });
    }

    await Message.deleteMany({
      $or: [
        { sender: userId, receiver: otherUserId },
        { sender: otherUserId, receiver: userId },
      ],
    });

    await Conversation.findOneAndUpdate(
      {
        isGroup: false,
        members: { $all: [userId, otherUserId] },
      },
      {
        lastMessage: "",
        lastMessageTime: null,
        lastMessageSender: null,
      }
    );

    res.json({ message: "Chat cleared successfully" });
  } catch (err) {
    console.error("❌ Clear Chat Error:", err);
    res.status(500).json({ message: "Failed to clear chat" });
  }
};
