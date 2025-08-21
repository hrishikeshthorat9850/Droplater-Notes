const { Worker } = require("bullmq");
const connection = require("../redis/redis");
const axios = require("axios");
const Note = require("../mongo/models/Notes");
const dbConnection = require("../mongo/MongoClient");
const mongoose = require("mongoose");
console.log("✅Worker Starts...");
async function startWorker() {
  await dbConnection();
  const worker = new Worker(
    "notes-queue",
    async (job) => {
      const { newNote } = job.data;
      console.log("Processing Job:", job.id, newNote.title);

      const noteId = new mongoose.Types.ObjectId(newNote._id);
      const payload = {
        title: newNote.title,
        body: newNote.body,
        releaseAt: newNote.releaseAt,
        webhookUrl: newNote.webhookUrl,
        status: newNote.status,
        _id: newNote._id,
      };

      try {
        const response = await axios.post(newNote.webhookUrl, payload, {
          headers: { "Content-Type": "application/json" },
        });

        await Note.findByIdAndUpdate(
          noteId,
          {
            status: "delivered",
            deliveredAt: new Date(),
            $push: {
              attempts: {
                at: new Date(),
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
          const sinkResponse = await axios.post(
            "http://localhost:4000/sink",
            payload,
            { headers: { "Content-Type": "application/json", "X-Idempotency-Key": newNote._id.toString() } }
          );

          await Note.findByIdAndUpdate(
            noteId,
            {
              status: "failed",
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
          await Note.findByIdAndUpdate(
            noteId,
            {
              status: "failed",
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
    console.log(`Job ${job.id} completed with return value:`, job.returnvalue);
  });

  worker.on("failed", (job, err) => {
    console.error(`Job ${job.id} failed with error:`, err.message);
  });

  return worker; // return the worker so test can close it
}

module.exports = { startWorker };
