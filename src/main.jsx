import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import App from "./App.jsx";
import Home from "./components/Home.jsx";
import DegreeWorks from "./components/DegreeWorks.jsx";
import CourseCatalog from "./components/CourseCatalog.jsx";
import RegisterCourses from "./components/RegisterCourses.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/roadmap" element={<App />} />
        <Route path="/degree-works" element={<DegreeWorks />} />
        <Route path="/register-courses" element={<RegisterCourses />} />
        <Route path="/registration" element={<Navigate to="/register-courses" replace />} />
        <Route path="/course-catalog" element={<CourseCatalog />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
