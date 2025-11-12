const Report = require("../models/Report");
const Group = require("../models/Group");
const User = require("../models/User");

// ✅ Create report (for user or group)
exports.createReport = async (req, res) => {
  try {
    const { reason, userId, groupId } = req.body;

    if (!reason) return res.status(400).json({ message: "Reason is required" });
    if (!userId && !groupId)
      return res.status(400).json({ message: "Target missing (userId or groupId)" });

    const reportData = {
      reporter: req.user._id,
      reason,
    };

    if (userId) reportData.targetUser = userId;
    if (groupId) reportData.targetGroup = groupId;

    const report = await Report.create(reportData);
    res.status(201).json(report);
  } catch (err) {
    console.error("Error creating report:", err);
    res.status(500).json({ message: "Server error creating report" });
  }
};

// ✅ Get all reports (admin only)
exports.getReports = async (req, res) => {
  try {
    const reports = await Report.find()
      .populate("reporter", "name email")
      .populate("targetUser", "name email")
      .populate("targetGroup", "name")
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (err) {
    console.error("Error loading reports:", err);
    res.status(500).json({ message: "Server error fetching reports" });
  }
};

// ✅ Update report status
exports.updateReportStatus = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: "Report not found" });

    report.status = req.body.status || report.status;
    await report.save();

    res.json({ message: "Report status updated", report });
  } catch (err) {
    console.error("Error updating report status:", err);
    res.status(500).json({ message: "Error updating status" });
  }
};

// ✅ Delete report
exports.deleteReport = async (req, res) => {
  try {
    await Report.findByIdAndDelete(req.params.id);
    res.json({ message: "Report deleted" });
  } catch (err) {
    console.error("Error deleting report:", err);
    res.status(500).json({ message: "Error deleting report" });
  }
};