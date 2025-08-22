const mongoose = require("mongoose");

const AttemptSchema = new mongoose.Schema({
  at: { type: Date, required: true },
  statusCode: { type: Number, required: true },
  ok: { type: Boolean, required: true },
  error: { type: String, default: null },
}, { _id: false });

const NoteSchema = new mongoose.Schema({
  title: { type: String, required: true },
  body: { type: String, required: true },
  releaseAt: { type: Date, required:true},
  webhookUrl: { type: String, required: true },
  status: { 
    type: String, 
    enum: ["pending", "delivered", "failed", "dead"],
    default: "pending" 
  },
  attempts: { type: [AttemptSchema], default: [] },
  deliveredAt: { type: Date, default: null },
});

// ✅ Indexes
NoteSchema.index({ releaseAt: 1 }); // Ascending index for due notes
NoteSchema.index({ status: 1 }); // Index for querying by status

const Note = mongoose.model("Note", NoteSchema);

module.exports = Note;
