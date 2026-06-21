const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function requireAuth(req, res, next) {
  try {
    const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
    if (!token) return res.status(401).json({ error: "Authentication required." });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev-clearance-secret");
    const user = await User.findById(decoded.id);
    if (!user || !user.active) return res.status(401).json({ error: "Invalid session." });
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid session." });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: "Access denied." });
    next();
  };
}

module.exports = { requireAuth, requireRole };
