import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import React from "react";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import type { PublicUser } from "./types/user";

function ProtectedRoute({ user, children }: { user: PublicUser | null; children: React.ReactElement }) {
  if (!user) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const [user, setUser] = useState<PublicUser | null>(() =>
    JSON.parse(localStorage.getItem("user") || "null")
  );

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login onLogin={setUser} />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute user={user}>
              <Dashboard onLogout={() => setUser(null)} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute user={user}>
              {user?.role === "admin"
                ? <AdminDashboard onLogout={() => setUser(null)} />
                : <Navigate to="/dashboard" replace />}
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}