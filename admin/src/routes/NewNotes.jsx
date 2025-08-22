import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);

export default function NotesPage() {
  const { register, handleSubmit, reset } = useForm();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch notes
  const fetchNotes = async () => {
    setLoading(true);
    const res = await fetch("http://localhost:5000/api/notes");
    const data = await res.json();
    setNotes(data.notes);
    setLoading(false);
  };

  // onMount
  useEffect(() => {
    fetchNotes();
  }, []);

  // Create note
  const onSubmit = async (values) => {
    const payload = {
      ...values,
      releaseAt: values.releaseAt
        ? dayjs(values.releaseAt).utc().toISOString()
        : null,
    };
    await fetch("http://localhost:5000/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    reset();
    fetchNotes();
  };

  // Replay note
  const handleReplay = async (id) => {
    await fetch(`http://localhost:5000/api/notes/${id}/replay`, {
      method: "POST",
    });
    fetchNotes();
  };

  // Pulse animation
  const pulse = {
    delivered: {
      scale: [1, 1.05, 1],
      transition: { duration: 0.6 },
    },
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8">
      {/* CREATE FORM */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4 bg-white p-4 rounded shadow"
      >
        <h2 className="text-xl font-semibold">Create Note</h2>
        <input
          {...register("title")}
          placeholder="Title"
          className="w-full border p-2 rounded"
        />
        <textarea
          {...register("body")}
          placeholder="Body"
          className="w-full border p-2 rounded"
        />
        <input
          {...register("releaseAt")}
          type="datetime-local"
          className="w-full border p-2 rounded"
        />
        <input
          {...register("webhookUrl")}
          placeholder="Webhook URL"
          className="w-full border p-2 rounded"
        />
        <button className="w-full bg-blue-600 text-white py-2 rounded">
          Create
        </button>
      </form>

      {/* TABLE */}
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
                const last = n.attempts[n.attempts.length - 1];
                const lastCode = last?.statusCode ?? "-";
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
                        <button
                          className="text-blue-600"
                          onClick={() => handleReplay(n._id)}
                        >
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
