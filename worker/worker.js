const { Worker } = require("bullmq");
const connection = require("../redis/redis");
const axios = require("axios");
const Note = require("../mongo/models/Notes");
const dbConnection = require("../mongo/MongoClient");
const mongoose = require("mongoose");
const crypto = require("crypto");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
dayjs.extend(utc);

console.log("✅ Worker Starts...");

function generateIdempotencyKey(noteId, releaseAt) {
  return crypto.createHash("sha256").update(`${noteId}:${releaseAt}`).digest("hex");
}

// Retry helper with exponential backoff (max 3 tries)
async function deliverWithRetry(url, payload, headers) {
  const backoffs = [1000, 5000, 25000]; // 1s → 5s → 25s
  let lastErr;

  for (let i = 0; i < backoffs.length; i++) {
    try {
      return await axios.post(url, payload, { headers });
    } catch (err) {
      lastErr = err;
      if (i < backoffs.length - 1) {
        console.warn(`Retrying in ${backoffs[i]}ms...`);
        await new Promise((res) => setTimeout(res, backoffs[i]));
      }
    }
  }
  throw lastErr;
}

async function startWorker() {
  await dbConnection();

  const worker = new Worker(
    "notes-queue",
    async (job) => {
      const { newNote } = job.data;
      console.log("Processing Job:", job.id, newNote.title);

      const noteId = new mongoose.Types.ObjectId(newNote._id);
      const releaseTimeUTC = dayjs(newNote.releaseAt).utc().toISOString();
      const nowUTCDate = dayjs().utc().toDate(); // current UTC Date
      const payload = {
        title: newNote.title,
        body: newNote.body,
        releaseAt: releaseTimeUTC,
        webhookUrl: newNote.webhookUrl,
        status: newNote.status,
        _id: newNote._id,
      };

      const idempotencyKey = generateIdempotencyKey(newNote._id, newNote.releaseAt);
      console.log("Idempotency Key is:", idempotencyKey);

      try {
        const response = await deliverWithRetry(newNote.webhookUrl, payload, {
          "Content-Type": "application/json",
          "X-Note-Id": newNote._id,
          "X-Idempotency-Key": idempotencyKey,
        });

        await Note.findByIdAndUpdate(
          noteId,
          {
            status: "delivered",
            deliveredAt: nowUTCDate,
            $push: {
              attempts: {
                at: nowUTCDate,
                statusCode: response.status,
                ok: true,
                error: null,
              },
            },
          },
          { new: true }
        );

        return { status: "delivered", noteId: newNote._id };
      } catch (err) {
        console.warn("Webhook failed → fallback to sink...");

        try {
          // 🔹 Try sink with retries
          const sinkResponse = await deliverWithRetry(
            process.env.SINK_URL,
            payload,
            {
              "Content-Type": "application/json",
              "X-Note-Id": newNote._id,
              "X-Idempotency-Key": idempotencyKey,
            }
          );

          await Note.findByIdAndUpdate(
            noteId,
            {
              status: "failed", // failed to main webhook, but reached sink
              deliveredAt: new Date(),
              $push: {
                attempts: {
                  at: new Date(),
                  statusCode: sinkResponse.status,
                  ok: true,
                  error: null,
                },
              },
            },
            { new: true }
          );

          return { status: "failed", noteId: newNote._id };
        } catch (sinkErr) {
          // 🔹 Final fail → mark as dead
          await Note.findByIdAndUpdate(
            noteId,
            {
              status: "dead",
              $push: {
                attempts: {
                  at: new Date(),
                  statusCode: sinkErr.response?.status || 500,
                  ok: false,
                  error: sinkErr.message,
                },
              },
            },
            { new: true }
          );
          throw sinkErr;
        }
      }
    },
    { connection }
  );

  await new Promise((resolve) => worker.on("ready", resolve)); // wait until ready

  worker.on("completed", (job) => {
    console.log(`✅ Job ${job.id} completed:`, job.returnvalue);
  });

  worker.on("failed", (job, err) => {
    console.error(`❌ Job ${job?.id} failed:`, err.message);
  });

  return worker; // for test shutdown
}

startWorker();

module.exports = { startWorker };