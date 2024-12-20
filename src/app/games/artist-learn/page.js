//--------
//src/app/games/artist-learn/page.js
//--------

"use client";

import React, { useState } from "react";
import { Box, Typography } from "@mui/material";

import styles from "../styles.module.css";
import ConfigTab from "./ConfigTab";
import PlayTab from "./PlayTab";
import useConfig from "./useConfig";

export default function ArtistLearnPage() {
  const [songs, setSongs] = useState([]);
  const { config } = useConfig("artistQuiz");
  const [showPlayTab, setShowPlayTab] = useState(false);

  const handleSongsFetched = (fetchedSongs) => {
    setSongs(fetchedSongs);
    console.log("Songs fetched and set for playback:", fetchedSongs);
  };

  const handlePlayClick = () => {
    // Show the PlayTab full page
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
    <Box className={styles.container}>
      {/* Conditionally show the PlayTab as a full page overlay */}
      {showPlayTab && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "#fff",
            zIndex: 9999,
            overflow: "auto",
            p: 2,
          }}
        >
          <PlayTab songs={songs} config={config} onCancel={handleClosePlayTab} />
        </Box>
      )}

      {/* Header Section with Play Button and Title */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          mb: 4,
        }}
      >
        {/* Play Button */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            mb: 2,
          }}
        >
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

        {/* Game Title */}
        <Typography
          variant="h5"
          sx={{ fontWeight: "bold", textAlign: "center" }}
        >
          Artist Learn Game
        </Typography>
      </Box>

      {/* Configuration Tab - passes a callback to receive fetched songs */}
      <ConfigTab onSongsFetched={handleSongsFetched} />
    </Box>
  );
}
