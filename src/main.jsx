import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App.jsx";
import Home from "./components/Home.jsx";
import DegreeWorks from "./components/DegreeWorks.jsx";
import Registration from "./components/Registration.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/roadmap" element={<App />} />
        <Route path="/degree-works" element={<DegreeWorks />} />
        <Route path="/registration" element={<Registration />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
