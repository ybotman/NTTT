// src/hooks/useTheme.js
"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

// 1) Create the actual ThemeContext
export const ThemeContext = createContext({
  theme: "light",
  toggleTheme: () => {},
});

// 2) The custom hook that uses ThemeContext
export function useTheme() {
  return useContext(ThemeContext);
}

// 3) If you also want a provider here:
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("light");

  // Check system preference on mount
  useEffect(() => {
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    setTheme(prefersDark ? "dark" : "light");
  }, []);

  // Apply the theme to <html data-theme="...">
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // The toggler
  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
