const express = require("express");
const { requireAuth, requireRole } = require("../middleware/auth");
const LearningResource = require("../models/LearningResource");
const { logActivity } = require("../utils/activity");

const router = express.Router();

// GET all learning resources
router.get("/", requireAuth, async (req, res) => {
  try {
    const resources = await LearningResource.find({}).sort({ title: 1 });
    res.json(resources);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to retrieve learning resources." });
  }
});

// POST add a learning resource (Staff, Admin, Super Admin)
router.post("/", requireAuth, requireRole("staff", "admin", "super_admin"), async (req, res) => {
  const { title, provider, url, skillsTaught, type } = req.body;
  if (!title || !provider || !url) {
    return res.status(400).json({ error: "Title, provider, and URL are required." });
  }

  try {
    const resource = await LearningResource.create({
      title: title.trim(),
      provider: provider.trim(),
      url: url.trim(),
      skillsTaught: Array.isArray(skillsTaught) ? skillsTaught.map(s => s.trim()) : [],
      type: type || "course"
    });

    await logActivity(req.user._id, "resource_create", `Added learning resource: ${resource.title}`);
    res.status(201).json(resource);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create learning resource." });
  }
});

// DELETE a learning resource (Staff, Admin, Super Admin)
router.delete("/:id", requireAuth, requireRole("staff", "admin", "super_admin"), async (req, res) => {
  try {
    const resource = await LearningResource.findById(req.params.id);
    if (!resource) return res.status(404).json({ error: "Learning resource not found." });

    await LearningResource.deleteOne({ _id: req.params.id });
    await logActivity(req.user._id, "resource_delete", `Deleted learning resource: ${resource.title}`);

    res.json({ message: "Learning resource deleted successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete learning resource." });
  }
});

module.exports = router;
