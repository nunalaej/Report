// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";

import { ThemeProvider } from "./theme/theme.jsx";
import "./theme/tokens.css";

// Auth guards
import { RequireAdmin, RequireUser, RequireStaff } from "./auth-guards.jsx";

// Admin pages
import AdminHome from "./Admin/App.jsx";
import Report from "./Admin/report.jsx";
import Analytics from "./Admin/analytics.jsx";
import AdminEdit from "./Admin/AdminEdit.jsx";


// User pages
import Create from "./User/create.jsx";

// Login
import Login from "./Login.jsx";

// Staff pages
import StaffHome from "./Staff/App.jsx";
import ReportStaff from "./Staff/report_staff.jsx";
import AnalyticsStaff from "./Staff/analytics_staff.jsx";


// Set initial theme
const initial = localStorage.getItem("theme") || "light";
document.documentElement.setAttribute("data-theme", initial);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <Routes>

          {/* LOGIN */}
          <Route path="/login" element={<Login />} />

          {/* ADMIN ROUTES */}
          <Route
            path="/Admin"
            element={
              <RequireAdmin>
                <AdminHome />
              </RequireAdmin>
            }
          />

          <Route
            path="/report"
            element={
              <RequireAdmin>
                <Report />
              </RequireAdmin>
            }
          />

          <Route
            path="/analytics"
            element={
              <RequireAdmin>
                <Analytics />
              </RequireAdmin>
            }
          />

          <Route
            path="/AdminEdit"
            element={
              <RequireAdmin>
                <AdminEdit />
              </RequireAdmin>
            }
          />


          {/* USER ROUTE */}
          <Route
            path="/create"
            element={
              <RequireUser>
                <Create />
              </RequireUser>
            }
          />

          {/* STAFF ROUTES */}
          <Route
            path="/Staff"
            element={
              <RequireStaff>
                <StaffHome />
              </RequireStaff>
            }
          />

          <Route
            path="/reportstaff"
            element={
              <RequireStaff>
                <ReportStaff />
              </RequireStaff>
            }
          />

          <Route
            path="/analyticsstaff"
            element={
              <RequireStaff>
                <AnalyticsStaff />
              </RequireStaff>
            }
          />

          {/* FALLBACK */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);
