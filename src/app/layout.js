//------------------------------------------------------------
// src/app/layout.js
//------------------------------------------------------------
"use client";

import React, { useEffect, useState, createContext, useContext } from "react";
import "./globals.css";
import PropTypes from "prop-types";
import { ScoreProvider } from "@/contexts/ScoreContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { CssBaseline, Box, IconButton } from "@mui/material";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

// Create a ThemeContext to allow any page/component to access + toggle theme
const ThemeContext = createContext({
  theme: "light",
  toggleTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export default function RootLayout({ children }) {
  const [theme, setTheme] = useState("light");

  // Check system preference on mount
  useEffect(() => {
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    setTheme(prefersDark ? "dark" : "light");
  }, []);

  // Dynamically apply the theme to <html data-theme="...">
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
              <Box
                sx={{
                  position: "fixed",
                  top: 16,
                  right: 16,
                  zIndex: 9999,
                }}
              >
                <IconButton
                  onClick={toggleTheme}
                  sx={{
                    color: "var(--foreground)",
                    backgroundColor: "var(--background)",
                    "&:hover": { opacity: 0.8 },
                  }}
                >
                  {theme === "light" ? <LightModeIcon /> : <DarkModeIcon />}
                </IconButton>
              </Box>

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
