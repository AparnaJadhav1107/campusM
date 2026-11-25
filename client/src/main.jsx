import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";

import Layout from "./components/layout/Layout.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import { Login, Register } from "./pages/Auth.jsx";
import Students from "./pages/Students.jsx";
import { Complaints, ComplaintDetail } from "./pages/Complaints.jsx";
import { QueuePage, PriorityPage, Resources, Activity, Settings } from "./pages/QueuePriority.jsx";
import Reports from "./pages/Reports.jsx";
import Visualizer from "./pages/Visualizer.jsx";
import { useAuthStore } from "./store/index.js";

function Guard({ children }) {
  const user = useAuthStore((s) => s.user);
  return user ? children : <Navigate to="/login" replace />;
}

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<Guard><Layout /></Guard>}>
        <Route index element={<Dashboard />} />
        <Route path="students" element={<Students />} />
        <Route path="complaints" element={<Complaints />} />
        <Route path="complaints/:id" element={<ComplaintDetail />} />
        <Route path="queue" element={<QueuePage />} />
        <Route path="priority" element={<PriorityPage />} />
        <Route path="resources" element={<Resources />} />
        <Route path="dsa" element={<Visualizer />} />
        <Route path="reports" element={<Reports />} />
        <Route path="activity" element={<Activity />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
);
