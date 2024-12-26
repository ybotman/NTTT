"use client";
import Image from "next/image";
import React, { useEffect, useState, useCallback } from "react";
import { Box, Typography } from "@mui/material";
import styles from "../styles.module.css";
import ConfigTab from "./ConfigTab";
import PlayTab from "./PlayTab";
//import useConfig from "@/hooks/useConfigTab";
import useConfigTab from "@/hooks/useConfigTab";
import useArtistLearn from "@/hooks/useArtistLearn";
import { useRouter } from "next/navigation";
import { fetchFilteredSongs } from "@/utils/dataFetching";

import PropTypes from "prop-types";

export default function ArtistLearnPage() {
  const [songs, setSongs] = useState([]);
  const [showPlayTab, setShowPlayTab] = useState(false);
  const { config, updateConfig, isDisabled } = useConfigTab("artistLearn");
  console.log("Current page useConfigTab:", config);
  // 1) The main config from the user. OLD
  //const { config } = useConfig("artistLearn");
  //console.log("Current useConfig:", config);

  // 2) The artist-learn hook that contains style/artist data & validation
  const {
    validationMessage,
    setValidationMessage,
    validateInputs,
    selectedArtists,
  } = useArtistLearn(); // We don’t pass onSongsFetched; we’re no longer auto-fetching

  const router = useRouter();
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

  // ---- Handler to manually fetch songs using the final config
  const fetchSongsForPlay = useCallback(async () => {
    // 1) Validate local config first
    const error = validateInputs(config);
    if (error) {
      setValidationMessage(error);
      console.warn("Validation error:", error);
      return null;
    }
    await new Promise((r) => setTimeout(r, 0));

    const freshConfig = { ...config };
    console.log("About to fetch songs with config:", freshConfig);

    // 2) Build fetch logic
    const numSongs = freshConfig.numSongs ?? 10;
    const artistLevels = freshConfig.levels || [];
    const activeStyles = Object.keys(freshConfig.styles || {}).filter(
      (key) => freshConfig.styles[key],
    );
    const chosenArtists = (config.artists || []).map((a) => a.value);

    try {
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
      return fetchedSongs;
    } catch (err) {
      console.error("Error fetching songs for Play:", err);
      return null;
    }
  }, [config, setValidationMessage, validateInputs]);

  // ---- On Play Click
  const handlePlayClick = async () => {
    console.log("Play clicked with config:", config );
    const fetchedSongs = await fetchSongsForPlay();
    if (!fetchedSongs || fetchedSongs.length === 0) {
      console.warn("No songs returned. Adjust config.");
      return;
    }
    // If songs exist, proceed
    setSongs(fetchedSongs);
    setShowPlayTab(true);
  };

  // ---- “Close” or “Cancel” from Play tab
  const handleClosePlayTab = () => {
    setShowPlayTab(false);
  };

  // ---- Return to game hub
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
      {/* Overlays the PlayTab if showPlayTab is true */}
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
            src={`${basePath}/icons/IconGameHub.jpg`}
            alt="Game Hub"
            width={100}
            height={100}
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
              animation: "shimmer 2s infinite",
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

      {/* Header Section with the “Play” button and Title */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          mb: 4,
        }}
      >
        {/* “Play” button */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Image
            src={`${basePath}/icons/IconLearnOrch.webp`}
            alt="Play Button"
            onClick={handlePlayClick}
            layout="intrinsic"
            width={100}
            height={100}
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
          sx={{
            fontWeight: "bold",
            textAlign: "center",
            color: "var(--foreground)",
          }}
        >
          Mastering Orchestras and Maestros
        </Typography>
      </Box>

      {/* Configuration Tab (No longer auto-fetching songs) */}
      <ConfigTab />
      {/* If you want to show a validation error on screen, you can do so here: */}
      {validationMessage && (
        <Typography
          variant="body2"
          sx={{ color: "red", marginTop: "1rem", textAlign: "center" }}
        >
          {validationMessage}
        </Typography>
      )}
    </Box>
  );
}

ArtistLearnPage.propTypes = {
  // Not strictly necessary, but you can define any props if you pass them here
};
