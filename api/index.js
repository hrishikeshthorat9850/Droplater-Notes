const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const dotenv = require("dotenv");
dotenv.config();
const Note = require("../mongo/models/Notes");
const { NoteZod } = require("../validation/zodValidation");
const dbConnection = require("../mongo/MongoClient");
const authMiddleware = require("../middleware/auth");
const myQueue = require("../api/queue");
const app = express();
const mongoose = require("mongoose");
// Allow all origins for development
app.use(cors());
app.use(express.json());

// 60 requests per minute / per IP
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
});
app.use(limiter);
const PORT = process.env.PORT || 5000;

async function startServer() {
  await dbConnection();

  // POST route to create a note : /api/notes

  app.post("/api/notes", async (req, res) => {
    try {
      // Parse and validate request body
      const parsedData = NoteZod.parse(req.body);

      // Auto-set releaseAt and default status if missing
      const noteData = {
        ...parsedData,
        releaseAt: parsedData.releaseAt,
        status: parsedData.status || "pending",
      };

      // Insert into MongoDB
      const newNote = await Note.create(noteData);

      //Add to Queue
      await myQueue.add("notes",
        {newNote},
        {delay : 60 * 500});    
      // Send success response
      res.json({ 
        message: "Note created successfully & added to the queue...", 
        data:{
          id : newNote._id,...newNote.toObject()
        }
    });
    } catch (err) {
      // Handle Zod validation errors
      if (err.name === "ZodError") {
        return res.status(400).json({ errors: err.errors });
      }

      console.error("Server error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get Request : /api/notes

  app.get("/api/notes", async (req, res) => {
    try {
      const { status, page = 1 } = req.query;
      const limit = 20;
      const skip = (parseInt(page) - 1) * limit;

      const filter = {};
      if (status) filter.status = status;

      const totalNotes = await Note.countDocuments(filter);
      const notes = await Note.find(filter)
        .sort({ releaseAt: -1 })
        .skip(skip)
        .limit(limit);

      res.json({
        notes,
        totalPages: Math.ceil(totalNotes / limit),
        page: parseInt(page),
        totalNotes
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/health",authMiddleware, (req, res) => {
    res.status(200).json({ ok: true });
  });

    // POST /api/notes/:id/replay
app.post("/api/notes/:id/replay", async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }

    // Only requeue if note is failed or dead
    if (!["failed", "dead"].includes(note.status)) {
      return res.status(400).json({ error: "Note cannot be replayed" });
    }

    // Reset status and add to queue
    note.status = "pending";
    note.deliveredAt = null;
    await note.save();

    await myQueue.add("notes", { newNote: note });

    res.json({ message: "Note requeued successfully", noteId: note._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();

module.exports = app;