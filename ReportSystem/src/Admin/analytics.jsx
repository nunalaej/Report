import { useEffect, useMemo, useState, useCallback } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import Navigation from "../Navigation.jsx";
import "./analytics.css";

/* Helper to show Concern + Sub concern / Other concern */
const formatConcernLabel = (report) => {
  const base = report.concern || "Unspecified";
  const sub = report.subConcern || report.otherConcern;
  return sub ? `${base} : ${sub}` : base;
};

export default function Analytics() {
  /* =========================================================
     DATA
  ========================================================= */
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState("");

  // fetch from API, fallback to tiny demo when API is down
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/reports");
        if (!res.ok) throw new Error("Failed to fetch reports");
        const data = await res.json();
        if (!alive) return;
        setReports(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        if (!alive) return;
        setLoadErr("Could not load reports, using demo data");
        // fallback demo
        setReports([
          {
            status: "Pending",
            building: "Building A",
            concern: "Electrical",
            subConcern: "Lights",
            college: "CIT",
            createdAt: new Date().toISOString(),
          },
          {
            status: "In Progress",
            building: "Building B",
            concern: "Plumbing",
            college: "COE",
            createdAt: new Date().toISOString(),
          },
          {
            status: "Resolved",
            building: "Building A",
            concern: "HVAC",
            college: "CIT",
            createdAt: new Date().toISOString(),
          },
          {
            status: "Pending",
            building: "Building C",
            concern: "Electrical",
            subConcern: "Outlets",
            college: "COE",
            createdAt: new Date().toISOString(),
          },
          {
            status: "Resolved",
            building: "Building B",
            concern: "Carpentry",
            college: "CLA",
            createdAt: new Date().toISOString(),
          },
          {
            status: "In Progress",
            building: "Building C",
            concern: "HVAC",
            college: "CBA",
            createdAt: new Date().toISOString(),
          },
        ]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  /* =========================================================
     FILTERS
  ========================================================= */
  const STATUSES = ["Pending", "In Progress", "Resolved"];

  const allBuildings = useMemo(() => {
    const s = new Set();
    reports.forEach((r) => r.building && s.add(r.building));
    return [...s].sort();
  }, [reports]);

  // Concern + Sub concern / Other concern as label
  const allConcerns = useMemo(() => {
    const s = new Set();
    reports.forEach((r) => {
      const label = formatConcernLabel(r);
      if (label) s.add(label);
    });
    return [...s].sort();
  }, [reports]);

  const allColleges = useMemo(() => {
    const s = new Set();
    reports.forEach((r) => r.college && s.add(r.college));
    return [...s].sort();
  }, [reports]);

  const [selectedStatuses, setSelectedStatuses] = useState(new Set(STATUSES));
  const [selectedBuildings, setSelectedBuildings] = useState(new Set());
  const [selectedConcerns, setSelectedConcerns] = useState(new Set());
  const [selectedColleges, setSelectedColleges] = useState(new Set());
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Filters panel visibility with small persistence
  const FILTERS_OPEN_KEY = "analytics_filters_open_v1";
  const [filtersOpen, setFiltersOpen] = useState(() => {
    const saved = localStorage.getItem(FILTERS_OPEN_KEY);
    return saved === null ? true : saved === "1";
  });
  const toggleFiltersOpen = () => {
    setFiltersOpen((prev) => {
      const next = !prev;
      localStorage.setItem(FILTERS_OPEN_KEY, next ? "1" : "0");
      return next;
    });
  };

  const toggleSet =
    (setter) =>
    (value) => {
      setter((prev) => {
        const n = new Set(prev);
        if (n.has(value)) n.delete(value);
        else n.add(value);
        return n;
      });
    };

  const clearAllFilters = () => {
    setSelectedStatuses(new Set(STATUSES));
    setSelectedBuildings(new Set());
    setSelectedConcerns(new Set());
    setSelectedColleges(new Set());
    setDateFrom("");
    setDateTo("");
  };

  const filtered = useMemo(() => {
    const fromTS = dateFrom ? new Date(dateFrom).getTime() : null;
    const toTS = dateTo ? new Date(dateTo).getTime() + 86399999 : null; // end of day

    return reports.filter((r) => {
      const st = (r.status || "").trim();
      if (!selectedStatuses.has(st)) return false;

      if (selectedBuildings.size && !selectedBuildings.has(r.building)) {
        return false;
      }

      const concernLabel = formatConcernLabel(r);
      if (selectedConcerns.size && !selectedConcerns.has(concernLabel)) {
        return false;
      }

      if (selectedColleges.size && !selectedColleges.has(r.college)) {
        return false;
      }

      if ((fromTS || toTS) && r.createdAt) {
        const ts = new Date(r.createdAt).getTime();
        if (fromTS && ts < fromTS) return false;
        if (toTS && ts > toTS) return false;
      }
      return true;
    });
  }, [
    reports,
    selectedStatuses,
    selectedBuildings,
    selectedConcerns,
    selectedColleges,
    dateFrom,
    dateTo,
  ]);

  // Count active filters for badge
  const activeFilterCount = useMemo(() => {
    let c = 0;
    if (selectedStatuses.size !== STATUSES.length) c++;
    if (selectedBuildings.size) c++;
    if (selectedConcerns.size) c++;
    if (selectedColleges.size) c++;
    if (dateFrom || dateTo) c++;
    return c;
  }, [
    selectedStatuses,
    selectedBuildings,
    selectedConcerns,
    selectedColleges,
    dateFrom,
    dateTo,
  ]);

  /* =========================================================
     AGGREGATES FOR CHARTS
  ========================================================= */
  const statusCounts = useMemo(() => {
    const map = { pending: 0, progress: 0, resolved: 0 };
    filtered.forEach((r) => {
      const s = (r.status || "").toLowerCase();
      if (s === "pending") map.pending++;
      else if (s === "in progress") map.progress++;
      else if (s === "resolved") map.resolved++;
    });
    return map;
  }, [filtered]);

  const agg = useCallback((arr, keyOrFn) => {
    const getKey =
      typeof keyOrFn === "function"
        ? keyOrFn
        : (r) => r[keyOrFn] || "Unspecified";

    const m = new Map();
    arr.forEach((r) => {
      const raw = getKey(r);
      const k = raw || "Unspecified";
      m.set(k, (m.get(k) || 0) + 1);
    });
    return [...m.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, []);

  const buildingData = useMemo(
    () => agg(filtered, "building"),
    [filtered, agg]
  );
  const concernData = useMemo(
    () => agg(filtered, formatConcernLabel),
    [filtered, agg]
  );
  const collegeData = useMemo(
    () => agg(filtered, "college"),
    [filtered, agg]
  );

  const total = filtered.length;

  /* =========================================================
     LISTS WITH PROGRESS SIDE PANEL
  ========================================================= */
  const [listsOpen, setListsOpen] = useState(false);

  const STORAGE_KEY = "todoLists_v1";
  const uid = useCallback(
    () =>
      Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    []
  );
  const defaultLists = useCallback(
    () => [
      {
        id: uid(),
        title: "Make a Code",
        tasks: [
          { id: uid(), text: "Create a File", done: false },
          { id: uid(), text: "Know your Language", done: false },
          { id: uid(), text: "Type a syntax", done: false },
        ],
        collapsed: false,
      },
    ],
    [uid]
  );

  const loadLocal = useCallback(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }, []);
  const [lists, setLists] = useState(() => loadLocal() || defaultLists());
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lists));
  }, [lists]);

  const computeProgress = useCallback((list) => {
    if (!list.tasks || list.tasks.length === 0) return 0;
    const done = list.tasks.filter((t) => t.done).length;
    return Math.round((done / list.tasks.length) * 100);
  }, []);

  const createList = (title) =>
    setLists((prev) => [
      { id: uid(), title: title || "Untitled", tasks: [], collapsed: false },
      ...prev,
    ]);

  const deleteList = (listId) =>
    setLists((prev) => prev.filter((l) => l.id !== listId));

  const toggleCollapse = (listId) =>
    setLists((prev) =>
      prev.map((l) =>
        l.id === listId ? { ...l, collapsed: !l.collapsed } : l
      )
    );

  const addTask = (listId, text) => {
    if (!text) return;
    setLists((prev) =>
      prev.map((l) =>
        l.id === listId
          ? {
              ...l,
              tasks: [
                ...l.tasks,
                { id: uid(), text: text.trim(), done: false },
              ],
            }
          : l
      )
    );
  };
  const toggleTask = (listId, taskId) => {
    setLists((prev) =>
      prev.map((l) =>
        l.id === listId
          ? {
              ...l,
              tasks: l.tasks.map((t) =>
                t.id === taskId ? { ...t, done: !t.done } : t
              ),
            }
          : l
      )
    );
  };
  const deleteTask = (listId, taskId) => {
    setLists((prev) =>
      prev.map((l) =>
        l.id === listId
          ? { ...l, tasks: l.tasks.filter((t) => t.id !== taskId) }
          : l
      )
    );
  };

  const saveToServer = useCallback(async () => {
    try {
      const res = await fetch("/api/lists/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lists }),
      });
      if (!res.ok) throw new Error("Sync failed");
      alert("Lists saved to server");
    } catch (e) {
      console.error(e);
      alert("Failed to save lists to server");
    }
  }, [lists]);

  const loadFromServer = useCallback(async () => {
    try {
      const res = await fetch("/api/lists");
      if (!res.ok) throw new Error("Load failed");
      const data = await res.json();
      if (Array.isArray(data) && data.length) setLists(data);
      else alert("No lists found on server");
    } catch (e) {
      console.error(e);
      alert("Failed to load lists from server");
    }
  }, []);

  /* =========================================================
     CHECKLIST (inline generator, if you want later)
  ========================================================= */
  const [inputList, setInputList] = useState("");
  const [checkboxes, setCheckboxes] = useState([]);
  const [checkedItems, setCheckedItems] = useState([]);
  const progressInline = checkboxes.length
    ? Math.round(
        (checkedItems.filter(Boolean).length / checkboxes.length) * 100
      )
    : 0;

  const generateCheckboxes = () => {
    const items = inputList
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    setCheckboxes(items);
    setCheckedItems(new Array(items.length).fill(false));
  };
  const updateChecked = (i) =>
    setCheckedItems((prev) => {
      const n = [...prev];
      n[i] = !n[i];
      return n;
    });

  /* =========================================================
     UI
  ========================================================= */
  return (
    <div className="analytics-wrapper">
      <Navigation />

      <div className="analytics-container">
        {/* Top bar */}
        <header className="analytics-header">
          <div className="analytics-title">
            <h1>Analytics Dashboard</h1>
            <p className="subtitle">Insights from BFMO Report System</p>
            {loadErr ? <div className="note">{loadErr}</div> : null}
            {!loading && (
              <span className="note">
                Showing {filtered.length} of {reports.length} reports
              </span>
            )}
          </div>

          <div className="header-stats">
            {/* Quick stat chips */}
            <div className="stat-chip">
              <span
                className="stat-dot"
                style={{ background: "#0ea5e9" }}
              />
              <span>Total</span>
              <strong>{reports.length}</strong>
            </div>
            <div className="stat-chip">
              <span
                className="stat-dot"
                style={{ background: "#22c55e" }}
              />
              <span>Resolved</span>
              <strong>{statusCounts.resolved}</strong>
            </div>
            <div className="stat-chip">
              <span
                className="stat-dot"
                style={{ background: "#f97316" }}
              />
              <span>Pending</span>
              <strong>{statusCounts.pending}</strong>
            </div>

            {/* Right actions */}
            <div className="header-actions">
              <button
                className="pa-btn"
                onClick={toggleFiltersOpen}
                aria-expanded={filtersOpen}
                aria-controls="filters-panel"
                title={filtersOpen ? "Hide filters" : "Show filters"}
              >
                {filtersOpen ? "Hide Filters" : "Show Filters"}
                {activeFilterCount > 0 && (
                  <span className="badge" style={{ marginLeft: 8 }}>
                    {activeFilterCount}
                  </span>
                )}
              </button>

              <button
                className="pa-btn"
                onClick={() => setListsOpen(true)}
              >
                Open Lists Panel
              </button>
            </div>
          </div>
        </header>

        {/* Filters */}
        {filtersOpen && (
          <section
            id="filters-panel"
            className="filters card"
            aria-label="Filters"
          >
            <div className="filters-row">
              <div className="filter-block">
                <h4>Status</h4>
                <div className="chips">
                  {STATUSES.map((s) => (
                    <label
                      key={s}
                      className={`chip ${
                        selectedStatuses.has(s) ? "is-on" : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedStatuses.has(s)}
                        onChange={() =>
                          toggleSet(setSelectedStatuses)(s)
                        }
                      />
                      {s}
                    </label>
                  ))}
                </div>
              </div>

              <div className="filter-block">
                <h4>Building</h4>
                <div className="chips scroll">
                  {allBuildings.map((b) => (
                    <label
                      key={b}
                      className={`chip ${
                        selectedBuildings.has(b) ? "is-on" : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedBuildings.has(b)}
                        onChange={() =>
                          toggleSet(setSelectedBuildings)(b)
                        }
                      />
                      {b}
                    </label>
                  ))}
                </div>
              </div>

              <div className="filter-block">
                <h4>Concern</h4>
                <div className="chips scroll">
                  {allConcerns.map((c) => (
                    <label
                      key={c}
                      className={`chip ${
                        selectedConcerns.has(c) ? "is-on" : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedConcerns.has(c)}
                        onChange={() =>
                          toggleSet(setSelectedConcerns)(c)
                        }
                      />
                      {c}
                    </label>
                  ))}
                </div>
              </div>

              <div className="filter-block">
                <h4>College</h4>
                <div className="chips scroll">
                  {allColleges.map((col) => (
                    <label
                      key={col}
                      className={`chip ${
                        selectedColleges.has(col) ? "is-on" : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedColleges.has(col)}
                        onChange={() =>
                          toggleSet(setSelectedColleges)(col)
                        }
                      />
                      {col}
                    </label>
                  ))}
                </div>
              </div>

              <div className="filter-block">
                <h4>Date</h4>
                <div className="dates">
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                  <span>to</span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="filters-actions">
              <button className="pa-btn" onClick={clearAllFilters}>
                Clear filters
              </button>
            </div>
          </section>
        )}

        {/* Grid */}
        <div className="analytics-grid">
          {/* Status Overview */}
          <div className="card">
            <h3>Status Overview</h3>
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={[
                      {
                        name: "Pending",
                        value: statusCounts.pending,
                      },
                      {
                        name: "In Progress",
                        value: statusCounts.progress,
                      },
                      {
                        name: "Resolved",
                        value: statusCounts.resolved,
                      },
                    ]}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    labelLine={false}
                    label={false}
                    dataKey="value"
                  >
                    {["#f59e0b", "#3b82f6", "#22c55e"].map((c, i) => (
                      <Cell key={i} fill={c} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <p className="note">Total filtered: {total}</p>
          </div>

          {/* Reports by Building */}
          <div className="card">
            <h3>Reports by Building</h3>
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={buildingData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={false} axisLine={false} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Reports by Concern */}
          <div className="card">
            <h3>Reports by Concern</h3>
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={concernData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={false} axisLine={false} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Reports by College */}
          <div className="card">
            <h3>Reports by College</h3>
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={collegeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={false} axisLine={false} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Side Panel: Lists with Progress */}
      <div
        className={`sidepanel ${listsOpen ? "is-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Lists with Progress"
      >
        <div className="sidepanel-head">
          <h3>Lists with Progress</h3>
          <button
            className="sidepanel-close"
            onClick={() => setListsOpen(false)}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="lists-controls sticky">
          <button
            className="pa-btn"
            onClick={() => {
              const title = prompt("List title:");
              if (title && title.trim()) createList(title.trim());
            }}
          >
            + Add List
          </button>
          <button className="pa-btn" onClick={saveToServer}>
            Save to Server
          </button>
          <button className="pa-btn" onClick={loadFromServer}>
            Load from Server
          </button>
        </div>

        <div className="lists-grid panel">
          {lists.map((list) => {
            const pct = computeProgress(list);
            return (
              <section key={list.id} className="pa-card list-panel">
                <div className="pa-card__glow" />
                <div className="pa-card__base" />
                <div className="pa-card__content">
                  <div className="list-header">
                    <div className="list-left">
                      <div className="list-title-row">
                        <h3 className="list-title">{list.title}</h3>
                        <button
                          className="small-btn collapse"
                          onClick={() => toggleCollapse(list.id)}
                        >
                          {list.collapsed ? "Expand" : "Panel"}
                        </button>
                      </div>

                      <div className="progress-wrap">
                        <div className="muted">{pct}%</div>
                        <div className="progress-bar small">
                          <div
                            className="progress-fill"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="list-actions">
                      <button
                        className="small-btn"
                        onClick={() => {
                          const text = prompt("Task name:");
                          if (text && text.trim())
                            addTask(list.id, text.trim());
                        }}
                      >
                        + Task
                      </button>
                      <button
                        className="small-btn"
                        onClick={() => {
                          if (confirm("Delete this list?"))
                            deleteList(list.id);
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {!list.collapsed && (
                    <div className="list-body">
                      <div className="add-inline">
                        <input
                          className="input"
                          placeholder="New task name"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              const v = e.currentTarget.value.trim();
                              if (v) {
                                addTask(list.id, v);
                                e.currentTarget.value = "";
                              }
                            }
                          }}
                        />
                        <button
                          className="small-btn"
                          onClick={(e) => {
                            const input =
                              e.currentTarget.previousElementSibling;
                            if (input && input.value.trim()) {
                              addTask(list.id, input.value.trim());
                              input.value = "";
                            }
                          }}
                        >
                          Add
                        </button>
                      </div>

                      <div className="tasks-wrap">
                        {!list.tasks || list.tasks.length === 0 ? (
                          <div className="muted">No tasks yet.</div>
                        ) : (
                          list.tasks.map((task) => (
                            <div key={task.id} className="task-row">
                              <input
                                type="checkbox"
                                checked={!!task.done}
                                onChange={() =>
                                  toggleTask(list.id, task.id)
                                }
                              />
                              <label
                                style={{
                                  textDecoration: task.done
                                    ? "line-through"
                                    : "none",
                                }}
                              >
                                {task.text}
                              </label>
                              <button
                                className="small-btn"
                                title="Delete task"
                                onClick={() => {
                                  if (confirm("Delete task?"))
                                    deleteTask(list.id, task.id);
                                }}
                              >
                                ×
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>
      {listsOpen && (
        <div
          className="sidepanel-backdrop"
          onClick={() => setListsOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
