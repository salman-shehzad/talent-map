const express = require("express");
const { requireAuth, requireRole } = require("../middleware/auth");
const Job = require("../models/Job");
const { logActivity } = require("../utils/activity");

const router = express.Router();

// GET all jobs
router.get("/", requireAuth, async (req, res) => {
  try {
    const jobs = await Job.find({}).populate("postedBy", "name email");
    res.json(jobs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to retrieve job listings." });
  }
});

// POST add a new job (Staff, Admin, Super Admin)
router.post("/", requireAuth, requireRole("staff", "admin", "super_admin"), async (req, res) => {
  const { title, description, company, location, category, requiredSkills, experienceLevel, salaryRange } = req.body;
  
  if (!title || !description || !company || !location || !category) {
    return res.status(400).json({ error: "Missing required fields (title, description, company, location, category)." });
  }

  try {
    const job = await Job.create({
      title,
      description,
      company,
      location,
      category,
      requiredSkills: Array.isArray(requiredSkills) ? requiredSkills.map(s => s.trim()) : [],
      experienceLevel: experienceLevel || "entry",
      salaryRange: salaryRange || "",
      postedBy: req.user._id
    });

    await logActivity(req.user._id, "job_create", `Created job listing: ${job.title} at ${job.company}`);
    res.status(201).json(job);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create job listing." });
  }
});

// PUT update a job (Staff, Admin, Super Admin)
router.put("/:id", requireAuth, requireRole("staff", "admin", "super_admin"), async (req, res) => {
  const { title, description, company, location, category, requiredSkills, experienceLevel, salaryRange } = req.body;

  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: "Job listing not found." });

    if (title) job.title = title;
    if (description) job.description = description;
    if (company) job.company = company;
    if (location) job.location = location;
    if (category) job.category = category;
    if (Array.isArray(requiredSkills)) job.requiredSkills = requiredSkills.map(s => s.trim());
    if (experienceLevel) job.experienceLevel = experienceLevel;
    if (salaryRange !== undefined) job.salaryRange = salaryRange;

    await job.save();
    await logActivity(req.user._id, "job_update", `Updated job listing: ${job.title}`);

    res.json(job);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update job listing." });
  }
});

// DELETE a job (Staff, Admin, Super Admin)
router.delete("/:id", requireAuth, requireRole("staff", "admin", "super_admin"), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: "Job listing not found." });

    await Job.deleteOne({ _id: req.params.id });
    await logActivity(req.user._id, "job_delete", `Deleted job listing: ${job.title}`);

    res.json({ message: "Job listing deleted successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete job listing." });
  }
});

module.exports = router;
