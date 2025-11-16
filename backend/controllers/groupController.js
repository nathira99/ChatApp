const { Server } = require("socket.io");
const Group = require("../models/Group");
const Message = require("../models/Message");
const User = require("../models/User");
const path = require("path");
const fs = require("fs");

let ioInstance = null;
exports.setIO = (io) => {
  ioInstance = io;
};

// 🧾 Helper: add audit log to group
async function pushAudit(groupId, action, by, meta = {}) {
  await Group.findByIdAndUpdate(groupId, {
    $push: { audit: { action, by, meta } },
  });
}

/**
 * GET /api/groups/my
*/
exports.getMyGroups = async (req, res) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) return res.status(401).json({ error: "Not authorized" });

    const groups = await Group.find({ members: userId, deleted: { $ne: true } })
      .sort({ updatedAt: -1 })
      .populate("members", "name email")
      .lean();

   const result = await Promise.all(groups.map(async (g) => {
      // find the latest message for this group
      const lastMsg = await Message.findOne({ group: g._id })
        .sort({ createdAt: -1 })
        .populate("sender", "name")
        .lean();

      return {
        _id: g._id,
        name: g.name || "Group",
        isGroup: true,
        lastMessage: lastMsg ? (lastMsg.content || lastMsg.fileName || "") : "",
        lastMessageSender: lastMsg && lastMsg.sender ? String(lastMsg.sender._id) : "",
        lastMessageSenderName: lastMsg && lastMsg.sender ? lastMsg.sender.name : "",
        lastMessageTime: lastMsg ? lastMsg.createdAt : (g.updatedAt || null),
        imageUrl: g.imageUrl || "",
        members: g.members || [],
        admins: g.admins || [],
      };
    }));

    return res.json(result);
  } catch (err) {
    // <-- Make sure you log the error stack so you can debug the real cause
    console.error("❌ getMyGroups error:", err && err.stack ? err.stack : err);
    return res.status(500).json({ error: "Failed to load groups" });
  }
};

// ✅ Create a new group
exports.createGroup = async (req, res) => {
  try {
    const { name, description = "", members = [], isPrivate = false } = req.body;
    if (!name) return res.status(400).json({ message: "Group name is required" });

    const creatorId = req.user._id.toString();
    const uniqueMembers = Array.from(new Set([...members, creatorId]));

    const group = await Group.create({
      name,
      description,
      creator: creatorId,
      admins: [creatorId],
      members: uniqueMembers,
      isPrivate,
    });

    await pushAudit(group._id, "create_group", req.user._id, { name });
    res.status(201).json(group);
  } catch (err) {
    console.error("Error creating group:", err);
    res.status(500).json({ message: "Server error creating group" });
  }
};

// ✅ Get all groups visible to the logged-in user
exports.getGroups = async (req, res) => {
  try {
    const userId = req.user._id;
    const groups = await Group.find({
      $and: [
        { deleted: false },
        {
          $or: [{ isPrivate: false }, { members: userId }, { creator: userId }],
        },
      ],
    })
      .populate("creator members admins", "name email")
      .sort({ updatedAt: -1 });

    res.json(groups);
  } catch (err) {
    console.error("Error fetching groups:", err);
    res.status(500).json({ message: "Error fetching groups" });
  }
};

// ✅ Get group details
exports.getGroupDetails = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id).populate(
      "creator members admins",
      "name email"
    );
    if (!group) return res.status(404).json({ message: "Group not found" });
    res.json(group);
  } catch (err) {
    console.error("Error loading group:", err);
    res.status(500).json({ message: "Error loading group" });
  }
};

// ✅ Update name, description or image (admins only)
exports.updateGroup = async (req, res) => {
  try {
    const { name, description, imageUrl } = req.body;
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: "Group not found" });

    if (!group.admins.includes(req.user._id))
      return res.status(403).json({ message: "Admins only" });

    if (name) group.name = name;
    if (description) group.description = description;
    if (imageUrl) group.imageUrl = imageUrl;
    await group.save();
    await pushAudit(group._id, "update_group", req.user._id, { name, description });

    res.json(group);
  } catch (err) {
    console.error("Error updating group:", err);
    res.status(500).json({ message: "Error updating group" });
  }
};

// Helper: string-safe membership check
const includesId = (arr, id) =>
  arr.some((x) => x?.toString?.() === id.toString?.());

