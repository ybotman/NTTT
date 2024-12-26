// ------------------------------------------------------------
// src/app/games/artist-learn/ConfigTab.js
// ------------------------------------------------------------
"use client";
import React, { useState } from "react";
import Image from "next/image";
import { Box, Typography, Button, Paper } from "@mui/material";
import ConfigTab from "./ConfigTab";
import PlayTab from "./PlayTab";
import { useRouter } from "next/navigation";
import { useGameContext } from "@/contexts/GameContext";
import { fetchFilteredSongs } from "@/utils/dataFetching";
import styles from "../styles.module.css";

export default function ArtistLearnPage() {
  const router = useRouter();
  const [songs, setSongs] = useState([]);
  const [showPlayTab, setShowPlayTab] = useState(false);

  const { config, bestScore, totalScore, completedGames, resetAll } =
    useGameContext();

  const handlePlayClick = async () => {
    const numSongs = config.numSongs ?? 10;
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

      {/* Score Box in top-right */}
      <Paper
        sx={{
          position: "absolute",
          top: "1rem",
          right: "1rem",
          p: 1,
          border: "1px solid var(--foreground)",
          backgroundColor: "var(--background)",
          color: "var(--foreground)",
          minWidth: "120px",
        }}
      >
        <Typography
          variant="caption"
          sx={{ display: "block", mb: 0.5, fontSize: "0.8rem" }}
        >
          <strong>Best:</strong> {bestScore}
        </Typography>
        <Typography
          variant="caption"
          sx={{ display: "block", mb: 0.5, fontSize: "0.8rem" }}
        >
          <strong>Total:</strong> {totalScore}
        </Typography>
        <Typography
          variant="caption"
          sx={{ display: "block", mb: 0.5, fontSize: "0.8rem" }}
        >
          <strong>Games:</strong> {completedGames}
        </Typography>
        <Button
          variant="outlined"
          size="small"
          onClick={resetAll}
          sx={{
            mt: 0.5,
            color: "var(--foreground)",
            borderColor: "var(--foreground)",
            fontSize: "0.7rem",
            padding: "2px 6px",
            minWidth: 0,
          }}
        >
          Reset
        </Button>
      </Paper>

      {/* Centered "Play" button + Title */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          mt: 6,
        }}
      >
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
          onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
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
        <Typography
          variant="h5"
          sx={{
            fontWeight: "bold",
            textAlign: "center",
            color: "var(--foreground)",
            mt: 2,
            mb: 3,
          }}
        >
          Mastering Orchestras and Maestros
        </Typography>
      </Box>

      {/* Configuration Tab */}
      <ConfigTab />
    </Box>
  );
}
