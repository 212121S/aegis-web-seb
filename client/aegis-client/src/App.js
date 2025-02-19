// client/aegis-client/src/App.js
import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import HomePage from "./components/HomePage";
import Register from "./components/Register";

function App() {
  return (
    <BrowserRouter>
      <nav style={styles.nav}>
        <Link to="/" style={styles.link}>Aegis</Link>
        <div>
          <Link to="/register" style={styles.link}>Register</Link>
        </div>
      </nav>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </BrowserRouter>
  );
}

const styles = {
  nav: {
    backgroundColor: "#1976d2",
    display: "flex",
    justifyContent: "space-between",
    padding: "1rem"
  },
  link: {
    color: "#fff",
    textDecoration: "none",
    marginRight: "1rem",
    fontWeight: "bold"
  }
};

export default App;