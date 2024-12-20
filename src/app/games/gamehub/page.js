//-----------------------------------------------------------------------------------------
//src/app/games/gamehub/page.js
//-----------------------------------------------------------------------------------------

"use client";
import React, { useContext } from "react";
import { Box, Typography, Grid, Paper, Button } from "@mui/material";
import Link from "next/link";
import { AuthContext } from "@/contexts/AuthContext";
import { auth, signInAnonymously, signOut } from "@/utils/firebase";
import { useTheme } from "@/layout"; // Import the useTheme hook

export default function GameHubPage() {
  const { user, loadingUser } = useContext(AuthContext);
  const { theme, toggleTheme } = useTheme(); // Access theme and toggle

  const handleLogin = async () => {
    await signInAnonymously(auth);
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  // Define games for the grid
  const games = [
    {
      name: "Artist Learn",
      path: "/games/artist-learn",
      icon: "/IconLearnSongs.webp",
    },
    { name: "Decade Learn", path: "#", icon: "/IconLearnDecade.webp" },
    { name: "Style Learn", path: "#", icon: "/IconLearnStyles.webp" },
    { name: "Singer Learn", path: "#", icon: "/IconLearnOrch.webp" },
    { name: "Artist Quiz", path: "/games/artistquiz", icon: "/IconQuiz.webp" },
    { name: "Decade Quiz", path: "#", icon: "/IconQuiz.webp" },
    { name: "Style Quiz", path: "#", icon: "/IconQuiz.webp" },
    { name: "Singer Quiz", path: "#", icon: "/IconQuiz.webp" },
  ];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header Section */}
      <Paper sx={{ p: 3, mb: 3, position: "relative" }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h4">Game Hub</Typography>
          {!loadingUser &&
            (user ? (
              <Typography
                onClick={handleLogout}
                sx={{
                  cursor: "pointer",
                  fontSize: "1rem",
                  color: "blue",
                  "&:hover": { textDecoration: "underline" },
                }}
              >
                Logout
              </Typography>
            ) : (
              <Typography
                onClick={handleLogin}
                sx={{
                  cursor: "pointer",
                  fontSize: "1rem",
                  color: "blue",
                  "&:hover": { textDecoration: "underline" },
                }}
              >
                Login
              </Typography>
            ))}
        </Box>
        {/* Dark Mode Toggle Button */}
        <Button
          onClick={toggleTheme}
          sx={{
            position: "absolute",
            top: "1rem",
            right: "1rem",
            padding: "0.5rem 1rem",
            background: "var(--foreground)",
            color: "var(--background)",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            "&:hover": {
              opacity: 0.8,
            },
          }}
        >
          {theme === "light" ? "Dark Mode" : "Light Mode"}
        </Button>
      </Paper>

      {/* Games Grid */}
      <Paper sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {games.map((game, index) => (
            <Grid item xs={6} md={3} key={index}>
              <Link href={game.path}>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    cursor: game.path === "#" ? "default" : "pointer",
                    opacity: game.path === "#" ? 0.5 : 1,
                    "&:hover": {
                      transform: game.path === "#" ? "none" : "scale(1.05)",
                    },
                    transition: "transform 0.2s ease",
                  }}
                >
                  <img
                    src={game.icon}
                    alt={game.name}
                    style={{
                      width: "150px",
                      height: "150px",
                      marginBottom: "10px",
                      borderRadius: "8px",
                      boxShadow: "0 2px 5px rgba(0, 0, 0, 0.2)",
                    }}
                  />
                  <Typography variant="body1" textAlign="center">
                    {game.name}
                  </Typography>
                </Box>
              </Link>
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Box>
  );
}
