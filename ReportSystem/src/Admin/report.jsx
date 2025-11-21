import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./report.css";
import defaultImg from "/default.jpg";
import Navigation from "../Navigation.jsx"; // adjust the path if needed

// Helper formatters
const formatConcern = (report) => {
  const base = report.concern || "Unspecified";
  const sub = report.subConcern || report.otherConcern;
  return sub ? `${base} : ${sub}` : base;
};

const formatBuilding = (report) => {
  const rawBuilding = report.building || "Unspecified";

  // If building is "Other", prefer the custom value
  const isOther = rawBuilding && rawBuilding.toLowerCase() === "other";
  const buildingLabel =
    isOther && report.otherBuilding ? report.otherBuilding : rawBuilding;

  const roomOrSpot = report.room || report.otherRoom;

  return roomOrSpot ? `${buildingLabel} : ${roomOrSpot}` : buildingLabel;
};

function Report() {
  const [reports, setReports] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);

  const [buildingFilter, setBuildingFilter] = useState("All Buildings");
  const [concernFilter, setConcernFilter] = useState("All Concerns");
  const [collegeFilter, setCollegeFilter] = useState("All Colleges");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [showDuplicates, setShowDuplicates] = useState(false);

  // Detail + comments + status
  const [selectedReport, setSelectedReport] = useState(null);
  const [statusValue, setStatusValue] = useState("Pending");
  const [commentText, setCommentText] = useState("");
  const [saving, setSaving] = useState(false);

  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    sessionStorage.clear();
    window.location.href = "/index.html";
  };

  const handleHome = () => {
    navigate("/App", { replace: false });
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/reports");
      const data = await res.json();
      setReports(data);
    } catch (err) {
      console.error("Error fetching reports:", err);
    }
  };

  const getDuplicateCounts = (reportsArr) => {
    const counts = {};
    reportsArr.forEach((report) => {
      const key = `${report.building}-${report.concern}`;
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  };

  const duplicateCounts = getDuplicateCounts(reports);

  const filterUniqueReports = (reportsArr) => {
    const seen = new Set();
    return reportsArr.filter((report) => {
      const key = `${report.building}-${report.concern}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const reportsToDisplay = showDuplicates ? reports : filterUniqueReports(reports);

  const getReportsByGroup = (groupKey) =>
    reports.filter((r) => `${r.building}-${r.concern}` === groupKey);

  const getRelativeTime = (dateString) => {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "";

    const now = new Date();
    let diffMs = now.getTime() - date.getTime();

    if (diffMs < 0) diffMs = 0;

    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return "just now";

    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) {
      return `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`;
    }

    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) {
      return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
    }

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) {
      return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
    }

    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) {
      return `${diffMonths} month${diffMonths === 1 ? "" : "s"} ago`;
    }

    const diffYears = Math.floor(diffMonths / 12);
    return `${diffYears} year${diffYears === 1 ? "" : "s"} ago`;
  };

  // Helper for status matching to reuse in filters and options
  const statusMatchesFilter = (reportStatus) => {
    const currentStatus = reportStatus || "Pending";
    if (statusFilter === "Archived") return currentStatus === "Archived";
    if (statusFilter === "All Statuses") return currentStatus !== "Archived";
    return currentStatus === statusFilter;
  };

  // Building options depend on selected Concern + College + Status
  const buildingOptions = [
    "All Buildings",
    ...new Set(
      reports
        .filter((r) =>
          (concernFilter === "All Concerns" || r.concern === concernFilter) &&
          (collegeFilter === "All Colleges" ||
            (r.college || "Unspecified") === collegeFilter) &&
          statusMatchesFilter(r.status)
        )
        .map((r) => r.building)
        .filter(Boolean)
    ),
  ];

  // Concern options depend on selected Building + College + Status
  const concernOptions = [
    "All Concerns",
    ...new Set(
      reports
        .filter((r) =>
          (buildingFilter === "All Buildings" || r.building === buildingFilter) &&
          (collegeFilter === "All Colleges" ||
            (r.college || "Unspecified") === collegeFilter) &&
          statusMatchesFilter(r.status)
        )
        .map((r) => r.concern)
        .filter(Boolean)
    ),
  ];

  // College options depend on Building + Concern + Status
  const collegeOptions = [
    "All Colleges",
    ...new Set(
      reports
        .filter((r) =>
          (buildingFilter === "All Buildings" || r.building === buildingFilter) &&
          (concernFilter === "All Concerns" || r.concern === concernFilter) &&
          statusMatchesFilter(r.status)
        )
        .map((r) => r.college || "Unspecified")
    ),
  ];

  const statusOptions = [
    "All Statuses",
    "Pending",
    "In Progress",
    "Resolved",
    "Archived",
  ];

  // Reset concern if it no longer exists under current building/college/status
  useEffect(() => {
    const validConcerns = new Set(
      reports
        .filter((r) =>
          (buildingFilter === "All Buildings" || r.building === buildingFilter) &&
          (collegeFilter === "All Colleges" ||
            (r.college || "Unspecified") === collegeFilter) &&
          statusMatchesFilter(r.status)
        )
        .map((r) => r.concern)
    );

    if (concernFilter !== "All Concerns" && !validConcerns.has(concernFilter)) {
      setConcernFilter("All Concerns");
    }
  }, [buildingFilter, collegeFilter, statusFilter, reports, concernFilter]);

  // Reset building if it no longer exists under current concern/college/status
  useEffect(() => {
    const validBuildings = new Set(
      reports
        .filter((r) =>
          (concernFilter === "All Concerns" || r.concern === concernFilter) &&
          (collegeFilter === "All Colleges" ||
            (r.college || "Unspecified") === collegeFilter) &&
          statusMatchesFilter(r.status)
        )
        .map((r) => r.building)
    );

    if (
      buildingFilter !== "All Buildings" &&
      !validBuildings.has(buildingFilter)
    ) {
      setBuildingFilter("All Buildings");
    }
  }, [concernFilter, collegeFilter, statusFilter, reports, buildingFilter]);

  const filteredReports = reportsToDisplay.filter((report) => {
    const buildingMatch =
      buildingFilter === "All Buildings" || report.building === buildingFilter;

    const concernMatch =
      concernFilter === "All Concerns" || report.concern === concernFilter;

    const collegeMatch =
      collegeFilter === "All Colleges" ||
      (report.college || "Unspecified") === collegeFilter;

    const statusMatch = statusMatchesFilter(report.status);

    return buildingMatch && concernMatch && collegeMatch && statusMatch;
  });

  const handleCardClick = (report) => {
    setSelectedReport(report);
    setStatusValue(report.status || "Pending");
    setCommentText("");
  };

  const closeDetails = () => {
    setSelectedReport(null);
    setStatusValue("Pending");
    setCommentText("");
  };

  const handleClearFilters = () => {
    setBuildingFilter("All Buildings");
    setConcernFilter("All Concerns");
    setCollegeFilter("All Colleges");
    setStatusFilter("All Statuses");
    setShowDuplicates(false);
  };

  const handleSaveChanges = async () => {
    if (!selectedReport) return;

    const payload = {
      status: statusValue,
    };

    if (commentText.trim()) {
      payload.comment = commentText.trim();
      payload.by = "Admin";
    }

    try {
      setSaving(true);
      const res = await fetch(
        `http://localhost:3000/api/reports/${selectedReport._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        throw new Error("Failed to update report");
      }

      const data = await res.json();
      const updatedReport = data.report;

      setReports((prev) =>
        prev.map((r) => (r._id === updatedReport._id ? updatedReport : r))
      );
      setSelectedReport(updatedReport);
      setStatusValue(updatedReport.status || "Pending");
      setCommentText("");
    } catch (err) {
      console.error("Error updating report:", err);
      alert("There was a problem saving the changes.");
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async () => {
    if (!selectedReport) return;

    const payload = {
      status: "Archived",
    };

    try {
      setSaving(true);
      const res = await fetch(
        `http://localhost:3000/api/reports/${selectedReport._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        throw new Error("Failed to archive report");
      }

      const data = await res.json();
      const updatedReport = data.report;

      setReports((prev) =>
        prev.map((r) => (r._id === updatedReport._id ? updatedReport : r))
      );
      setSelectedReport(updatedReport);
      setStatusValue("Archived");
    } catch (err) {
      console.error("Error archiving report:", err);
      alert("There was a problem archiving the report.");
    } finally {
      setSaving(false);
    }
  };

  const getStatusClassKey = (statusRaw) => {
    const status = statusRaw || "Pending";
    if (status === "In Progress") return "inprogress";
    if (status === "Resolved") return "completed";
    if (status === "Archived") return "archived";
    return "pending";
  };

  const renderStatusPill = (statusRaw) => {
    const classKey = getStatusClassKey(statusRaw);
    const status = statusRaw || "Pending";

    return (
      <span className={`status-pill status-${classKey}`}>
        {status}
      </span>
    );
  };

  // PRINT FUNCTION: print whatever is currently filtered
  const handlePrintCollegeReports = () => {
  const reportsToPrint = filteredReports;

  if (reportsToPrint.length === 0) {
    alert("No reports to print for the current filters.");
    return;
  }

  // Build groups of similar reports
  const groupMap = {};
  reports.forEach((r) => {
    const key = `${r.building}-${r.concern}`;
    if (!groupMap[key]) groupMap[key] = [];
    groupMap[key].push(r);
  });

  const printWindow = window.open("", "_blank");

  const filterSummary = `
    Building: ${buildingFilter}, Concern: ${concernFilter}, College: ${collegeFilter}, Status: ${statusFilter}
  `;

  const html = `
    <html>
      <head>
        <title>Filtered Reports</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            line-height: 1.5;
          }

          h1 {
            text-align: center;
            margin-bottom: 10px;
          }

          .filters-summary {
            text-align: center;
            font-size: 12px;
            color: #555;
            margin-bottom: 20px;
          }

          .page {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            grid-template-rows: repeat(2, auto);
            gap: 20px;
            margin-bottom: 50px;
            page-break-after: always;
          }

          .report {
            border: 1px solid #000;
            border-radius: 8px;
            padding: 12px;
            background: #fff;
          }

          .square-img {
            width: 250px;
            height: 120px;
            object-fit: cover;
            display: block;
            margin: 10px auto;
            border-radius: 6px;
            border: 1px solid #999;
          }

          .similar-block {
            margin-top: 8px;
            font-size: 12px;
            color: #222;
          }

          .similar-block ul {
            margin: 4px 0 0;
            padding-left: 16px;
          }

          @media print {
            .page {
              page-break-after: always;
            }
            .report {
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <h1>Filtered Reports</h1>
        <div class="filters-summary">${filterSummary}</div>

        ${(() => {
          let pages = "";
          for (let i = 0; i < reportsToPrint.length; i += 4) {
            const chunk = reportsToPrint.slice(i, i + 4);
            pages += `
              <div class="page">
                ${chunk
                  .map((r) => {
                    const key = `${r.building}-${r.concern}`;
                    const group = groupMap[key] || [];
                    const similar = group.filter((x) => x._id !== r._id);

                    const similarHtml =
                      similar.length > 0
                        ? `
                          <div class="similar-block">
                            <strong>${similar.length} similar ${
                            similar.length === 1 ? "report" : "reports"
                          }</strong>
                          </div>`
                        : "";

                    return `
                      <div class="report">
                        <h3>${r.heading || "Untitled Report"}</h3>

                        <p><strong>Building:</strong> ${formatBuilding(r)}</p>
                        <p><strong>Concern:</strong> ${formatConcern(r)}</p>
                        <p><strong>College:</strong> ${r.college || "Unspecified"}</p>

                        ${
                          r.image
                            ? `<img class="square-img" src="http://localhost:3000${r.image}" />`
                            : ""
                        }

                        ${similarHtml}

                        <p><strong>Description:</strong><br>${r.description || ""}</p>
                      </div>
                    `;
                  })
                  .join("")}
              </div>
            `;
          }
          return pages;
        })()}
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();

  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 300);
};

  return (
    <>
      {/* Global navigation bar */}
      <Navigation />

      <div className="report-wrapper">
        {/* Header */}
        <div className="header">
          <div>
            <h1>Reports</h1>
            <p className="header-subtitle">
              Review, update, and archive facility reports in one place.
            </p>
          </div>
          <div className="header-actions">
            <button className="home-btn" onClick={handleHome}>
              Home
            </button>
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>

        {/* Filters card */}
        <div className="filters-card">
          <div className="filters-header-row">
            <span className="filters-title">Filters</span>
            <button
              className="clear-filters-btn"
              type="button"
              onClick={handleClearFilters}
            >
              Clear filters
            </button>
          </div>

          <div className="filters">
            <div className="filter-field">
              <label htmlFor="building-filter">Building</label>
              <select
                id="building-filter"
                value={buildingFilter}
                onChange={(e) => setBuildingFilter(e.target.value)}
              >
                {buildingOptions.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-field">
              <label htmlFor="concern-filter">Concern</label>
              <select
                id="concern-filter"
                value={concernFilter}
                onChange={(e) => setConcernFilter(e.target.value)}
              >
                {concernOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-field">
              <label htmlFor="college-filter">College</label>
              <select
                id="college-filter"
                value={collegeFilter}
                onChange={(e) => setCollegeFilter(e.target.value)}
              >
                {collegeOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-field">
              <label htmlFor="status-filter">Status</label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                {statusOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <label className="duplicate-toggle">
              <input
                type="checkbox"
                checked={showDuplicates}
                onChange={() => setShowDuplicates(!showDuplicates)}
              />
              Show duplicates
            </label>
          </div>

          {filteredReports.length > 0 && (
            <button
              className="print-btn"
              type="button"
              onClick={handlePrintCollegeReports}
            >
              Print current filtered reports
            </button>
          )}
        </div>

        {/* Report list */}
        {selectedGroup ? (
          <div className="reports-list">
            <div className="group-header">
              <h2>
                Similar reports for <em>{selectedGroup}</em>
              </h2>
            <button
              onClick={() => setSelectedGroup(null)}
              className="back-btn"
              type="button"
            >
              Back
            </button>
            </div>

            {getReportsByGroup(selectedGroup).map((report) => {
              const statusKey = getStatusClassKey(report.status);

              return (
                <div
                  key={report._id}
                  className="report"
                  onClick={() => handleCardClick(report)}
                >
                  <div className="report-img-container">
                    <img
                      src={
                        report.image
                          ? `http://localhost:3000${report.image}`
                          : defaultImg
                      }
                      alt="Report"
                      className="report-img"
                      onError={(e) => {
                        e.target.src = defaultImg;
                      }}
                    />
                  </div>
                  <div className="report-body">
                    <div className="report-header-row">
                      <h3>{report.heading || "Untitled report"}</h3>
                    </div>

                    <div
                      className={`status-focus-row status-focus-${statusKey}`}
                    >
                      <span className="status-focus-label">Status</span>
                      {renderStatusPill(report.status)}
                    </div>

                    <p className="report-description">
                      {report.description || "No description provided."}
                    </p>

                    <div className="report-info">
                      <p>
                        <strong>Building:</strong> {formatBuilding(report)}
                      </p>
                      <p>
                        <strong>Concern:</strong> {formatConcern(report)}
                      </p>
                      <p>
                        <strong>College:</strong>{" "}
                        {report.college || "Unspecified"}
                      </p>
                    </div>
                    <p className="submitted-date">
                      {new Date(report.createdAt).toLocaleDateString()} (
                      {getRelativeTime(report.createdAt)})
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="reports-list">
            {filteredReports.map((report) => {
              const key = `${report.building}-${report.concern}`;
              const duplicates = (duplicateCounts[key] || 1) - 1;
              const statusKey = getStatusClassKey(report.status);

              return (
                <div
                  key={report._id}
                  className="report"
                  onClick={() => handleCardClick(report)}
                >
                  <div className="report-img-container">
                    <img
                      src={
                        report.image
                          ? `http://localhost:3000${report.image}`
                          : defaultImg
                      }
                      alt="Report"
                      className="report-img"
                      onError={(e) => {
                        e.target.src = defaultImg;
                      }}
                    />
                  </div>
                  <div className="report-body">
                    <div className="report-header-row">
                      <h3>{report.heading || "Untitled report"}</h3>
                    </div>

                    <div
                      className={`status-focus-row status-focus-${statusKey}`}
                    >
                      <span className="status-focus-label">Status</span>
                      {renderStatusPill(report.status)}
                    </div>

                    <p className="report-description">
                      {report.description || "No description provided."}
                    </p>

                    <div className="report-info">
                      <p>
                        <strong>Building:</strong> {formatBuilding(report)}
                      </p>
                      <p>
                        <strong>Concern:</strong> {formatConcern(report)}
                      </p>
                      <p>
                        <strong>College:</strong>{" "}
                        {report.college || "Unspecified"}
                      </p>
                    </div>

                    <p className="submitted-date">
                      {new Date(report.createdAt).toLocaleDateString()} (
                      {getRelativeTime(report.createdAt)})
                    </p>

                    {!showDuplicates && duplicates > 0 && (
                      <p
                        className="duplicate-msg"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedGroup(key);
                        }}
                      >
                        Similar type of report: ({duplicates}{" "}
                        {duplicates === 1 ? "report" : "reports"})
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Details modal */}
        {selectedReport && (
          <div
            className="report-modal-backdrop"
            onClick={closeDetails}
          >
            <div
              className="report-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>{selectedReport.heading || "Report details"}</h2>
                <button
                  className="modal-close-btn"
                  onClick={closeDetails}
                  type="button"
                >
                  ✕
                </button>
              </div>

              <div className="modal-content">
                <div className="modal-img-wrapper">
                  <img
                    src={
                      selectedReport.image
                        ? `http://localhost:3000${selectedReport.image}`
                        : defaultImg
                    }
                    alt="Report"
                    onError={(e) => {
                      e.target.src = defaultImg;
                    }}
                  />
                </div>

                <div className="modal-info">
                  <p className="modal-description">
                    {selectedReport.description || "No description provided."}
                  </p>

                  <div className="modal-meta-grid">
                    <p>
                      <strong>Building:</strong>{" "}
                      {formatBuilding(selectedReport)}
                    </p>
                    <p>
                      <strong>Concern:</strong>{" "}
                      {formatConcern(selectedReport)}
                    </p>
                    <p>
                      <strong>College:</strong>{" "}
                      {selectedReport.college || "Unspecified"}
                    </p>
                    <p>
                      <strong>Email:</strong>{" "}
                      {selectedReport.email || "Unspecified"}
                    </p>
                    <p>
                      <strong>Submitted:</strong>{" "}
                      {new Date(selectedReport.createdAt).toLocaleString()} (
                      {getRelativeTime(selectedReport.createdAt)})
                    </p>
                  </div>

                  <div
                    className={`status-panel status-focus-${getStatusClassKey(
                      statusValue
                    )}`}
                  >
                    <div className="status-panel-header">
                      <span className="status-panel-title">Status</span>
                      {renderStatusPill(statusValue)}
                    </div>
                    <div className="status-row status-row-inline">
                      <label
                        htmlFor="status-select"
                        className="status-row-label"
                      >
                        Update
                      </label>
                      <select
                        id="status-select"
                        className="status-select"
                        value={statusValue}
                        onChange={(e) => setStatusValue(e.target.value)}
                        disabled={selectedReport.status === "Archived"}
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                      </select>
                    </div>
                  </div>

                  <div className="comments-section">
                    <h3>Comments</h3>

                    {Array.isArray(selectedReport.comments) &&
                    selectedReport.comments.length > 0 ? (
                      <ul className="comments-list">
                        {selectedReport.comments.map((c, idx) => (
                          <li key={idx} className="comment-item">
                            <p className="comment-text">
                              {c.text || c.comment || String(c)}
                            </p>
                            <div>
                              {c.at && (
                                <span className="comment-date">
                                  {new Date(c.at).toLocaleString()} ‎ 
                                </span>
                              )}
                              {c.by && (
                                <span className="comment-date">
                                  {" "}
                                  by {c.by}
                                </span>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="no-comments">No comments yet.</p>
                    )}

                    <textarea
                      className="comment-input"
                      rows={3}
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Type your comment here..."
                    />

                    <div className="modal-actions">
                      {selectedReport.status !== "Archived" && (
                        <button
                          className="archive-btn"
                          onClick={handleArchive}
                          disabled={saving}
                          type="button"
                        >
                          {saving && statusValue === "Archived"
                            ? "Archiving..."
                            : "Archive report"}
                        </button>
                      )}

                      <button
                        className="save-comment-btn"
                        onClick={handleSaveChanges}
                        disabled={saving}
                        type="button"
                      >
                        {saving && statusValue !== "Archived"
                          ? "Saving..."
                          : "Save changes"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default Report;
