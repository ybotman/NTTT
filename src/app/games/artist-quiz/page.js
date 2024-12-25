//--------
//src/app/games/artist-quiz/page.js
//--------
"use client";

import React, { useState } from "react";
import { Box, Typography } from "@mui/material";
import Image from "next/image";
import styles from "./styles.module.css";
import ConfigTab from "./ConfigTab";
import PlayTab from "./PlayTab";
import useConfig from "@/hooks/useConfigTab";

export default function ArtistQuizPage() {
  const [songs, setSongs] = useState([]);
  const { config } = useConfig("artistQuiz");
  const [showPlayTab, setShowPlayTab] = useState(false);
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

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

  // New handler for Game Hub navigation
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

      {/* Game Hub Button */}
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
          onClick={handleGameHubClick} // Attach click handler
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
          <Image
            src={`${basePath}/icons/IconQuiz.webp`}
            alt="Play Button"
            onClick={handlePlayClick}
            layout="intrinsic" // Adjusted for intrinsic sizing
            width={100} // Exact width
            height={100} // Exact height
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
            onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")} // Reset on mouse out
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
          Quiz on Masters
        </Typography>
      </Box>
      {/* Configuration Tab - passes a callback to receive fetched songs */}
      <ConfigTab onSongsFetched={handleSongsFetched} />
    </Box>
  );
}

ArtistQuizPage.propTypes = {};
