// src/ProtectedRoute.jsx
import { Navigate, Outlet, useLocation } from "react-router-dom";

export default function ProtectedRoute({ allow = ["user", "admin"] }) {
  const location = useLocation();
  let kind = null;
  try {
    const raw = localStorage.getItem("currentUser");
    if (raw) kind = JSON.parse(raw)?.kind;
  } catch {}

  if (!kind || !allow.includes(kind)) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <Outlet />;
}
