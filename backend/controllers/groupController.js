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

    const result = await Promise.all(
      groups.map(async (g) => {
        // find the latest message for this group
        const lastMsg = await Message.findOne({ group: g._id })
          .sort({ createdAt: -1 })
          .populate("sender", "name")
          .lean();

        return {
          _id: g._id,
          name: g.name || "Group",
          isGroup: true,
          lastMessage: lastMsg ? lastMsg.content || lastMsg.fileName || "" : "",
          lastMessageSender:
            lastMsg && lastMsg.sender ? String(lastMsg.sender._id) : "",
          lastMessageSenderName:
            lastMsg && lastMsg.sender ? lastMsg.sender.name : "",
          lastMessageTime: lastMsg ? lastMsg.createdAt : g.updatedAt || null,
          imageUrl: g.imageUrl || "",
          members: g.members || [],
          admins: g.admins || [],
        };
      })
    );

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
    const {
      name,
      description = "",
      members = [],
      isPrivate = false,
    } = req.body;
    if (!name.trim())
      return res.status(400).json({ message: "Group name is required" });

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

    const populated = await Group.findById(group._id).populate(
      "creator members admins",
      "name email avatar"
    );

    await pushAudit(group._id, "create_group", req.user._id, { name });
    res.status(201).json(populated);
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
    await pushAudit(group._id, "update_group", req.user._id, {
      name,
      description,
    });

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

    group.members = group.members.filter(
      (m) => m.toString() !== userId.toString()
    );
    group.admins = group.admins.filter(
      (a) => a.toString() !== userId.toString()
    );

    // If removing creator, transfer if needed
    if (group.creator.toString() === userId.toString()) {
      if (group.members.length > 0) {
        group.creator = group.members[0];
        if (!includesId(group.admins, group.creator))
          group.admins.push(group.creator);
      } else {
        // no members left — soft-delete group
        group.deleted = true;
      }
    }

    await group.save();
    await pushAudit(group._id, "remove_member", req.user._id, { userId });

    const populated = await Group.findById(groupId).populate(
      "members admins creator",
      "name email"
    );
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

// ===============================================
// Send Group Message (FINAL WORKING VERSION)
// ===============================================
exports.sendGroupMessage = async (req, res) => {
  try {
    const { content } = req.body;
    const groupId = req.params.groupId;
    const senderId = req.user._id.toString();

    if (!content)
      return res.status(400).json({ message: "Message content required" });

    const group = await Group.findById(groupId)
      .populate("members", "_id name email")
      .populate("admins", "_id name email")
      .populate("creator", "_id name email");

    if (!group) return res.status(404).json({ message: "Group not found" });

    // Membership check
    const memberIds = group.members.map((m) =>
      m._id ? m._id.toString() : m.toString()
    );

    if (!memberIds.includes(senderId)) {
      return res
        .status(403)
        .json({ message: "You are not a member of this group" });
    }

    // Create message
    const message = await Message.create({
      sender: senderId,
      group: groupId,
      content,
      type: "text",
    });

    const sender = await User.findById(senderId).select("name");

    // ===============================================
    // ⭐ UPDATE UNREAD COUNT FOR ALL EXCEPT SENDER
    // ===============================================
    group.unread = group.unread || {};

    memberIds.forEach((memberId) => {
      if (memberId !== senderId) {
        group.unread[memberId] = (group.unread[memberId] || 0) + 1;
      }
    });

    // ===============================================
    // ⭐ UPDATE LAST MESSAGE INFO
    // ===============================================
    group.lastMessage = content;
    group.lastMessageAt = new Date();
    group.lastMessageSender = senderId;
    group.lastMessageSenderName = sender.name;

    await group.save();

    const populated = await message.populate("sender", "name email avatar");

    // ===============================================
    // ⭐ SOCKET EMIT (NO CHANGE)
    // ===============================================
    if (req.io) {
      req.io.to(groupId.toString()).emit("group:message:receive", {
        ...populated.toObject(),
        conversationId: groupId,
      });

      req.io.emit("groups:refresh");
    }

    return res.status(201).json(populated);
  } catch (err) {
    console.error("❌ Error sending group message:", err);
    res.status(500).json({ message: "Error sending message" });
  }
};

