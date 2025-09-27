import React from "react";
import { Link, Outlet } from "react-router-dom";
import "./App.css";

export default function App() {
  return (
    <div className="app">
      <header className="topbar">
        <h1 className="brand">Reviews Copilot</h1>
        <nav>
          <Link to="/">Inbox</Link>
          <Link to="/analytics">Analytics</Link>
        </nav>
      </header>
      <main className="container">
        <Outlet />
      </main>
    </div>
  );
}
