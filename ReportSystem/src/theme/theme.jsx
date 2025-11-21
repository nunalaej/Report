import { createContext, useContext, useEffect, useMemo, useState } from "react";

const ThemeCtx = createContext({ theme: "light", toggle: () => {} });
export const useTheme = () => useContext(ThemeCtx);

export function ThemeProvider({ children }) {
  // read once from localStorage
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");

  // write to <html data-theme="..."> and persist
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const value = useMemo(() => ({
    theme,
    toggle: () => setTheme(t => t === "light" ? "dark" : "light"),
    setTheme
  }), [theme]);

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}
