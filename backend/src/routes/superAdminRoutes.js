const express = require("express");
const mongoose = require("mongoose");
const { requireAuth, requireRole } = require("../middleware/auth");
const SystemConfig = require("../models/SystemConfig");
const User = require("../models/User");
const Job = require("../models/Job");
const AuditLog = require("../models/AuditLog");
const { logActivity } = require("../utils/activity");

const router = express.Router();

// GET health statistics (Super Admin only)
router.get("/health", requireAuth, requireRole("super_admin"), async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState;
    const states = ["disconnected", "connected", "connecting", "disconnecting"];
    const status = states[dbState] || "unknown";

    const totalUsers = await User.countDocuments();
    const totalJobs = await Job.countDocuments();
    const totalLogs = await AuditLog.countDocuments();

    res.json({
      dbStatus: status,
      dbName: mongoose.connection.name,
      uptime: process.uptime(), // Node.js uptime in seconds
      memoryUsage: process.memoryUsage(),
      counts: {
        users: totalUsers,
        jobs: totalJobs,
        auditLogs: totalLogs
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch platform health metrics." });
  }
});

// GET global system configuration (Super Admin only)
router.get("/config", requireAuth, requireRole("super_admin"), async (req, res) => {
  try {
    let config = await SystemConfig.findOne();
    if (!config) {
      config = await SystemConfig.create({ skillWeight: 70, interestWeight: 30 });
    }
    res.json(config);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to retrieve system settings." });
  }
});

// PUT update global system configuration (Super Admin only)
router.put("/config", requireAuth, requireRole("super_admin"), async (req, res) => {
  const { skillWeight, interestWeight } = req.body;
  if (skillWeight === undefined || interestWeight === undefined) {
    return res.status(400).json({ error: "Missing skillWeight or interestWeight." });
  }

  const sWeight = Number(skillWeight);
  const iWeight = Number(interestWeight);

  if (isNaN(sWeight) || isNaN(iWeight) || sWeight < 0 || sWeight > 100 || iWeight < 0 || iWeight > 100) {
    return res.status(400).json({ error: "Weights must be numbers between 0 and 100." });
  }

  if (sWeight + iWeight !== 100) {
    return res.status(400).json({ error: "Skill weight and interest weight must sum to 100%." });
  }

  try {
    let config = await SystemConfig.findOne();
    if (!config) {
      config = new SystemConfig();
    }
    config.skillWeight = sWeight;
    config.interestWeight = iWeight;
    await config.save();

    await logActivity(req.user._id, "settings_change", `Updated recommendation engine weights: Skill=${sWeight}%, Interest=${iWeight}%`);
    res.json({ message: "System configuration updated.", config });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update system settings." });
  }
});

module.exports = router;
