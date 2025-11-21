// src/Navigation.jsx
import { NavLink } from "react-router-dom";
import { useTheme } from "../theme/theme.jsx";
import "./Navigation_staff.css";
import logo from "/dlsud.png";

export default function Navigation() {
  const { theme, toggle } = useTheme();

  // Correct staff report route
  let reportsPath = "/reportstaff";

  try {
    const raw = localStorage.getItem("currentUser");
    if (raw) {
      const user = JSON.parse(raw);

      if (user?.kind === "staff") {
        reportsPath = "/reportstaff";   // 👈 THIS IS THE CORRECT PATH
      }
    }
  } catch {}

  return (
    <header className="global-header">

      {/* BRAND */}
      <div className="global-header__brand">
        <NavLink to="/Staff" className="global-header__brand-link">
          <img src={logo} alt="logo" className="global-header__logo" />
          <span className="global-header__title">BFMO Report Staff System</span>
        </NavLink>
      </div>

      {/* NAV LINKS */}
      <nav className="global-header__nav">
        <NavLink
          to="/Staff"
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
          to="/analyticsstaff"
          className={({ isActive }) => (isActive ? "is-active" : "")}
        >
          Analytics
        </NavLink>
      </nav>

      {/* THEME BUTTON */}
      <div className="global-header__actions">
        <button
          type="button"
          className="global-header__theme-btn"
          onClick={toggle}
        >
          {theme === "dark" ? "Light" : "Dark"}
        </button>
      </div>
    </header>
  );
}
