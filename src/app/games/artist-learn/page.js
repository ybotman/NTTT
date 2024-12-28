// ------------------------------------------------------------
// src/app/games/artist-learn/page.js
// ------------------------------------------------------------
"use client";
import React, { useState } from "react";
import Image from "next/image";
import { Box, Typography, Button, Paper } from "@mui/material";
import ConfigTab from "./ConfigTab";
import PlayTab from "./PlayTab";
import { useRouter } from "next/navigation";
import { useGameContext } from "@/contexts/GameContext"; // The shared context
import { fetchFilteredSongs } from "@/utils/dataFetching";
import styles from "../styles.module.css";

export default function ArtistLearnPage() {
  const router = useRouter();
  const [songs, setSongs] = useState([]);
  const [showPlayTab, setShowPlayTab] = useState(false);

  // 1) Access config & scoring from GameContext
  const { config, bestScore, totalScore, completedGames, resetAll } =
    useGameContext();
  console.log("uconfig", config);

  // 2) “Play” button click -> fetch songs, show PlayTab
  const handlePlayClick = async () => {
    // Prepare config with defaults if user never touched
    const numSongs = config.numSongs ?? 10;
    const timeLimit = config.timeLimit ?? 15;
    const activeStyles = Object.keys(config.styles || {}).filter(
      (key) => config.styles[key],
    );
    const artistLevels = config.levels || [];
    const chosenArtists = (config.artists || []).map((a) => a.value);

    // Actually fetch your songs from the server
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
      console.warn("No songs returned. Adjust config.");
      return;
    }

    setSongs(fetchedSongs);
    setShowPlayTab(true);
  };

  const handleClosePlayTab = () => {
    setShowPlayTab(false);
  };

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
      {/* If showPlayTab, overlay the PlayTab */}
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

      {/* Game Hub Button (Top-Left) */}
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
            }}
          >
            Game Hub
          </Typography>
        </Box>
      </Box>

      {/* Top Center: “Play” Button & Right-Side Score Box */}
      <Box sx={{ display: "flex", justifyContent: "center", mt: 2, mb: 2 }}>
        {/* Play Button */}
        <Box sx={{ textAlign: "center" }}>
          <Image
            src={`/icons/IconLearnOrch.webp`}
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
            variant="h6"
            sx={{
              mt: 1,
              fontWeight: "bold",
              color: "var(--accent)",
            }}
          >
            Play
          </Typography>
        </Box>

        {/* Scores & Reset (Box to the right) */}
        <Paper
          sx={{
            position: "absolute",
            top: "3rem",
            right: "3rem",
            p: 2,
            border: "1px solid var(--foreground)",
            backgroundColor: "var(--background)",
            color: "var(--foreground)",
            minWidth: "120px",
          }}
        >
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Best Score:</strong> {bestScore}
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Total Score:</strong> {totalScore}
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Games:</strong> {completedGames}
          </Typography>
          <Button
            variant="outlined"
            size="small"
            onClick={resetAll}
            sx={{
              color: "var(--foreground)",
              borderColor: "var(--foreground)",
              fontSize: "0.75rem",
              padding: "2px 6px",
              minWidth: 0,
            }}
          >
            Reset
          </Button>
        </Paper>
      </Box>

      {/* Game Title */}
      <Typography
        variant="h5"
        sx={{
          fontWeight: "bold",
          textAlign: "center",
          color: "var(--foreground)",
          mb: 3,
        }}
      >
        Mastering Orchestras and Maestros
      </Typography>

      {/* Configuration Tab */}
      <ConfigTab />
    </Box>
  );
}
