// src/Navigation.jsx
import { NavLink } from "react-router-dom";
import { useTheme } from "./theme/theme.jsx";
import "./Navigation.css";
import logo from "/dlsud.png";

export default function Navigation() {
  const { theme, toggle } = useTheme();

  // Decide which Reports route to use based on currentUser
  let reportsPath = "/report";
  try {
    const raw = localStorage.getItem("currentUser");
    if (raw) {
      const user = JSON.parse(raw);
      if (user?.kind === "staff") {
        reportsPath = "/reportstaff";
      }
    }
  } catch {
    // ignore parse errors
  }

  return (
    <header className="global-header">
      {/* Brand: logo + title */}
      <div className="global-header__brand">
        <NavLink to="/" className="global-header__brand-link">
          <img
            src={logo}
            alt="DLSU D logo"
            className="global-header__logo"
          />
          <span className="global-header__title">BFMO Report System</span>
        </NavLink>
      </div>

      {/* Main nav links */}
      <nav className="global-header__nav">
        <NavLink
          to="/"
          className={({ isActive }) => (isActive ? "is-active" : "")}
        >
          Home
        </NavLink>

        <NavLink
          to={reportsPath}
          className={({ isActive }) => (isActive ? "is-active" : "")}
        >
          Reports
        </NavLink>

        <NavLink
          to="/analytics"
          className={({ isActive }) => (isActive ? "is-active" : "")}
        >
          Analytics
        </NavLink>

        <NavLink
          to="/AdminEdit"
          className={({ isActive }) => (  isActive ? "is-active" : "")}
        >
          Admin
        </NavLink>
      </nav>

      {/* Theme toggle on the right */}
      <div className="global-header__actions">
        <button
          type="button"
          className="global-header__theme-btn"
          onClick={toggle}
          aria-label="Toggle theme"
        >
          {theme === "dark" ? "Light" : "Dark"}
        </button>
      </div>
    </header>
  );
}
