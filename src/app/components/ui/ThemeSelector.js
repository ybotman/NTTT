// src/components/ui/ThemeSelector.jsx
"use client";

import React from "react";
import { useTheme } from "@/hooks/useTheme";
import { Box, IconButton } from "@mui/material";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";

export default function ThemeSelector() {
  const { theme, toggleTheme } = useTheme();

  return (
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
  );
}
