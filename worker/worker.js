// worker.js
const { Worker } = require("bullmq");
const connection = require("../redis/redis");
const axios = require("axios");
const Note = require("../mongo/models/Notes");
const dbConnection = require("../mongo/MongoClient");
const mongoose = require("mongoose");

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
        // Step 1 → Send to user webhook
        const response = await axios.post(newNote.webhookUrl, payload, {
          headers: { "Content-Type": "application/json" },
        });
        console.log("Webhook response status:", response.status);

        // Step 2 → If webhook succeeds, update DB and return
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

        // Step 3 → Fallback to SINK with Idempotency Key
        try {
          const sinkResponse = await axios.post(
            "http://localhost:4000/sink",
            payload,
            {
              headers: {
                "Content-Type": "application/json",
                "X-Idempotency-Key": newNote._id.toString(),
              },
            }
          );
          console.log("Sink response:", sinkResponse.data);

          // update delivery status in DB
          await Note.findByIdAndUpdate(
            noteId,
            {
              status: "delivered-via-sink",
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

          return { status: "delivered-via-sink", noteId: newNote._id };

        } catch (sinkErr) {
          // both webhook and sink failed → mark as failed
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

  worker.on("completed", (job) => {
    console.log(`Job ${job.id} completed with return value:`, job.returnvalue);
  });

  worker.on("failed", (job, err) => {
    console.error(`Job ${job.id} failed with error:`, err.message);
  });
}

startWorker().catch((err) => console.error("Worker failed to start:", err));
