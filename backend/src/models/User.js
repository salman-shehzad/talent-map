const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["student", "staff", "admin", "super_admin"], default: "student" },
    active: { type: Boolean, default: true },
    // Profile information for students (Registered Users)
    skills: { type: [String], default: [] },
    interests: { type: [String], default: [] },
    experienceLevel: { type: String, enum: ["entry", "mid", "senior"], default: "entry" },
    careerGoals: { type: String, default: "" },
    savedJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Job", default: [] }]
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
