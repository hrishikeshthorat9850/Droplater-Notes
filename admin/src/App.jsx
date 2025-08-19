import React from "react";
import './App.css';
import { Routes, Route } from 'react-router-dom';
import CreateNote from './routes/createNote';
import Notes from './routes/notes';
function App() {
  return (
    
    <Routes>
      <Route path='/' element={<CreateNote />}/>
      <Route path="/notes" element={<Notes/>} />
    </Routes>
  );
}

export default App;
