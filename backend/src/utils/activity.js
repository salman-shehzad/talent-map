const AuditLog = require("../models/AuditLog");
const Notification = require("../models/Notification");

async function logActivity(actor, action, target = "") {
  await AuditLog.create({ actor: actor || null, action, target });
}

async function notify(user, title, message) {
  await Notification.create({ user, title, message });
}

module.exports = { logActivity, notify };
