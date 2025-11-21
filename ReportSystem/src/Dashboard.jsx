import { useState, useEffect } from "react";
import "./dashboard.css";

const defaultImg =  "/default.jpg";

function Dashboard() {
  const [reports, setReports] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [buildingFilter, setBuildingFilter] = useState("All Buildings");
  const [concernFilter, setConcernFilter] = useState("All Concerns");
  const [showDuplicates, setShowDuplicates] = useState(false);

  const token = localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("token");
    sessionStorage.clear();
    window.location.href = "/index.html";
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/reports", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch reports");
      const data = await res.json();
      setReports(data);
    } catch (err) {
      console.error(err);
    }
  };

  const duplicateCounts = reports.reduce((acc, r) => {
    const key = `${r.building}-${r.concern}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const filterUniqueReports = (reports) => {
    const seen = new Set();
    return reports.filter((r) => {
      const key = `${r.building}-${r.concern}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const reportsToDisplay = showDuplicates ? reports : filterUniqueReports(reports);

  const buildingOptions = ["All Buildings", ...new Set(reports.map((r) => r.building))];
  const concernOptions = ["All Concerns", ...new Set(reports.map((r) => r.concern))];

  const filteredReports = reportsToDisplay.filter((r) => {
    const buildingMatch = buildingFilter === "All Buildings" || r.building === buildingFilter;
    const concernMatch = concernFilter === "All Concerns" || r.concern === concernFilter;
    return buildingMatch && concernMatch;
  });

  // Dashboard summary
  const summary = {
    total: reports.length,
    pending: reports.filter((r) => r.status === "Pending").length,
    progress: reports.filter((r) => r.status === "In Progress").length,
    resolved: reports.filter((r) => r.status === "Resolved").length,
  };

  const getReportsByGroup = (key) => reports.filter((r) => `${r.building}-${r.concern}` === key);

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <aside className="sidebar">
        <h2>Filters</h2>
        <div className="filter-group">
          <label>Building</label>
          <select value={buildingFilter} onChange={(e) => setBuildingFilter(e.target.value)}>
            {buildingOptions.map((b, i) => (
              <option key={i} value={b}>{b}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Concern</label>
          <select value={concernFilter} onChange={(e) => setConcernFilter(e.target.value)}>
            {concernOptions.map((c, i) => (
              <option key={i} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>
            <input
              type="checkbox"
              checked={showDuplicates}
              onChange={() => setShowDuplicates(!showDuplicates)}
            />
            Show Duplicates
          </label>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="topbar">
          <h1>Reports Dashboard</h1>
          <button className="btn btn-danger" onClick={handleLogout}>Logout</button>
        </header>

        {/* Summary cards */}
        <div className="summary-cards">
          <div className="card total">Total Reports <span>{summary.total}</span></div>
          <div className="card pending">Pending <span>{summary.pending}</span></div>
          <div className="card progress">In Progress <span>{summary.progress}</span></div>
          <div className="card resolved">Resolved <span>{summary.resolved}</span></div>
        </div>

        {/* Reports Grid */}
        {selectedGroup ? (
          <div className="reports-list">
            <h2>Similar Reports for <em>{selectedGroup}</em></h2>
            <button className="btn btn-ghost" onClick={() => setSelectedGroup(null)}>← Back</button>
            {getReportsByGroup(selectedGroup).map((r) => (
              <ReportCard key={r._id} report={r} />
            ))}
          </div>
        ) : (
          <div className="reports-list">
            {filteredReports.map((r) => {
              const key = `${r.building}-${r.concern}`;
              const duplicates = (duplicateCounts[key] || 1) - 1;
              return (
                <ReportCard
                  key={r._id}
                  report={r}
                  onDuplicateClick={() => setSelectedGroup(key)}
                  duplicates={duplicates}
                  showDuplicates={showDuplicates}
                />
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

// Card component
function ReportCard({ report, onDuplicateClick, duplicates, showDuplicates }) {
  return (
    <div className="report">
      <div className="report-img-container">
        <img
          src={report.image ? `http://localhost:3000${report.image}` : defaultImg}
          alt="Report"
          onError={(e) => (e.target.src = defaultImg)}
        />
      </div>
      <div className="report-body">
        <h3>{report.heading || "Untitled Report"}</h3>
        <p>{report.description || "No description provided."}</p>
        <div className="report-info">
          <p><strong>Building:</strong> {report.building}</p>
          <p><strong>Concern:</strong> {report.concern}</p>
          <p className="status">
            <span className={`badge ${
              report.status === "Resolved"
                ? "badge--resolved"
                : report.status === "In Progress"
                ? "badge--progress"
                : "badge--pending"
            }`}>{report.status || "Pending"}</span>
          </p>
        </div>
        {!showDuplicates && duplicates > 0 && (
          <p className="duplicate-msg" onClick={onDuplicateClick}>
            🔁 {duplicates} similar {duplicates === 1 ? "report" : "reports"}
          </p>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
