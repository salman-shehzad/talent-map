const jwt = require("jsonwebtoken");

function signToken(user) {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      department: user.department || null
    },
    process.env.JWT_SECRET || "dev-clearance-secret",
    { expiresIn: "8h" }
  );
}

function sanitizeUser(user) {
  const plain = user.toObject ? user.toObject() : user;
  delete plain.password;
  return plain;
}

module.exports = { signToken, sanitizeUser };
