//------------------------------------------------------------
// src/app/layout.js
//------------------------------------------------------------
"use client";

import React, { useEffect, useState, createContext, useContext } from "react";
import "./globals.css";
import PropTypes from "prop-types";
import { ScoreProvider } from "@/contexts/ScoreContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { CssBaseline } from "@mui/material";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

// Create a ThemeContext to allow any page/component to access and toggle theme
const ThemeContext = createContext({
  theme: "light",
  toggleTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export default function RootLayout({ children }) {
  const [theme, setTheme] = useState("light");

  // Check system preference and update theme on mount
  useEffect(() => {
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: light)",
    ).matches;
    setTheme(prefersDark ? "dark" : "light");
  }, []);

  // Dynamically apply the theme to the HTML element
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <html lang="en" className={inter.className}>
      <body>
        <CssBaseline />
        <AuthProvider>
          <ScoreProvider>
            <ThemeContext.Provider value={{ theme, toggleTheme }}>
              {children}
            </ThemeContext.Provider>
          </ScoreProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

RootLayout.propTypes = {
  children: PropTypes.node.isRequired,
};
