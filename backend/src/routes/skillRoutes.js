const express = require("express");
const { requireAuth, requireRole } = require("../middleware/auth");
const Skill = require("../models/Skill");
const { logActivity } = require("../utils/activity");

const router = express.Router();

// GET all skills
router.get("/", requireAuth, async (req, res) => {
  try {
    const skills = await Skill.find({}).sort({ name: 1 });
    res.json(skills);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to retrieve skill taxonomy." });
  }
});

// POST add a new skill (Staff, Admin, Super Admin)
router.post("/", requireAuth, requireRole("staff", "admin", "super_admin"), async (req, res) => {
  const { name, category, description } = req.body;
  if (!name || !category) {
    return res.status(400).json({ error: "Name and category are required." });
  }

  try {
    const exists = await Skill.findOne({ name: name.trim() });
    if (exists) {
      return res.status(409).json({ error: "Skill already exists." });
    }

    const skill = await Skill.create({
      name: name.trim(),
      category: category.trim(),
      description: description || ""
    });

    await logActivity(req.user._id, "skill_create", `Added skill to taxonomy: ${skill.name}`);
    res.status(201).json(skill);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add skill." });
  }
});

// DELETE a skill (Staff, Admin, Super Admin)
router.delete("/:id", requireAuth, requireRole("staff", "admin", "super_admin"), async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id);
    if (!skill) return res.status(404).json({ error: "Skill not found." });

    await Skill.deleteOne({ _id: req.params.id });
    await logActivity(req.user._id, "skill_delete", `Deleted skill from taxonomy: ${skill.name}`);

    res.json({ message: "Skill deleted successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete skill." });
  }
});

module.exports = router;
