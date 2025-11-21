import { Navigate } from "react-router-dom";

const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem("currentUser") || "null");
  } catch {
    return null;
  }
};

export function RequireAdmin({ children }) {
  const user = getUser();
  if (!user || user.kind !== "admin") return <Navigate to="/create" replace />;
  return children;
}

export function RequireUser({ children }) {
  const user = getUser();
  if (!user || user.kind !== "user") return <Navigate to="/login" replace />;
  return children;
}

export function RequireStaff({ children }) {
  const user = JSON.parse(localStorage.getItem("currentUser") || "{}");
  return user.kind === "staff" ? children : <Navigate to="/login" replace />;
}