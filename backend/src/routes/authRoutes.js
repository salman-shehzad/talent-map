const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { signToken, sanitizeUser } = require("../utils/auth");
const { logActivity } = require("../utils/activity");

const router = express.Router();

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email, and password are required." });
  }

  try {
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(409).json({ error: "Email already exists." });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: await bcrypt.hash(password, 12),
      role: "student", // default role for self-registration
      skills: [],
      interests: [],
      experienceLevel: "entry"
    });

    await logActivity(user._id, "Registered account", user.email);
    res.status(201).json({ token: signToken(user), user: sanitizeUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to register user." });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  try {
    const user = await User.findOne({ email: String(email).toLowerCase(), active: true });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    await logActivity(user._id, "Logged in", user.email);
    res.json({ token: signToken(user), user: sanitizeUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to log in." });
  }
});

module.exports = router;
