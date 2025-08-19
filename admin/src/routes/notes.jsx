import { useState, useEffect } from "react";

export default function Notes() {
  const [notes, setNotes] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1); // fallback
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);


  const fetchNotes = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `http://localhost:5000/api/notes?status=${status}&page=${page}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();

      // If API returns array directly, data is the notes array
      setNotes(Array.isArray(data) ? data : data.notes || []);
      
      // Handle totalPages safely
      setTotalPages(data.totalPages || 1);
    } catch (e) {
      console.error("Error fetching notes:", e);
      setError("Failed to fetch notes.");
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }
  const sendToSink = async () => {
    try {
      const res = await fetch("http://localhost:4000/sink", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Idempotency-Key": "test123",
        },
        body: JSON.stringify({ message: "Hello from frontend" }),
      });

      const data = await res.text();
      console.log("Sink response:", data);
    } catch (err) {
      console.error(err);
    }
  };



  const handleReplay = async (id) => {
    console.log("Id , when click Replay Button :",id);
    try {
      const response = await fetch(`http://localhost:5000/api/notes/${id}/replay`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to requeue note");
      }

      const data = await response.json();
      console.log("Requeued:", data);
      alert("Note requeued successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to requeue note");
  }
}

  
  useEffect(() => {
    fetchNotes();
  }, []);

  return (
    <div>
      <h2>Notes</h2>

      {/* Status filter */}
      <div>
        <label>Status: </label>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="done">Done</option>
        </select>
      </div>

      {/* Loading / error */}
      {loading && <p>Loading notes...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* Notes list */}
      <ul>
        {notes.length > 0 ? (
          notes.map((note) => {
            return(
            <div key={note._id}>
              <h4>Title : <b>{note.title}</b></h4>
              <p>Status : <b>{note.status}</b></p>
              {note.status== ("failed") &&
              <div>
                <button 
                  onClick={()=>(handleReplay(note._id))}
                >Replay</button>
                <button onClick={sendToSink}>sendToSink</button>
              </div>
              }
            </div>
            )
          })
        ) : (
          !loading && <li>No notes found.</li>
        )}
      </ul>

      {/* Pagination */}
      <div>
        <button onClick={() => setPage((p) => Math.max(p - 1, 1))} disabled={page === 1}>
          Prev
        </button>
        <span> Page {page} of {totalPages} </span>
        <button
          onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
          disabled={page === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
}
