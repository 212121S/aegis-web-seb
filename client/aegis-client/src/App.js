import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import TestSession from "./components/TestSession";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/test" element={<TestSession />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;