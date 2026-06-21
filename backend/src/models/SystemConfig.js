const mongoose = require("mongoose");

const systemConfigSchema = new mongoose.Schema(
  {
    skillWeight: { type: Number, default: 70, min: 0, max: 100 },
    interestWeight: { type: Number, default: 30, min: 0, max: 100 },
    notificationRules: { type: Map, of: Boolean, default: {} },
    globalSettings: { type: Map, of: String, default: {} }
  },
  { timestamps: true }
);

module.exports = mongoose.model("SystemConfig", systemConfigSchema);
