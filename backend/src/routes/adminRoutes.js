const express = require("express");
const PDFDocument = require("pdfkit");
const { requireAuth, requireRole } = require("../middleware/auth");
const User = require("../models/User");
const Job = require("../models/Job");
const Skill = require("../models/Skill");
const LearningResource = require("../models/LearningResource");
const SystemConfig = require("../models/SystemConfig");
const AuditLog = require("../models/AuditLog");
const { getRecommendations } = require("../utils/recommendationEngine");
const { logActivity } = require("../utils/activity");

const router = express.Router();

// GET platform analytics (Admin, Super Admin)
router.get("/analytics", requireAuth, requireRole("admin", "super_admin"), async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const studentCount = await User.countDocuments({ role: "student" });
    const staffCount = await User.countDocuments({ role: "staff" });
    const adminCount = await User.countDocuments({ role: "admin" });
    const superAdminCount = await User.countDocuments({ role: "super_admin" });

    const totalJobs = await Job.countDocuments();
    const totalSkills = await Skill.countDocuments();
    const totalResources = await LearningResource.countDocuments();

    // 1. Popular job categories based on job postings
    const categoryStats = await Job.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    const popularCategories = categoryStats.map(c => ({ name: c._id, count: c.count }));

    // 2. Average match score across all students
    const jobs = await Job.find({});
    const students = await User.find({ role: "student" });
    let config = await SystemConfig.findOne();
    if (!config) {
      config = { skillWeight: 70, interestWeight: 30 };
    }

    let totalScoreSum = 0;
    let totalMatchesCount = 0;

    if (jobs.length > 0 && students.length > 0) {
      students.forEach(student => {
        const matches = getRecommendations(student, jobs, config);
        matches.forEach(m => {
          totalScoreSum += m.score;
          totalMatchesCount++;
        });
      });
    }
    const averageMatchScore = totalMatchesCount > 0 ? Math.round(totalScoreSum / totalMatchesCount) : 0;

    res.json({
      metrics: {
        totalUsers,
        studentCount,
        staffCount,
        adminCount,
        superAdminCount,
        totalJobs,
        totalSkills,
        totalResources,
        averageMatchScore
      },
      popularCategories
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load platform analytics." });
  }
});

// GET list of all users and roles (Admin, Super Admin)
router.get("/users", requireAuth, requireRole("admin", "super_admin"), async (req, res) => {
  try {
    const users = await User.find({}).select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to retrieve user list." });
  }
});

// PATCH change user role (Admin, Super Admin)
router.patch("/users/:id/role", requireAuth, requireRole("admin", "super_admin"), async (req, res) => {
  const { role } = req.body;
  if (!role || !["student", "staff", "admin", "super_admin"].includes(role)) {
    return res.status(400).json({ error: "Invalid or missing role." });
  }

  try {
    // Prevent changing own role
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({ error: "You cannot change your own role." });
    }

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return res.status(404).json({ error: "User not found." });

    const oldRole = targetUser.role;
    targetUser.role = role;
    await targetUser.save();

    await logActivity(req.user._id, "role_change", `Changed role of user ${targetUser.email} from ${oldRole} to ${role}`);
    res.json({ message: "User role updated successfully.", user: targetUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update user role." });
  }
});

// GET all audit logs (Admin, Super Admin)
router.get("/audit-logs", requireAuth, requireRole("admin", "super_admin"), async (req, res) => {
  try {
    const logs = await AuditLog.find({})
      .populate("actor", "name email role")
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to retrieve audit logs." });
  }
});

// GET export PDF analytics report (Admin, Super Admin)
router.get("/reports/pdf", requireAuth, requireRole("admin", "super_admin"), async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const studentCount = await User.countDocuments({ role: "student" });
    const staffCount = await User.countDocuments({ role: "staff" });
    const adminCount = await User.countDocuments({ role: "admin" });
    const superAdminCount = await User.countDocuments({ role: "super_admin" });

    const totalJobs = await Job.countDocuments();
    const totalSkills = await Skill.countDocuments();
    const totalResources = await LearningResource.countDocuments();

    const categoryStats = await Job.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=talentmap-analytics-report.pdf");
    doc.pipe(res);

    // Header
    doc.fillColor("#0f766e").fontSize(26).text("TALENTMAP PLATFORM REPORT", { align: "center" });
    doc.moveDown(0.3);
    doc.fillColor("#647084").fontSize(10).text(`Generated on: ${new Date().toLocaleString()}`, { align: "center" });
    doc.moveDown(1.5);

    // Horizontal line separator
    doc.strokeColor("#d8dee8").moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(1.5);

    // Section 1: Summary Metrics
    doc.fillColor("#1c2331").fontSize(16).text("System Statistics Summary");
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor("#334155");
    doc.text(`Total Accounts Registered: ${totalUsers}`);
    doc.text(`Total Active Job Postings: ${totalJobs}`);
    doc.text(`Total Skills in Taxonomy: ${totalSkills}`);
    doc.text(`Total Curated Learning Resources: ${totalResources}`);
    doc.moveDown(1.5);

    // Section 2: Roles Breakdown
    doc.fillColor("#1c2331").fontSize(16).text("User Role Breakdown");
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor("#334155");
    doc.text(`- Candidates (Students): ${studentCount}`);
    doc.text(`- Content Managers (Staff): ${staffCount}`);
    doc.text(`- Platform Administrators: ${adminCount}`);
    doc.text(`- Super Administrators: ${superAdminCount}`);
    doc.moveDown(1.5);

    // Section 3: Job Listings Category Breakdown
    doc.fillColor("#1c2331").fontSize(16).text("Job Postings by Category");
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor("#334155");
    if (categoryStats.length === 0) {
      doc.text("No job listings posted yet.");
    } else {
      categoryStats.forEach(stat => {
        doc.text(`- ${stat._id || "Uncategorized"}: ${stat.count} job(s)`);
      });
    }
    doc.moveDown(2);

    // Footer
    doc.fontSize(9).fillColor("#9ca3af").text("TalentMap Platform | Final Year Project COMSATS", { align: "center" });

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate PDF report." });
  }
});

module.exports = router;
