// Vercel Serverless Entry Point
// This file is the handler Vercel invokes for all /api/* requests.
// On Vercel, env vars are set via the dashboard (no .env file needed).
// Locally, app.js loads dotenv from backend/.env.

const app = require("../backend/app");

module.exports = app;
