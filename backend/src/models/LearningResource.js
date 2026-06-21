const mongoose = require("mongoose");

const learningResourceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    provider: { type: String, required: true, trim: true }, // e.g. Coursera, Udemy
    url: { type: String, required: true, trim: true },
    skillsTaught: { type: [String], default: [] },
    type: { type: String, enum: ["course", "certification"], default: "course" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("LearningResource", learningResourceSchema);
