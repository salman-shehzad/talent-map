const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    // actor is optional — system-generated events may not have a user actor
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false, default: null },
    action: { type: String, required: true }, // e.g. profile_update, job_create, settings_change
    target: { type: String, default: "" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("AuditLog", auditLogSchema);
