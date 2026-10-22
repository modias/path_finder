import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import App from "./App.jsx";
import Home from "./components/Home.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/roadmap" element={<App />} />
        <Route path="/register-courses" element={<Navigate to="/roadmap" replace />} />
        <Route path="/registration" element={<Navigate to="/roadmap" replace />} />
        <Route path="/course-catalog" element={<Navigate to="/roadmap" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
