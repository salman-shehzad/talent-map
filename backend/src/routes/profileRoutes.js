const express = require("express");
const { requireAuth } = require("../middleware/auth");
const User = require("../models/User");
const Job = require("../models/Job");
const Notification = require("../models/Notification");
const LearningResource = require("../models/LearningResource");
const SystemConfig = require("../models/SystemConfig");
const { getRecommendations } = require("../utils/recommendationEngine");
const { logActivity } = require("../utils/activity");

const router = express.Router();

// GET current user profile, saved jobs, and notifications
router.get("/", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("savedJobs");
    const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(10);
    res.json({ user, notifications });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to retrieve profile data." });
  }
});

// PUT update user profile (skills, interests, experienceLevel, careerGoals)
router.put("/", requireAuth, async (req, res) => {
  const { skills, interests, experienceLevel, careerGoals } = req.body;
  
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: "User not found." });

    if (Array.isArray(skills)) user.skills = skills.map(s => s.trim());
    if (Array.isArray(interests)) user.interests = interests.map(i => i.trim());
    if (experienceLevel) user.experienceLevel = experienceLevel;
    if (careerGoals !== undefined) user.careerGoals = careerGoals;

    await user.save();
    await logActivity(user._id, "profile_update", "Updated profile skills & goals");

    res.json({ message: "Profile updated successfully.", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update profile." });
  }
});

// GET user-specific job recommendations with match scores
router.get("/recommendations", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const jobs = await Job.find({}).populate("postedBy", "name email");

    // Fetch Super Admin configurations (or fallback to defaults)
    let config = await SystemConfig.findOne();
    if (!config) {
      config = { skillWeight: 70, interestWeight: 30 };
    }

    const recommendations = getRecommendations(user, jobs, config);
    
    // Sort recommendations by score descending
    recommendations.sort((a, b) => b.score - a.score);

    res.json({ recommendations });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to compute recommendations. " + err.message });
  }
});

// GET career roadmap details for a specific job
router.get("/roadmap/:jobId", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const job = await Job.findById(req.params.jobId).populate("postedBy", "name email");
    if (!job) return res.status(404).json({ error: "Job listing not found." });

    const userSkillsLower = user.skills.map(s => s.toLowerCase().trim());
    const jobSkills = job.requiredSkills || [];

    // Separate completed skills from missing ones
    const completedSkills = jobSkills.filter(s => userSkillsLower.includes(s.toLowerCase().trim()));
    const gapSkills = jobSkills.filter(s => !userSkillsLower.includes(s.toLowerCase().trim()));

    // Map each gap skill to its matching learning resources
    const allResources = await LearningResource.find({});
    const gaps = gapSkills.map(skill => {
      const matchingResources = allResources.filter(res => 
        (res.skillsTaught || []).map(st => st.toLowerCase().trim()).includes(skill.toLowerCase().trim())
      );
      return {
        skill,
        resources: matchingResources
      };
    });

    res.json({
      job,
      completedSkills,
      gaps
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to compile career roadmap." });
  }
});

// POST bookmark/save a job
router.post("/saved-jobs/:jobId", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const job = await Job.findById(req.params.jobId);
    if (!job) return res.status(404).json({ error: "Job not found." });

    if (!user.savedJobs.includes(job._id)) {
      user.savedJobs.push(job._id);
      await user.save();
      await logActivity(user._id, "bookmark_job", `Bookmarked job: ${job.title}`);
    }

    res.json({ message: "Job bookmarked successfully.", savedJobs: user.savedJobs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to bookmark job." });
  }
});

// DELETE remove saved/bookmarked job
router.delete("/saved-jobs/:jobId", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.savedJobs = user.savedJobs.filter(id => id.toString() !== req.params.jobId);
    await user.save();
    await logActivity(req.user._id, "unbookmark_job", `Removed bookmark for job ID: ${req.params.jobId}`);

    res.json({ message: "Job bookmark removed.", savedJobs: user.savedJobs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to remove bookmarked job." });
  }
});

module.exports = router;
