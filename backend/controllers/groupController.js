const { Server } = require("socket.io");
const Group = require("../models/Group");
const Message = require("../models/Message");

let ioInstance = null;
exports.setIO = (io) => {
  ioInstance = io;
};

// ✅ Admin adds a member
exports.addMember = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { memberId } = req.body;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    // only admin can add
    if (!group.admins.includes(req.user._id))
      return res.status(403).json({ message: "Only admin can add members" });

    if (group.members.includes(memberId))
      return res.status(400).json({ message: "User already in group" });

    group.members.push(memberId);
    await group.save();

    res.status(200).json({ message: "Member added successfully", group });
  } catch (err) {
    console.error("Add member error:", err);
    res.status(500).json({ message: "Server error adding member" });
  }
};
// ❌ Remove member (admin or creator only)
exports.removeMember = async (req, res) => {
  try {
    const { groupId, memberId } = req.params;
    const group = await Group.findById(groupId);

    if (!group) return res.status(404).json({ message: "Group not found" });
    if (!group.creator.equals(req.user._id) && !group.admins.includes(req.user._id))
      return res.status(403).json({ message: "Not authorized" });

    group.members.pull(memberId);
    group.admins.pull(memberId);
    await group.save();
    res.json({ message: "Member removed" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// ✅ User requests to join group
exports.requestJoin = async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    if (group.members.includes(req.user._id))
      return res.status(400).json({ message: "Already a member" });

    if (group.joinRequests.includes(req.user._id))
      return res.status(400).json({ message: "Already requested" });

    group.joinRequests.push(req.user._id);
    await group.save();

    res.status(200).json({ message: "Join request sent successfully" });
  } catch (err) {
    console.error("Join request error:", err);
    res.status(500).json({ message: "Server error sending join request" });
  }
};
// ✅ Admin approves or rejects join request
exports.handleJoinRequest = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId, action } = req.body; // action = "approve" | "reject"

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    if (!group.admins.includes(req.user._id))
      return res.status(403).json({ message: "Only admin can manage requests" });

    group.joinRequests = group.joinRequests.filter(
      (u) => u.toString() !== userId.toString()
    );

    if (action === "approve") group.members.push(userId);

    await group.save();

    res.status(200).json({
      message:
        action === "approve"
          ? "Join request approved"
          : "Join request rejected",
      group,
    });
  } catch (err) {
    console.error("Join approval error:", err);
    res.status(500).json({ message: "Server error managing join request" });
  }
};
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
    const { name, description, members=[], isPrivate } = req.body;

    if (!name ) {
      return res.status(400).json({ message: "Group Name required" });
    }
    const group = await Group.create({
      name,
      description,
      members: [...new Set([...members, req.user._id])],
      admins: [req.user._id],
      creator: req.user._id,
      isPrivate,
    });
    
    const populated = await group.populate("creator members admins", "name email");

    res.status(201).json(group);
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
    const { groupId } = req.params;
    const { content } = req.body;
    const senderId = req.user._id;
        console.log("📩 Sending group message", { groupId, content, senderId });

    const message = await Message.create({
      sender: senderId,
      group: groupId,
      content,
    });

    const populated = await message.populate("sender", "name email");

    // ✅ Emit message to group room globally
    if (ioInstance) ioInstance.to(groupId).emit("group:message:receive", populated);
    else console.log("⚠️ ioInstance is undefined!");

    res.status(201).json(populated);
  } catch (err) {
    console.error("❌ Group message error:", err);
    res.status(500).json({ error: err.message });
  }
};
exports.uploadGroupFile = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const { groupId } = req.params;
    const filePath = `/uploads/${req.file.filename}`;

    const message = await Message.create({
      sender: req.user._id,
      group: groupId,
      content: `${req.file.originalname}`,
      fileUrl: filePath,
      fileType: req.file.mimetype,
      fileName: req.file.originalname,
    });

    const populated = await message.populate("sender", "name email");

    req.app.get("io")?.to(groupId).emit("group:message:receive", populated);

    res.status(201).json(populated);
  } catch (err) {
    console.error("❌ Group file message error:", err);
    res.status(500).json({ error: "Server error uploading group file" });
  }
};
// Get group details (with creator, members, admins)
exports.getGroupDetails = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate("creator", "name email")
      .populate("members", "name email")
      .populate("admins", "name email");

    if (!group) return res.status(404).json({ message: "Group not found" });
    res.json(group);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// Exit group (any member)
exports.exitGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: "Group not found" });

    group.members.pull(req.user._id);
    group.admins.pull(req.user._id);

    // if creator exits, auto delete
    if (group.creator.equals(req.user._id)) {
      await group.deleteOne();
      return res.json({ message: "Group deleted as creator exited" });
    }

    await group.save();
    res.json({ message: "Exited group" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// Delete group (creator only)
exports.deleteGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: "Group not found" });

    if (!group.creator.equals(req.user._id))
      return res.status(403).json({ message: "Only creator can delete group" });

    await group.deleteOne();
    res.json({ message: "Group deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};