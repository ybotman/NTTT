// src/app/games/gamehub/page.js

"use client";
import React, { useContext } from "react";
import Image from "next/image";
import { Box, Typography, Paper } from "@mui/material";
import Grid from "@mui/material/Grid2";
import Link from "next/link";
import { AuthContext } from "@/contexts/AuthContext";

export default function GameHubPage() {
  const { user, loadingUser } = useContext(AuthContext);

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
        backgroundColor: "var(--background)", // Dynamic theme background
        color: "var(--foreground)", // Dynamic theme text color
        minHeight: "100vh",
        transition: "background-color 0.3s, color 0.3s",
      }}
    >
      {/* Games Grid */}
      <Paper
        sx={{
          p: 3,
          backgroundColor: "var(--background)",
          color: "var(--foreground)",
        }}
      >
        <Grid container spacing={3}>
          {games.map((game, index) => {
            // If isActive = true => we disable (un-clickable)
            const disabled = game.isActive === false;

            return (
              <Grid xs={6} md={3} key={index}>
                <Link href={disabled ? "#" : game.path} /* '#' if disabled */>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      cursor: disabled ? "default" : "pointer",
                      opacity: disabled ? 0.5 : 1,
                      transition: "transform 0.2s ease",
                      textDecoration: "none",
                    }}
                  >
                    <Box
                      sx={{
                        width: "85px",
                        height: "85px",
                        position: "relative",
                        marginBottom: "10px",
                        "&:hover": {
                          transform: disabled ? "none" : "scale(1.1)",
                          filter: disabled ? "none" : "brightness(1.5)",
                        },
                      }}
                    >
                      <Image
                        src={`/${game.icon}`}
                        alt={`${game.name} Icon`}
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
                      sx={{
                        color: disabled ? "gray" : "var(--foreground)",
                      }}
                    >
                      {game.name}
                    </Typography>
                  </div>
                </Link>
              </Grid>
            );
          })}
        </Grid>
      </Paper>
    </Box>
  );
}
