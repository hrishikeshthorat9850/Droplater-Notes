// worker.js
const { Worker } = require("bullmq");
const connection = require("../redis/redis");
const axios = require("axios");
const Note = require("../mongo/models/Notes");
const dbConnection = require("../mongo/MongoClient");
const mongoose = require("mongoose");

async function startWorker() {
  // Connect to MongoDB first
  await dbConnection();

  const worker = new Worker(
    "notes-queue",
    async (job) => {
      const { newNote } = job.data;
      console.log("Processing Job:", job.id, newNote.title);

      // Convert string _id to ObjectId
      const noteId = new mongoose.Types.ObjectId(newNote._id);

      // Create a plain JS payload to avoid Mongoose serialization issues
      const payload = {
        title: newNote.title,
        body: newNote.body,
        releaseAt: newNote.releaseAt,
        webhookUrl: newNote.webhookUrl,
        status: newNote.status,
        _id: newNote._id,
      };

      try {
        // Call the webhook
        const response = await axios.post(newNote.webhookUrl, payload, {
          headers: { "Content-Type": "application/json" },
        });
        console.log("Webhook response status:", response.status);

        const updatedPayload = {
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
        };

        // Update the note in MongoDB
        const updatedNote = await Note.findByIdAndUpdate(
          noteId,
          updatedPayload,
          { new: true } // return the updated document
        );

        if (!updatedNote) {
          console.error("MongoDB update failed: note not found", newNote._id);
        } else {
          console.log("Job Completed and DB updated:", updatedNote._id);
        }

        return { status: "delivered", noteId: newNote._id };

      } catch (err) {
        console.error(`Job ${job.id} failed for note ${newNote._id}:`, err.message);

        // Update the note as failed
        try {
          const failedUpdate = await Note.findByIdAndUpdate(
            noteId,
            {
              status: "failed",
              $push: {
                attempts: {
                  at: new Date(),
                  statusCode: err.response?.status || 500,
                  ok: false,
                  error: err.message,
                },
              },
            },
            { new: true }
          );

          if (!failedUpdate) {
            console.error("MongoDB update failed for failed job:", newNote._id);
          }
        } catch (dbErr) {
          console.error("Error updating note as failed:", dbErr.message);
        }

        throw err; // mark the job as failed in BullMQ
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

// Start the worker
startWorker().catch((err) => console.error("Worker failed to start:", err));
