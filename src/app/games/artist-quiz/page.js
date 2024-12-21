//--------
//src/app/games/artist-quiz/page.js
//--------
"use client";

import React, { useState } from "react";
import PropTypes from "prop-types";
import { Box, Typography, Button } from "@mui/material";
import Image from "next/image";
import { useTheme } from "@/layout"; 
import styles from "./styles.module.css";
import useConfig from "./useConfig";
import ConfigTab from "./ConfigTab";
import PlayTab from "./PlayTab";

export default function ArtistQuizPage() {
  const [songs, setSongs] = useState([]);
  const { config } = useConfig("artistQuiz");
  const [showPlayTab, setShowPlayTab] = useState(false);

  const { theme, toggleTheme } = useTheme();

  const handleSongsFetched = (fetchedSongs) => {
    setSongs(fetchedSongs);
    console.log("Songs fetched for quiz:", fetchedSongs);
  };

  const handlePlayClick = () => {
    if (songs.length === 0) {
      console.warn("No songs available. Please adjust configuration.");
      return;
    }
    setShowPlayTab(true);
  };

  const handleClosePlayTab = () => {
    setShowPlayTab(false);
  };

  return (
    <Box
      className={styles.container}
      sx={{
        color: "var(--foreground)",
        background: "var(--background)",
        minHeight: "100vh",
        position: "relative",
        p: 2,
      }}
    >
      {/* Dark Mode Toggle */}
      <Box sx={{ position: "absolute", top: "1rem", right: "1rem" }}>
        <Button
          onClick={toggleTheme}
          sx={{
            background: "var(--foreground)",
            color: "var(--background)",
            border: "none",
            borderRadius: "4px",
            padding: "0.5rem 1rem",
            cursor: "pointer",
            "&:hover": {
              opacity: 0.8,
            },
          }}
        >
          {theme === "light" ? "Dark Mode" : "Light Mode"}
        </Button>
      </Box>

      {showPlayTab && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "var(--background)",
            zIndex: 9999,
            overflow: "auto",
            p: 2,
          }}
        >
          <PlayTab songs={songs} config={config} onCancel={handleClosePlayTab} />
        </Box>
      )}

      {/* Header Section with Play Button and Title */}
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 4 }}>
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 2 }}>
          <Image
            src="/IconLearnOrch.webp"
            alt="Play Button"
            onClick={handlePlayClick}
            width={100}
            height={100}
            style={{
              cursor: "pointer",
              borderRadius: "50%",
              objectFit: "cover",
              boxShadow: "0 0 15px rgba(0, 123, 255, 0.5)",
              transition: "transform 0.2s",
            }}
            onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
            onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
          />

          <Typography
            variant="h6"
            sx={{
              mt: 1,
              fontWeight: "bold",
              color: "var(--accent)",
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

        <Typography
          variant="h5"
          sx={{
            fontWeight: "bold",
            textAlign: "center",
            color: "var(--foreground)",
          }}
        >
          Artist Quiz
        </Typography>
      </Box>

      {/* Configuration Tab */}
      <ConfigTab onSongsFetched={handleSongsFetched} />
    </Box>
  );
}

ArtistQuizPage.propTypes = {};

