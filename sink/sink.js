
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const PORT = 4000; // separate port from your main app
const dotenv = require("dotenv");
dotenv.config();
app.use(bodyParser.json());
const connection = require("../redis/redis");

// POST /sink
app.post("/sink", async (req, res) => {
  try {
    const idempotencyKey = req.header("X-Idempotency-Key");
    if (!idempotencyKey) {
      return res.status(400).send("Missing X-Idempotency-Key header");
    }

    // SETNX: set if not exists, expire in 1 day (86400 seconds)
    const set = await connection.set(idempotencyKey, "1", "NX", "EX", 86400);

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

app.listen(PORT,'0.0.0.0', () => {
  console.log(`Sink service running on ${process.env.SINK_URL}`);
});