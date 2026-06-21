const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    company: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true }, // e.g., Web Development, Data Science
    requiredSkills: { type: [String], default: [] },
    experienceLevel: { type: String, enum: ["entry", "mid", "senior"], default: "entry" },
    salaryRange: { type: String, default: "" },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Job", jobSchema);
