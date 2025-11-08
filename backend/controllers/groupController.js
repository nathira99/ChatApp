const Group = require("../models/Group");
const Message = require("../models/Message");

// ✅ Get all groups where user is a member
exports.getGroups = async (req, res) => {
  try {
    // If user is not defined (no token), show all for now
    const groups = req.user
      ? await Group.find({ members: req.user._id })
          .populate("members", "name email")
          .sort({ createdAt: -1 })
      : await Group.find().populate("members", "name email").sort({ createdAt: -1 });

    res.status(200).json(groups);
  } catch (err) {
    console.error("Error fetching groups:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Create a new group
exports.createGroup = async (req, res) => {
  try {
    const { name, description, members } = req.body;

    if (!name || !members) {
      return res.status(400).json({ message: "Name and members required" });
    }

    const uniqueMembers = [...new Set([...members, req.user._id.toString()])];

    const newGroup = await Group.create({
      name,
      description,
      members: uniqueMembers,
    });

    res.status(201).json(newGroup);
  } catch (err) {
    console.error("Error creating group:", err);
    res.status(500).json({ message: "Server error creating group" });
  }
};


// ✅ Get Group Messages
exports.getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    const messages = await Message.find({ group: groupId })
      .populate("sender", "name email")
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Send Group Message
exports.sendGroupMessage = async (req, res) => {
  try {
    const { groupId, content } = req.body;
    const senderId = req.user._id;

    const message = await GroupMessage.create({
      sender: senderId,
      group: groupId,
      content,
    });

    const populated = await message.populate("sender", "name email");

    // 🔥 Emit message to group room
    if (req.io) {
      req.io.to(groupId).emit("message:receive", populated);
    }

    res.status(201).json(populated);
  } catch (err) {
    console.error("Error sending group message:", err);
    res.status(500).json({ error: "Server error sending group message" });
  }
};
