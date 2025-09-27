// src/main.jsx
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import Inbox from "./pages/Inbox";
import ReviewDetail from "./pages/ReviewDetail";
import Analytics from "./pages/Analytics";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<Inbox />} />
          <Route path="reviews/:id" element={<ReviewDetail />} />
          <Route path="analytics" element={<Analytics />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
