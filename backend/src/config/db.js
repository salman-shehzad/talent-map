const mongoose = require("mongoose");

// Cache the connection promise across serverless invocations (also helps local dev)
let cached = global._mongooseConnection;

if (!cached) {
  cached = global._mongooseConnection = { conn: null, promise: null };
}

async function connectDb() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error(
      "MONGO_URI is required. Add it to backend/.env before starting the API."
    );
  }

  // Return existing connection if already established
  if (cached.conn) {
    return cached.conn;
  }

  // If a connection is in progress, wait for it
  if (!cached.promise) {
    cached.promise = mongoose
      .connect(uri, {
        dbName: "talentmap",
        serverSelectionTimeoutMS: 15000,
        socketTimeoutMS: 45000,
        bufferCommands: false,
      })
      .then((m) => {
        console.log(
          `MongoDB connected: ${m.connection.host}/${m.connection.name}`
        );
        return m;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    // Reset on failure so next request retries
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}

module.exports = connectDb;
