const Message = require("../models/Message");
const Block = require("../models/Block");
const CryptoJS = require("crypto-js");

const SECRET_KEY = process.env.ENCRYPTION_KEY || "default_secret_key";

/* ----------------------------- SEND TEXT MESSAGE ----------------------------- */
exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    const senderId = req.user._id;

    if (!receiverId || !content)
      return res.status(400).json({ error: "Receiver and content are required." });

    // 🔒 Check if chat between these two users is blocked
    const pairBlocked = await Block.exists({
      $or: [
        { blocker: senderId, blocked: receiverId },
        { blocker: receiverId, blocked: senderId },
      ],
    });
    if (pairBlocked)
      return res.status(403).json({ error: "Messaging blocked between these users." });

    // 🔐 Encrypt message before saving
    const encryptedContent = CryptoJS.AES.encrypt(content, SECRET_KEY).toString();

    const message = await Message.create({
      sender: senderId,
      receiver: receiverId,
      content: encryptedContent,
    });

    const populated = await message.populate("sender receiver", "name email");

    // 🔔 Emit real-time message if socket is attached
    if (req.io) req.io.to(receiverId.toString()).emit("message:receive", populated);

    res.status(201).json(populated);
  } catch (err) {
    console.error("❌ Error sending message:", err);
    res.status(500).json({ error: "Server error sending message" });
  }
};

/* ----------------------------- SEND FILE MESSAGE ----------------------------- */
exports.sendFileMessage = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ message: "No file uploaded" });

    const { receiverId } = req.body;
    const senderId = req.user._id;

    // 🔒 Check pair block before sending
    const pairBlocked = await Block.exists({
      $or: [
        { blocker: senderId, blocked: receiverId },
        { blocker: receiverId, blocked: senderId },
      ],
    });
    if (pairBlocked)
      return res.status(403).json({ message: "File sharing blocked between these users." });

    const baseUrl = `${req.protocol}://${req.get("host")}`;

    let messageType = "file";
    if (file.mimetype.startsWith("image/")) messageType = "image";
    else if (file.mimetype.startsWith("video/")) messageType = "video";
    else if (file.mimetype.startsWith("audio/")) messageType = "audio";
    else messageType = "document";

    const message = await Message.create({
      sender: senderId,
      receiver: receiverId,
      content: file.originalname,
      fileUrl: `${baseUrl}/uploads/${file.filename}`,
      fileType: file.mimetype,
      fileName: file.originalname,
      fileSize: file.size,
      type: messageType,
    });

    const populated = await message.populate("sender", "name email");

    if (req.io) req.io.to(receiverId.toString()).emit("message:receive", populated);

    res.status(201).json(populated);
  } catch (error) {
    console.error("❌ File message error:", error);
    res.status(500).json({ message: "Server error sending file" });
  }
};

/* ----------------------------- GET MESSAGES ----------------------------- */
exports.getMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    // 🔒 Block check before showing messages
    const pairBlocked = await Block.exists({
      $or: [
        { blocker: currentUserId, blocked: userId },
        { blocker: userId, blocked: currentUserId },
      ],
    });

    // Hide all messages if the pair is blocked
    if (pairBlocked) return res.json([]);

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId },
      ],
    })
      .populate("sender receiver", "name email")
      .sort({ createdAt: 1 });

    // 🔓 Decrypt message content
    const decrypted = messages.map((msg) => {
      if (msg.content) {
        try {
          const bytes = CryptoJS.AES.decrypt(msg.content, SECRET_KEY);
          const text = bytes.toString(CryptoJS.enc.Utf8);
          msg.content = text || msg.content;
        } catch {
          msg.content = msg.content;
        }
      }
      return msg;
    });

    res.json(decrypted);
  } catch (error) {
    console.error("❌ Error fetching messages:", error);
    res.status(500).json({ error: "Server error fetching messages" });
  }
};
