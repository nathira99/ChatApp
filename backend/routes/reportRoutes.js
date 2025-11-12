const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  createReport,
  getReports,
  updateReportStatus,
  deleteReport,
} = require("../controllers/reportController");

// Create report (user or group)
router.post("/", protect, createReport);

// Admin: get all reports
router.get("/", protect, getReports);

// Admin: update report status (pending → reviewed/resolved)
router.put("/:id/status", protect, updateReportStatus);

// Admin: delete a report
router.delete("/:id", protect, deleteReport);

module.exports = router;