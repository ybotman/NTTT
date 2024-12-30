//------------------------------------------------------------
// src/app/layout.js
//------------------------------------------------------------
"use client";

import React from "react";
import "./globals.css";
import PropTypes from "prop-types";
import { AuthProvider } from "@/contexts/AuthContext";
import { ScoreProvider, useScoreContext } from "@/contexts/ScoreContext";
import { ThemeProvider } from "@/hooks/useTheme";

import { CssBaseline, Box } from "@mui/material";
import { Inter } from "next/font/google";

import ThemeSelector from "@/components/ui/ThemeSelector";
import GameScoreCurrent from "@/components/ui/GameScoreCurrent";
import GameHubButton from "@/components/ui/GameHubRoute";

const inter = Inter({ subsets: ["latin"] });

function LayoutContent({ children }) {
  // Access scores from ScoreContext
  const { bestScore, totalScore, completedGames, resetAll } = useScoreContext();

  // Provide fallback in case they're undefined or null
  const safeBest = bestScore ?? 0;
  const safeTotal = totalScore ?? 0;
  const safeCompleted = completedGames ?? 0;

  return (
    <>
      <ThemeSelector />
      <Box sx={{ position: "absolute", top: "1rem", right: "3rem" }}>
        <GameScoreCurrent
          bestScore={safeBest}
          totalScore={safeTotal}
          completedGames={safeCompleted}
          onReset={resetAll}
        />
      </Box>

      {/* Add GameHubButton to a fixed location */}
      <Box sx={{ position: "absolute", top: "1rem", right: "5rem" }}>
        <GameHubButton />
      </Box>

      {children}
    </>
  );
}

LayoutContent.propTypes = {
  children: PropTypes.node.isRequired,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        <CssBaseline />
        <AuthProvider>
          <ScoreProvider>
            <ThemeProvider>
              <LayoutContent>{children}</LayoutContent>
            </ThemeProvider>
          </ScoreProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

RootLayout.propTypes = {
  children: PropTypes.node.isRequired,
};
