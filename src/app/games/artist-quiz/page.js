//--------
//src/app/games/artist-quiz/page.js
"use client";

import React, { useState, useCallback } from "react";
import { Box, Typography } from "@mui/material";
import Image from "next/image";
import ConfigTab from "./ConfigTab";
import PlayTab from "./PlayTab";
import { useGameContext } from "@/contexts/GameContext";
import { fetchFilteredSongs } from "@/utils/dataFetching";
import styles from "./styles.module.css";

export default function ArtistQuizPage() {
  const [songs, setSongs] = useState([]);
  const [showPlayTab, setShowPlayTab] = useState(false);

  const { config } = useGameContext();

  const handlePlayClick = useCallback(async () => {
    console.log(config);
    const isValid = true;
    if (!isValid) {
      alert(
        "Selections:\n• Must select at least one style,\n• And either Levels (<3) or Artists (<4),\n• But not both or neither.",
      );
      return;
    }

    const numSongs = config.numSongs ?? 10;
    const timeLimit = config.timeLimit ?? 15;
    const activeStyles = Object.keys(config.styles || {}).filter(
      (key) => config.styles[key],
    );
    const artistLevels = config.levels || [];
    const chosenArtists = (config.artists || []).map((a) => a.value);

    const { songs: fetchedSongs } = await fetchFilteredSongs(
      chosenArtists,
      artistLevels,
      [],
      activeStyles,
      "N",
      "N",
      "N",
      numSongs,
    );

    if (!fetchedSongs || fetchedSongs.length === 0) {
      alert(
        "No songs returned for this configuration. Try different settings.",
      );
      return;
    }

    setSongs(fetchedSongs);
    setShowPlayTab(true);
  }, [config]);

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
      }}
    >
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
          <PlayTab
            songs={songs}
            config={config}
            onCancel={handleClosePlayTab}
          />
        </Box>
      )}

      {/* Header Section */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          px: 2,
          mt: 1,
          mb: 2,
        }}
      >
        {/* Game Title */}
        <Typography
          variant="h5"
          sx={{
            fontWeight: "bold",
            color: "var(--foreground)",
            mr: "auto", // Push everything else to the right
          }}
        >
          Orchestra
          <br />Q U I Z
        </Typography>

        {/* Play Button */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            ml: "-7rem",
            flex: "1", // Ensure it spans remaining space
          }}
        >
          <Box sx={{ textAlign: "center" }}>
            <Image
              src={`/icons/IconQuiz.webp`}
              alt="Play Button"
              onClick={handlePlayClick}
              width={80}
              height={80}
              style={{
                cursor: "pointer",
                borderRadius: "50%",
                objectFit: "cover",
                boxShadow: "0 0 15px rgba(0, 123, 255, 0.5)",
                transition: "transform 0.2s",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.transform = "scale(1.05)")
              }
              onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
            />
            <Typography
              variant="h5"
              sx={{
                mt: 1,
                color: "var(--accent)",
              }}
            >
              Play
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Configuration Tab */}
      <ConfigTab />
    </Box>
  );
}