exports.addMember = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;

    if (!userId) return res.status(400).json({ message: "userId is required" });

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    // only admin can add members
    if (!group.admins.includes(req.user._id.toString())) {
      return res.status(403).json({ message: "Only admins can add members" });
    }

    // check if already in group
    if (group.members.includes(userId)) {
      return res.status(400).json({ message: "User already in group" });
    }

    // ensure user exists
    const userToAdd = await User.findById(userId);
    if (!userToAdd) return res.status(404).json({ message: "User not found" });

    group.members.push(userId);
    await group.save();

    const updatedGroup = await Group.findById(groupId)
      .populate("members", "name email")
      .populate("admins", "name email");

    res.json({ message: "Member added successfully", group: updatedGroup });
  } catch (err) {
    console.error("Add member error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Remove member (admins only)
exports.removeMember = async (req, res) => {
  try {
    const { userId } = req.body; // IMPORTANT: frontend must send { userId }
    const { groupId } = req.params;
    if (!userId) return res.status(400).json({ message: "userId required" });

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    if (!includesId(group.admins, req.user._id))
      return res.status(403).json({ message: "Admins only" });

    group.members = group.members.filter((m) => m.toString() !== userId.toString());
    group.admins = group.admins.filter((a) => a.toString() !== userId.toString());

    // If removing creator, transfer if needed
    if (group.creator.toString() === userId.toString()) {
      if (group.members.length > 0) {
        group.creator = group.members[0];
        if (!includesId(group.admins, group.creator)) group.admins.push(group.creator);
      } else {
        // no members left — soft-delete group
        group.deleted = true;
      }
    }

    await group.save();
    await pushAudit(group._id, "remove_member", req.user._id, { userId });

    const populated = await Group.findById(groupId).populate("members admins creator", "name email");
    res.json({ message: "Member removed", group: populated });
  } catch (err) {
    console.error("Error removing member:", err);
    res.status(500).json({ message: "Error removing member" });
  }
};

// ✅ Exit group (any member)
exports.exitGroup = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: "Group not found" });

    group.members = group.members.filter((m) => m.toString() !== userId);
    group.admins = group.admins.filter((a) => a.toString() !== userId);

    // Auto-transfer admin if creator exits
    if (group.creator.toString() === userId && group.members.length > 0) {
      group.creator = group.members[0];
      group.admins.push(group.members[0]);
    }

    await group.save();
    await pushAudit(group._id, "exit_group", req.user._id, {});
    res.json({ message: "Exited group successfully" });
  } catch (err) {
    console.error("Error exiting group:", err);
    res.status(500).json({ message: "Error exiting group" });
  }
};

// ✅ Soft delete group (admins only)
exports.deleteGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: "Group not found" });

    if (!group.admins.includes(req.user._id))
      return res.status(403).json({ message: "Admins only" });

    group.deleted = true;
    await group.save();
    await pushAudit(group._id, "delete_group", req.user._id, {});
    res.json({ message: "Group deleted (soft)" });
  } catch (err) {
    console.error("Error deleting group:", err);
    res.status(500).json({ message: "Error deleting group" });
  }
};

// ✅ Send group message
exports.sendGroupMessage = async (req, res) => {
  try {
    const { content } = req.body;
    const groupId = req.params.groupId;
    const senderId = req.user._id;

    if (!content)
      return res.status(400).json({ message: "Message content required" });

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    if (!group.members.includes(senderId))
      return res.status(403).json({ message: "You are not a member of this group" });

    const message = await Message.create({
      sender: senderId,
      group: groupId,
      content,
      type: "text",
    });

    const sender = await User.findById(senderId).select("name");

    await Group.findByIdAndUpdate(groupId, {
      lastMessage: content,
      lastMessageAt: new Date(),
      lastMessageSender: senderId,
      lastMessageSenderName: sender.name,
     });

     await group.save();

    const populated = await message.populate("sender", "name email avatar");

    // Emit message via socket.io
    if (req.io) {
      req.io.to(groupId.toString()).emit("group:message", populated);
    }

    res.status(201).json(populated);
  } catch (err) {
    console.error("Error sending group message:", err);
    res.status(500).json({ message: "Error sending message" });
  }
};

// ✅ Get group messages
exports.getGroupMessages = async (req, res) => {
  try {
    const groupId = req.params.groupId;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    if (!group.members.includes(userId))
      return res.status(403).json({ message: "You are not a member of this group" });

    const messages = await Message.find({ group: groupId })
      .populate("sender", "name email")
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    console.error("Error fetching group messages:", err);
    res.status(500).json({ message: "Error fetching group messages" });
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