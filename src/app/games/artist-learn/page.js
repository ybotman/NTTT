"use client";

import React from "react";
import { Box, Typography } from "@mui/material";
import ConfigTab from "./ConfigTab";
import styles from "./styles.module.css";

export default function ArtistLearnPage() {
  const handlePlayClick = () => {
    console.log("Play button clicked!");
    // Add any additional functionality for the play button here.
  };

  return (
    <Box className={styles.container}>
      {/* Centered Play Button with Shimmering Text */}
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 4 }}>
        <img
          src="/IconLearnOrch.webp"
          alt="Play Button"
          onClick={handlePlayClick}
          style={{
            cursor: "pointer",
            borderRadius: "50%",
            width: 100,
            height: 100,
            objectFit: "cover",
            boxShadow: "0 0 15px rgba(0, 123, 255, 0.5)",
          }}
        />
        <Typography
          variant="h6"
          sx={{
            mt: 2,
            fontWeight: "bold",
            color: "#007BFF",
            animation: "shimmer 2s infinite",
            "@keyframes shimmer": {
              "0%": { opacity: 1 },
              "50%": { opacity: 0.5 },
              "100%": { opacity: 1 },
            },
          }}
        >
          Play
        </Typography>
      </Box>
      {/* Configuration Tab */}
      <ConfigTab />
    </Box>
  );
}
