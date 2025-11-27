// src/pages/StudentViewReport.jsx
import { useEffect, useMemo, useState } from "react";
import "./StudentViewReport.css"; // optional, or reuse an existing css
import Navigation from "../Navigation.jsx";

const defaultImg = "/default.jpg";

/**
 * API base:
 * - In production, set VITE_API_BASE_URL to your deployed server root, like:
 *     VITE_API_BASE_URL=https://your-bfmo-api.onrender.com
 * - In dev, you can leave it empty and use Vite proxy to /api
 */
const RAW_BASE = import.meta.env.VITE_API_BASE_URL || "";
const TRIMMED_BASE = RAW_BASE.replace(/\/+$/, "");
const API_BASE = TRIMMED_BASE; // "" if not set

const REPORTS_URL = API_BASE ? `${API_BASE}/api/reports` : "/api/reports";

// helpers
const norm = (v) => (v == null ? "" : String(v).trim().toLowerCase());

const getImageSrc = (image) => {
  if (!image) return defaultImg;

  // Cloudinary / absolute URL
  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }

  // Legacy /uploads/ path from backend
  return `${API_BASE}${image}`;
};

const getStatusClassKey = (statusRaw) => {
  const status = statusRaw || "Pending";
  if (status === "In Progress") return "inprogress";
  if (status === "Waiting for Materials") return "waiting";
  if (status === "Resolved") return "completed";
  if (status === "Archived") return "archived";
  return "pending";
};

