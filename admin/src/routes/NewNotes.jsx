// src/pages/Notes.jsx
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

export default function NotesPage() {
  const { register, handleSubmit, reset } = useForm();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all notes
  const fetchNotes = async () => {
    setLoading(true);
    const res = await fetch("http://localhost:5000/api/notes");
    const data = await res.json();
    setNotes(data.notes);
    setLoading(false);
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  // Create new note
  const onSubmit = async (values) => {
    await fetch("http://localhost:5000/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    reset();
    fetchNotes();
  };

  // Replay (requeue)
  const handleReplay = async (noteId) => {
    await fetch(`http://localhost:5000/api/notes/${noteId}/replay`, {
      method: "POST",
    });
    fetchNotes();
  };

  // Pulse variant
  const pulse = {
    delivered: {
      scale: [1, 1.05, 1],
      transition: { duration: 0.6 },
    },
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8">
      {/* Create Form */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-3 border p-4 rounded"
      >
        <h2 className="font-semibold mb-2">Create Note</h2>
        <input
          placeholder="Title"
          {...register("title")}
          className="border w-full p-2"
        />
        <textarea
          placeholder="Body"
          {...register("body")}
          className="border w-full p-2"
        />
        <input
          placeholder="Release At (ISO format)"
          {...register("releaseAt")}
          className="border w-full p-2"
        />
        <input
          placeholder="Webhook URL"
          {...register("webhookUrl")}
          className="border w-full p-2"
        />
        <button className="border px-4 py-2">Create</button>
      </form>

      {/* Table */}
      <div>
        <h2 className="font-semibold mb-2">Notes</h2>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <table className="w-full border">
            <thead>
              <tr>
                <th className="border p-2">ID</th>
                <th className="border p-2">Title</th>
                <th className="border p-2">Status</th>
                <th className="border p-2">Last Code</th>
                <th className="border p-2">Replay</th>
              </tr>
            </thead>
            <tbody>
              {notes.map((n) => {
                const lastAttempt = n.attempts[n.attempts.length - 1];
                const lastCode = lastAttempt?.statusCode ?? "-";
                const isDelivered =
                  n.status === "delivered" ||
                  n.status === "delivered-via-sink";

                return (
                  <motion.tr
                    key={n._id}
                    animate={isDelivered ? "delivered" : undefined}
                    variants={pulse}
                    className={isDelivered ? "bg-green-50" : ""}
                  >
                    <td className="border p-2">{n._id}</td>
                    <td className="border p-2">{n.title}</td>
                    <td className="border p-2">{n.status}</td>
                    <td className="border p-2">{lastCode}</td>
                    <td className="border p-2">
                      {n.status === "failed" && (
                        <button onClick={() => handleReplay(n._id)}>
                          Replay
                        </button>
                      )}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
