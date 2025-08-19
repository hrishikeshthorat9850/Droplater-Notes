// sink.js
/**
 * Step 5 – Webhook Receiver (“Sink” Service)
 *
 * This is a tiny Express app running on a separate port.
 * It accepts POST /sink and implements idempotency using Redis:
 *
 *  - Reads the X-Idempotency-Key header
 *  - Uses Redis SETNX + EX 86400 (1-day TTL) to ensure the payload
 *    is processed only once
 *  - If the key already exists → immediately return 200 (duplicate)
 *  - If the key is not present → log the request body and return 200
 *
 * Purpose:
 *   Proves exactly-once delivery behavior end-to-end.
 *   The sink is intentionally kept “dumb and obvious” – it does
 *   no business logic / no DB writes – just logs on first delivery.
 */

const express = require("express");
const redis = require("redis");
const bodyParser = require("body-parser");

const app = express();
const PORT = 4000; // separate port from your main app

app.use(bodyParser.json());

// Connect to Redis
const redisClient = redis.createClient({ url: "redis://127.0.0.1:6379" });
redisClient.connect().then(() => {
  console.log("Redis connected ✅");
}).catch(console.error);

// POST /sink
app.post("/sink", async (req, res) => {
  try {
    const idempotencyKey = req.header("X-Idempotency-Key");
    if (!idempotencyKey) {
      return res.status(400).send("Missing X-Idempotency-Key header");
    }

    // SETNX: set if not exists, expire in 1 day (86400 seconds)
    const set = await redisClient.set(idempotencyKey, "1", {
      NX: true,
      EX: 86400,
    });

    if (!set) {
      // Key already exists → duplicate
      console.log(`Duplicate request ignored: ${idempotencyKey}`);
      return res.status(200).send("Duplicate request");
    }

    // First time → log body
    console.log("Received payload:", req.body);

    return res.status(200).send("Received successfully");
  } catch (err) {
    console.error("Error in /sink:", err.message);
    res.status(500).send("Internal Server Error");
  }
});

app.listen(PORT, () => {
  console.log(`Sink service running on http://localhost:${PORT}`);
});