function getRelativeTime(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  let diffMs = now.getTime() - date.getTime();
  if (diffMs < 0) diffMs = 0;

  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "just now";

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths} month${diffMonths === 1 ? "" : "s"} ago`;

  const diffYears = Math.floor(diffMonths / 12);
  return `${diffYears} year${diffYears === 1 ? "" : "s"} ago`;
}

// card pill for status
function StatusPill({ status }) {
  const classKey = getStatusClassKey(status);
  const label = status || "Pending";
  return <span className={`status-pill status-${classKey}`}>{label}</span>;
}

export default function StudentViewReport() {
  const [currentEmail, setCurrentEmail] = useState("");
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);

  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [searchTerm, setSearchTerm] = useState("");

  // ===== load email from localStorage =====
  useEffect(() => {
    try {
      const raw = localStorage.getItem("currentUser");
      if (!raw) {
        setLoadError("No logged in user found. Please log in again.");
        return;
      }

      const user = JSON.parse(raw);
      if (!user?.email) {
        setLoadError("Your account information is incomplete. Please log in again.");
        return;
      }

      setCurrentEmail(user.email);
    } catch (e) {
      console.error("Failed to read currentUser:", e);
      setLoadError("Could not read your account. Please log in again.");
    }
  }, []);

  // ===== fetch reports for this email =====
  useEffect(() => {
    if (!currentEmail) return;

    async function fetchReports() {
      setLoading(true);
      setLoadError("");

      try {
        const params = new URLSearchParams({ email: currentEmail });
        const url = `${REPORTS_URL}?${params.toString()}`;

        console.log("[StudentViewReport] Fetch:", url);

        const res = await fetch(url, { credentials: "omit" });
        if (!res.ok) {
          const raw = await res.text().catch(() => "");
          console.error("Failed to load reports:", res.status, raw);
          throw new Error(`Failed to load reports. Status ${res.status}`);
        }

        const data = await res.json().catch(() => null);
        let list = [];

        if (Array.isArray(data)) {
          list = data;
        } else if (data && Array.isArray(data.reports)) {
          list = data.reports;
        } else if (data && Array.isArray(data.data)) {
          list = data.data;
        } else {
          console.warn("Unexpected /api/reports payload for student:", data);
          throw new Error("Could not understand server response.");
        }

        // Sort newest first
        list.sort((a, b) => {
          const da = new Date(a.createdAt || 0).getTime();
          const db = new Date(b.createdAt || 0).getTime();
          return db - da;
        });

        setReports(list);
      } catch (err) {
        console.error(err);
        setLoadError(err.message || "Network error while loading reports.");
        setReports([]);
      } finally {
        setLoading(false);
      }
    }

    fetchReports();
  }, [currentEmail]);

  // ===== filtered + searched =====
  const filteredReports = useMemo(() => {
    return reports
      .filter((r) => {
        if (statusFilter === "All Statuses") return true;
        const status = r.status || "Pending";
        return status === statusFilter;
      })
      .filter((r) => {
        const term = norm(searchTerm);
        if (!term) return true;

        const haystack = [
          r.heading,
          r.description,
          r.building,
          r.concern,
          r.subConcern,
          r.college,
        ]
          .map(norm)
          .join(" ");

        return haystack.includes(term);
      });
  }, [reports, statusFilter, searchTerm]);

  return (
    <div className="student-view-report">
      <Navigation />

      <main className="student-view-report__layout">
        <section className="student-view-report__content">
          <header className="student-view-report__header">
            <div>
              <span className="student-view-report__badge">My reports</span>
              <h1 className="student-view-report__title">
                Reports you have submitted
              </h1>
              <p className="student-view-report__subtitle">
                You can review the status and details of the reports you sent to BFMO.
              </p>
              {currentEmail && (
                <p className="student-view-report__email">
                  Signed in as <strong>{currentEmail}</strong>
                </p>
              )}
            </div>

            <div className="student-view-report__filters">
              <select
                className="student-view-report__select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All Statuses">All statuses</option>
                <option value="Pending">Pending</option>
                <option value="Waiting for Materials">Waiting for Materials</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Archived">Archived</option>
              </select>

              <input
                type="text"
                className="student-view-report__search"
                placeholder="Search by title, building, or concern"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </header>

          {loadError && (
            <div className="student-view-report__alert student-view-report__alert--error">
              {loadError}
            </div>
          )}

          {loading && (
            <p className="student-view-report__loading">Loading your reports…</p>
          )}

          {!loading && filteredReports.length === 0 && !loadError && (
            <p className="student-view-report__empty">
              You have not submitted any reports yet, or none match the current filters.
            </p>
          )}

          {!loading && filteredReports.length > 0 && (
            <div className="student-view-report__grid">
              {filteredReports.map((r) => {
                const imgSrc = getImageSrc(r.image);
                const statusKey = getStatusClassKey(r.status);

                return (
                  <article
                    key={r._id}
                    className={`student-view-report__card status-focus-${statusKey}`}
                    onClick={() => setSelectedReport(r)}
                  >
                    <div className="student-view-report__img-wrap">
                      <img
                        src={imgSrc}
                        alt={r.heading || "Report"}
                        onError={(e) => {
                          e.target.src = defaultImg;
                        }}
                      />
                    </div>

                    <div className="student-view-report__card-body">
                      <div className="student-view-report__card-head">
                        <h2 className="student-view-report__card-title">
                          {r.heading || "Untitled report"}
                        </h2>
                        <StatusPill status={r.status} />
                      </div>

                      <p className="student-view-report__card-desc">
                        {r.description || "No description provided."}
                      </p>

                      <div className="student-view-report__meta">
                        <p>
                          <strong>Building:</strong> {r.building || "Unspecified"}
                        </p>
                        <p>
                          <strong>Concern:</strong>{" "}
                          {r.concern || "Unspecified"}
                          {r.subConcern ? ` : ${r.subConcern}` : ""}
                        </p>
                        <p>
                          <strong>College:</strong> {r.college || "Unspecified"}
                        </p>
                      </div>

                      <p className="student-view-report__date">
                        {r.createdAt &&
                          new Date(r.createdAt).toLocaleDateString()}
                        {r.createdAt && ` (${getRelativeTime(r.createdAt)})`}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Details modal, read only */}
      {selectedReport && (
        <div
          className="student-view-report__modal-backdrop"
          onClick={() => setSelectedReport(null)}
        >
          <div
            className="student-view-report__modal"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="student-view-report__modal-header">
              <h2>{selectedReport.heading || "Report details"}</h2>
              <button
                type="button"
                className="student-view-report__modal-close"
                onClick={() => setSelectedReport(null)}
              >
                ✕
              </button>
            </header>

            <div className="student-view-report__modal-body">
              <div className="student-view-report__modal-img">
                <img
                  src={getImageSrc(selectedReport.image)}
                  alt={selectedReport.heading || "Report"}
                  onError={(e) => {
                    e.target.src = defaultImg;
                  }}
                />
              </div>

              <div className="student-view-report__modal-info">
                <p className="student-view-report__modal-desc">
                  {selectedReport.description || "No description provided."}
                </p>

                <div className="student-view-report__modal-meta">
                  <p>
                    <strong>Status:</strong>{" "}
                    <StatusPill status={selectedReport.status} />
                  </p>
                  <p>
                    <strong>Building:</strong>{" "}
                    {selectedReport.building || "Unspecified"}
                  </p>
                  <p>
                    <strong>Concern:</strong>{" "}
                    {selectedReport.concern || "Unspecified"}
                    {selectedReport.subConcern
                      ? ` : ${selectedReport.subConcern}`
                      : ""}
                  </p>
                  <p>
                    <strong>College:</strong>{" "}
                    {selectedReport.college || "Unspecified"}
                  </p>
                  <p>
                    <strong>Your email:</strong>{" "}
                    {selectedReport.email || "Unknown"}
                  </p>
                  <p>
                    <strong>Submitted:</strong>{" "}
                    {selectedReport.createdAt &&
                      new Date(selectedReport.createdAt).toLocaleString()}{" "}
                    {selectedReport.createdAt &&
                      `(${getRelativeTime(selectedReport.createdAt)})`}
                  </p>
                </div>

                {/* No status update / archive buttons here -> strictly read-only */}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
