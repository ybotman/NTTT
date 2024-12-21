"use client";
import React, { useContext } from "react";
import Image from "next/image";
import { Box, Typography, Paper, Button } from "@mui/material";
import Grid from "@mui/material/Grid2"; // Import Grid2
import Link from "next/link";
import { AuthContext } from "@/contexts/AuthContext";
import { auth, signInAnonymously, signOut } from "@/utils/firebase";
import { useTheme } from "@/layout";

export default function GameHubPage() {
  const { user, loadingUser } = useContext(AuthContext);
  const { theme, toggleTheme } = useTheme();

  const handleLogin = async () => {
    await signInAnonymously(auth);
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  // Define games for the grid
  const games = [
    {
      name: "Learn the Orchestra",
      path: "/games/artist-learn",
      icon: "icons/IconLearnOrch.webp",
      isActive: true,
    },
    {
      name: "Learn the Decade",
      path: "/games/decade-learn",
      icon: "icons/IconLearnDecade.webp",
      isActive: false,
    },
    {
      name: "Learn the Style",
      path: "/games/style-learn",
      icon: "icons/IconLearnStyles.webp",
      isActive: false,
    },
    {
      name: "Learn the Singer",
      path: "/games/style-learn",
      icon: "icons/IconLearnSinger.webp",
      isActive: false,
    },
    {
      name: "Orchestra Quiz",
      path: "/games/artist-quiz",
      icon: "icons/IconQuiz.webp",
      isActive: true,
    },
    {
      name: "Decade Quiz",
      path: "/games/decade-quiz",
      icon: "icons/IconLearn.webp",
      isActive: false,
    },
    {
      name: "Style Quiz",
      path: "/games/style-quiz",
      icon: "icons/IconAlternative.webp",
      isActive: false,
    },
    {
      name: "Singer Quiz",
      path: "/games/singer-quiz",
      icon: "icons/IconSinger.webp",
      isActive: false,
    },
  ];

  return (
    <Box
      sx={{
        p: 3,
        backgroundColor: "black", // Set a dark background
        color: "white", // Ensure text is readable on a dark background
        minHeight: "100vh",
      }}
    >
      {/* Header Section */}
      <Paper
        sx={{
          p: 3,
          mb: 3,
          position: "relative",
          backgroundColor: "black", // Dark background for header
          color: "white",
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h4">Game Hub</Typography>
          <Button
            variant="outlined"
            sx={{ color: "white", borderColor: "white" }}
          >
            Settings
          </Button>
        </Box>
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
      </Paper>
      {/* Games Grid */}
      <Paper sx={{ p: 3, backgroundColor: "black", color: "White" }}>
        <Grid container spacing={3}>
          {games.map((game, index) => (
            <Grid xs={6} md={3} key={index}>
              <Link href={game.path}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column", // Ensure text is below the icon
                    alignItems: "center",
                    cursor: game.isActive ? "pointer" : "default",
                    opacity: game.isActive ? 1 : 0.5,
                    transition: "transform 0.2s ease",
                    textDecoration: "none",
                  }}
                >
                  <Box
                    sx={{
                      width: "150px", // Set container width
                      height: "150px", // Set container height
                      position: "relative",
                      marginBottom: "10px",
                      "&:hover": {
                        transform: game.isActive ? "scale(1.1)" : "none",
                        filter: game.isActive ? "brightness(1.5)" : "none", // Simmer effect
                      },
                    }}
                  >
                    <Image
                      src={`/${game.icon}`} // Dynamically use the icon path
                      alt={`${game.name} Icon`} // Dynamic alt text for better accessibility
                      fill
                      sizes="(max-width: 600px) 100vw,
                             (max-width: 1200px) 50vw,
                             33vw"
                      style={{
                        objectFit: "cover",
                        borderRadius: "8px",
                        boxShadow: "0 2px 5px rgba(0, 0, 0, 0.2)",
                      }}
                    />
                  </Box>
                  <Typography
                    variant="body1"
                    textAlign="center"
                    sx={{ color: game.isActive ? "white" : "gray" }}
                  >
                    {game.name}
                  </Typography>
                </div>
              </Link>
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Box>
  );
}
