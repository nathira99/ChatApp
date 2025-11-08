const Message = require("../models/Message");
const CryptoJS = require("crypto-js");
const path = require("path");

const SECRET_KEY = process.env.ENCRYPTION_KEY || "default_secret_key";

// ✅ Send Text Message (Encrypt before saving)
exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    const senderId = req.user._id;

    if (!receiverId || !content) {
      return res.status(400).json({ error: "Receiver and content are required." });
    }

    // Encrypt message
    const encryptedContent = CryptoJS.AES.encrypt(content, SECRET_KEY).toString();

    const message = await Message.create({
      sender: senderId,
      receiver: receiverId,
      content: encryptedContent,
    });

    const populated = await message.populate("sender receiver", "name email");

    // Send real-time socket update (if socket exists)
    if (req.io) {
      req.io.to(receiverId.toString()).emit("message:receive", populated);
    }

    res.status(201).json(populated);
  } catch (err) {
    console.error("❌ Error sending message:", err);
    res.status(500).json({ error: "Server error sending message" });
  }
};

// ✅ Send File Message (supports image, pdf, doc)
exports.sendFileMessage = async (req, res) => {
  try {
    const { receiverId } = req.body;
    const senderId = req.user._id;

    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const fileUrl = `/uploads/${req.file.filename}`;
    const fileType = req.file.mimetype;

    const message = await Message.create({
      sender: senderId,
      receiver: receiverId,
      content: `📎 File sent: ${req.file.originalname}`,
      fileUrl,
      fileType,
    });

    const populated = await message.populate("sender receiver", "name email");

    if (req.io) {
      req.io.to(receiverId.toString()).emit("message:receive", populated);
    }

    res.status(201).json(populated);
  } catch (error) {
    console.error("❌ Error sending file:", error);
    res.status(500).json({ error: "Server error uploading file" });
  }
};

// ✅ Get All Messages Between Two Users (Decrypt on read)
exports.getMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId },
      ],
    })
      .populate("sender receiver", "name email")
      .sort({ createdAt: 1 });

    // Decrypt message content
    const decryptedMessages = messages.map((msg) => {
      if (msg.content) {
        try {
          const bytes = CryptoJS.AES.decrypt(msg.content, SECRET_KEY);
          const decrypted = bytes.toString(CryptoJS.enc.Utf8);
          msg.content = decrypted || msg.content;
        } catch (err) {
          msg.content = msg.content;
        }
      }
      return msg;
    });

    res.json(decryptedMessages);
  } catch (error) {
    console.error("❌ Error fetching messages:", error);
    res.status(500).json({ error: "Server error fetching messages" });
  }
};
