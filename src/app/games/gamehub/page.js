"use client";
import React, { useContext } from "react";
import Image from "next/image";
import { Box, Typography, Grid, Paper, Button } from "@mui/material";
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
      icon: "/IconLearnOrch.webp",
      isActive: true,
    },
    {
      name: "Learn the Decade",
      path: "/games/decade-learn",
      icon: "/IconLearnDecade.webp",
      isActive: false,
    },
    {
      name: "Learn the Style",
      path: "/games/style-learn",
      icon: "/IconLearnStyles.webp",
      isActive: false,
    },
    {
      name: "Learn the Singer",
      path: "/games/style-learn",
      icon: "/IconLearnSinger.webp",
      isActive: false,
    },
    {
      name: "Orchestra Quiz",
      path: "/games/artist-quiz",
      icon: "/IconQuiz.webp",
      isActive: true,
    },
    { name: "Decade Quiz", path: "#", icon: "/IconQuiz.webp", isActive: false },
    { name: "Style Quiz", path: "#", icon: "/IconQuiz.webp", isActive: false },
    { name: "Singer Quiz", path: "#", icon: "/IconQuiz.webp", isActive: false },
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
      </Paper>
      {/* Games Grid */}
      <Paper sx={{ p: 3, backgroundColor: "black", color: "White" }}>
        <Grid container spacing={3}>
          {games.map((game, index) => (
            <Grid item xs={6} md={3} key={index}>
              <Link href={game.path}>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column", // Ensure text is below the icon
                    alignItems: "center",
                    cursor: game.isActive ? "pointer" : "default",
                    opacity: game.isActive ? 1 : 0.5,
                    transition: "transform 0.2s ease",
                    "&:hover": {
                      transform: game.isActive ? "scale(1.1)" : "none",
                      filter: game.isActive ? "brightness(1.5)" : "none", // Simmer effect
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: "150px", // Set container width
                      height: "150px", // Set container height
                      position: "relative",
                      marginBottom: "10px",
                    }}
                  >
<Image
  src="/IconLearnStyles.webp"
  alt="Styles Icon"
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
                </Box>
              </Link>
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Box>
  );
}
