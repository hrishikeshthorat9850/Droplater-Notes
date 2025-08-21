const dotenv = require("dotenv");
dotenv.config();
const Redis = require("ioredis");

const connection = new Redis({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: process.env.REDIS_PORT || 6379,
  maxRetriesPerRequest: null,
});

// Catch connection errors
connection.on("error", (err) => {
  console.error("Redis connection error:", err);
});

connection.on("connect", () => {
  console.log("✅ Connected to Redis");
});

module.exports = connection;
