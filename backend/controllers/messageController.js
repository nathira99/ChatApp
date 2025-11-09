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
      return res
        .status(400)
        .json({ error: "Receiver and content are required." });
    }

    // Encrypt message
    const encryptedContent = CryptoJS.AES.encrypt(
      content,
      SECRET_KEY
    ).toString();

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

// ✅ Send file message (image / video / document)
exports.sendFileMessage = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ message: "No file uploaded" });

    const baseUrl = `${req.protocol}://${req.get("host")}`; // http://localhost:5000

    let messageType = "file";
    if (file.mimetype.startsWith("image/")) messageType = "image";
    else if (file.mimetype.startsWith("video/")) messageType = "video";
    else if (file.mimetype.startsWith("audio/")) messageType = "audio";
    else messageType = "document";

    const message = await Message.create({
      sender: req.user._id,
      receiver: req.body.receiverId || null,
      content: file.originalname,
      fileUrl: `${baseUrl}/uploads/${file.filename}`,
      fileType: file.mimetype,
      fileName: file.originalname,
      fileSize: file.size,
      type: messageType, // ✅ correctly classified
    });

    const populatedMessage = await message.populate("sender", "name email");

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error("❌ File message error:", error);
    res.status(500).json({ message: "Server error sending file" });
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