// ===============================================
// Upload Group File (FINAL UPDATED VERSION)
// ===============================================
exports.uploadGroupFile = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const { groupId } = req.params;
    const senderId = req.user._id.toString();
    const cloudUrl = req.file.path || req.file.secure_url || req.file.url;

    if (!cloudUrl)
      return res.status(500).json({ error: "Cloudinary upload failed" });

    // Fetch group with members
    const group = await Group.findById(groupId).populate("members", "_id name");
    if (!group) return res.status(404).json({ message: "Group not found" });

    const memberIds = group.members.map((m) => 
      m._id ? m._id.toString() : m.toString());

    // Permission check
    if (!memberIds.includes(senderId)) {
      return res
        .status(403)
        .json({ message: "You are not a member of this group" });
    }

        // Detect type
    const mimetype = req.file.mimetype || "";
    let type = "document";

    if (mimetype.startsWith("image/")) type = "image";
    else if (mimetype.startsWith("video/")) type = "video";
    else if (mimetype.startsWith("audio/")) type = "audio";


    // Create message
    const message = await Message.create({
      sender: senderId,
      group: groupId,
      content: req.file.originalname,
      fileUrl: cloudUrl,
      fileType: mimetype,
      fileName: req.file.originalname,
      type: "file",
    });

    const sender = await User.findById(senderId).select("name");

    memberIds.forEach((memberId) => {
      if (memberId !== senderId) {
        const prev = group.unread.get(memberId) || 0;
        group.unread.set(memberId, prev + 1);
      }
    });

    // ===============================================
    // ⭐ UPDATE LAST MESSAGE INFO
    // ===============================================
    group.lastMessage = req.file.originalname;
    group.lastMessageAt = new Date();
    group.lastMessageSender = senderId;
    group.lastMessageSenderName = sender.name;

    await group.save();

    const populated = await message.populate("sender", "name email avatar");

    // ===============================================
    // ⭐ SOCKET EMIT
    // ===============================================
    req.app
      .get("io")
      ?.to(groupId)
      .emit("group:message:receive", {
        ...populated.toObject(),
        conversationId: groupId,
      });

    req.app.get("io")?.emit("groups:refresh");

    return res.status(201).json(populated);
  } catch (err) {
    console.error("❌ Group file message error:", err);
    return res.status(500).json({ error: "Server error uploading group file" });
  }
};

exports.resetGroupUnread = async (req, res) => {
  const groupId = req.params.groupId;
  const userId = req.user._id.toString();

  const group = await Group.findById(groupId);
  if (!group) return res.status(404).json({ message: "Group not found" });

  group.unread.set(userId, 0);
  
  group.markModified("unread");

  await group.save();

  return res.json({ success: true });
};

// ===============================================
// Get Group Messages
// ===============================================
exports.getGroupMessages = async (req, res) => {
  try {
    const groupId = req.params.groupId;
    const userId = req.user._id.toString();

    const group = await Group.findById(groupId).populate("members", "_id");
    if (!group) return res.status(404).json({ message: "Group not found" });

    const memberIds = group.members.map((m) =>
      m._id ? m._id.toString() : m.toString()
    );

    if (!memberIds.includes(userId))
      return res
        .status(403)
        .json({ message: "You are not a member of this group" });

    const messages = await Message.find({ group: groupId })
      .populate("sender", "name email")
      .sort({ createdAt: 1 });

    return res.json(messages);
  } catch (err) {
    console.error("❌ Error fetching group messages:", err);
    res.status(500).json({ message: "Error fetching group messages" });
  }
};
