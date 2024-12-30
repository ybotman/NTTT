"use client";

import React, { useState, useCallback } from "react";
import Image from "next/image";
import { Box, Typography } from "@mui/material";
import ConfigTab from "./ConfigTab";
import PlayTab from "./PlayTab";
import { useGameContext } from "@/contexts/GameContext";
import { fetchFilteredSongs } from "@/utils/dataFetching";
import styles from "../styles.module.css";

function validateSimpleRules(config) {
  const selectedStyles = Object.keys(config.styles || {}).filter(
    (k) => config.styles[k]
  );
  if (selectedStyles.length === 0) return false;

  const levelCount = (config.levels || []).length;
  const artistCount = (config.artists || []).length;

  const hasBoth = levelCount > 0 && artistCount > 0;
  const hasNeither = levelCount === 0 && artistCount === 0;
  if (hasBoth || hasNeither) return false;

  if (levelCount > 0 && levelCount >= 3) return false;
  if (artistCount > 0 && artistCount >= 4) return false;

  return true;
}

export default function ArtistLearnPage() {
  const [songs, setSongs] = useState([]);
  const [showPlayTab, setShowPlayTab] = useState(false);

  const { config, bestScore, totalScore, completedGames, resetAll } =
    useGameContext();

  const handlePlayClick = useCallback(async () => {
    const isValid = validateSimpleRules(config);
    if (!isValid) {
      alert(
        "Selections:\n• Must select at least one style,\n• And either Levels (<3) or Artists (<4),\n• But not both or neither."
      );
      return;
    }

    const numSongs = config.numSongs ?? 10;
    const timeLimit = config.timeLimit ?? 15;
    const activeStyles = Object.keys(config.styles || {}).filter(
      (key) => config.styles[key]
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
      numSongs
    );

    if (!fetchedSongs || fetchedSongs.length === 0) {
      alert("No songs returned for this configuration. Try different settings.");
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
          <PlayTab songs={songs} config={config} onCancel={handleClosePlayTab} />
        </Box>
      )}

      {/* Top Bar */}
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
    Mastering
    <br />
    Orchestras
  </Typography>

  {/* Play Button */}
  <Box
    sx={{
      display: "flex",
      justifyContent: "center",
      flex: "1", // Ensure it spans remaining space
    }}
  >
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