// ------------------------------------------------------------
// src/app/games/artist-learn/page.js
// ------------------------------------------------------------
"use client";
import Image from "next/image";
import React, { useState, useCallback } from "react";
import { Box, Typography, Button } from "@mui/material";
import styles from "../styles.module.css";
import ConfigTab from "./ConfigTab";
import PlayTab from "./PlayTab";
import { useRouter } from "next/navigation";
import { fetchFilteredSongs } from "@/utils/dataFetching";
import { useGameContext } from "@/contexts/GameContext"; // <— ADDED

export default function ArtistLearnPage() {
  const router = useRouter();
  const [songs, setSongs] = useState([]);
  const [showPlayTab, setShowPlayTab] = useState(false);

  // 1) Grab everything from GameContext
  const {
    config,
    updateConfig,
    bestScore,
    totalScore,
    completedGames,
    resetAll,
    // Optionally: currentScore if you want to display it here
  } = useGameContext();

  // 2) Called when user clicks “Play”
  const handlePlayClick = useCallback(async () => {
    // Actually fetch songs using the config
    // If you have validation, do it here or rely on your existing logic in hooks
    const fresh = { ...config };

    // Fallback defaults if user never touched config
    const numSongs = fresh.numSongs ?? 10;
    const activeStyles = Object.keys(fresh.styles || {}).filter((key) => fresh.styles[key]);
    const artistLevels = fresh.levels || [];
    const chosenArtists = fresh.artists?.map((a) => a.value) || [];

    // Just an example fetch
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
      console.warn("No songs returned. Adjust config or try again.");
      return;
    }

    // If success, set them & show PlayTab
    setSongs(fetchedSongs);
    setShowPlayTab(true);
  }, [config]);

  // 3) Close or Cancel play tab
  const handleClosePlayTab = () => {
    setShowPlayTab(false);
  };

  // 4) Reset
  const handleReset = () => {
    resetAll();
  };

  // 5) Return to game hub
  const handleGameHubClick = () => {
    router.push("/games/gamehub");
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
      {/* If user hits “Play,” show the PlayTab in an overlay */}
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

      {/* Button to return to GameHub */}
      <Box sx={{ position: "absolute", top: "1rem", left: "1rem" }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            mb: 2,
            cursor: "pointer",
            transition: "transform 0.2s",
            "&:hover": {
              transform: "scale(1.05)",
            },
          }}
          onClick={handleGameHubClick}
        >
          <Image
            src={`/icons/IconGameHub.jpg`}
            alt="Game Hub"
            width={80}
            height={80}
            style={{
              borderRadius: "50%",
              objectFit: "cover",
              boxShadow: "0 0 15px rgba(0, 123, 255, 0.5)",
            }}
          />
          <Typography
            variant="h6"
            sx={{
              mt: 1,
              fontWeight: "bold",
              color: "var(--accent)",
              "@keyframes shimmer": {
                "0%": { opacity: 1 },
                "50%": { opacity: 0.5 },
                "100%": { opacity: 1 },
              },
            }}
          >
            Game Hub
          </Typography>
        </Box>
      </Box>

      {/* Top Layout: Title, Reset, Score Info */}
      <Box sx={{ textAlign: "center", mb: 3, mt: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: "bold", mb: 2 }}>
          ArtistLearn
        </Typography>
        <Typography variant="body1">Best Score: {bestScore}</Typography>
        <Typography variant="body1">Total Score: {totalScore}</Typography>
        <Typography variant="body1">Games Completed: {completedGames}</Typography>

        <Button
          variant="outlined"
          onClick={handleReset}
          sx={{ mt: 2, color: "var(--foreground)", borderColor: "var(--foreground)" }}
        >
          Reset All
        </Button>
      </Box>

      {/* ConfigTab */}
      <ConfigTab />

      {/* “Play” button */}
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <Button
          variant="contained"
          onClick={handlePlayClick}
          sx={{
            background: "var(--accent)",
            color: "var(--background)",
            "&:hover": { opacity: 0.8 },
          }}
        >
          Play
        </Button>
      </Box>
    </Box>
  );
}
