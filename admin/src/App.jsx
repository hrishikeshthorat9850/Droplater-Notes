import React from "react";
import './App.css';
import { Routes, Route } from 'react-router-dom';
import CreateNote from './routes/createNote';
import Notes from './routes/notes';
import NotesPage from "./routes/NewNotes"
function App() {
  return (
    
    <Routes>
      <Route path='/' element={<CreateNote />}/>
      <Route path="/notes" element={<Notes/>} />
      <Route path="/newnote" element={<NotesPage />} />
    </Routes>
  );
}

export default App;
