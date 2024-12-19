"use client";

import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { Box, Button, Typography, List, ListItem, ListItemText, Stack } from "@mui/material";
import WaveSurfer from "wavesurfer.js";
import { fetchSongsAndArtists, shuffleArray } from "@/utils/dataFetching";
import useConfig from "@/hooks/useConfig";

export default function PlayTab() {
  const { config } = useConfig("artistQuiz");
  const [songs, setSongs] = useState([]);
  const [filteredSongs, setFilteredSongs] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [status, setStatus] = useState("Not Started");

  const wavesurferRef = useRef(null);
  const playTimeoutRef = useRef(null);

  const numSongs = config?.numSongs ?? 10;
  const timeLimit = config?.timeLimit ?? 15;
  const selectedLevels = Array.isArray(config?.levels) ? config.levels : [];
  const selectedStyles = config?.styles || {};
  const activeStyles = Object.keys(selectedStyles).filter((styleKey) => selectedStyles[styleKey]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { validSongs } = await fetchSongsAndArtists();
      if (mounted) {
        setSongs(validSongs);
        console.log(`Fetched ${validSongs.length} songs from API.`);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (songs.length === 0) return;

    let filtered = songs;

if (selectedLevels.length > 0) {
  filtered = filtered.filter((song) => selectedLevels.includes(song.level));
}

    if (activeStyles.length > 0) {
      filtered = filtered.filter((song) =>
        activeStyles.some((style) => style.toLowerCase() === song.SongStyle?.toLowerCase())
      );
    }

    filtered = shuffleArray(filtered).slice(0, numSongs);

    console.log("Search criteria:", {
      numSongs,
      selectedLevels,
      activeStyles,
    });
    console.log(`Filtered ${filtered.length} songs based on criteria.`);

    if (JSON.stringify(filtered) !== JSON.stringify(filteredSongs)) {
      setFilteredSongs(filtered);
    }
  }, [songs, selectedLevels, activeStyles, numSongs, filteredSongs]);

  const cleanupWaveSurfer = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.destroy();
      wavesurferRef.current = null;
    }
    if (playTimeoutRef.current) {
      clearTimeout(playTimeoutRef.current);
      playTimeoutRef.current = null;
    }
  };

  const loadCurrentSong = () => {
    cleanupWaveSurfer();
    const currentSong = filteredSongs[currentIndex];
    if (!currentSong) {
      setIsGameOver(true);
      setIsPlaying(false);
      setStatus("Finished");
      return;
    }

    const ws = WaveSurfer.create({
      container: document.createElement("div"),
      waveColor: "transparent",
      progressColor: "transparent",
      barWidth: 0,
      height: 0,
      backend: "MediaElement",
    });

    ws.on("ready", () => {
      const duration = ws.getDuration();
      const randomStart = Math.random() * 0.75 * duration;
      ws.seekTo(randomStart / duration);
      ws.play().then(() => {
        playTimeoutRef.current = setTimeout(() => {
          handleNextSong();
        }, timeLimit * 1000);
      });
    });

    ws.on("error", (err) => {
      console.error("Error with WaveSurfer:", err);
      handleNextSong();
    });

    ws.load(currentSong.audioUrl);
    wavesurferRef.current = ws;
  };

  useEffect(() => {
    if (currentIndex >= 0 && currentIndex < filteredSongs.length && isPlaying) {
      loadCurrentSong();
    }
  }, [currentIndex, filteredSongs, isPlaying]);

  const handleNextSong = () => {
    cleanupWaveSurfer();
    if (currentIndex + 1 < filteredSongs.length) {
      setCurrentIndex((prevIndex) => prevIndex + 1);
    } else {
      setIsGameOver(true);
      setIsPlaying(false);
      setStatus("Finished");
    }
  };

  const handleCancel = () => {
    cleanupWaveSurfer();
    setIsPlaying(false);
    setStatus("Not Started");
    setCurrentIndex(-1);
    setIsGameOver(false);
  };

  const startGame = () => {
    if (filteredSongs.length === 0) return;
    setIsPlaying(true);
    setIsGameOver(false);
    setCurrentIndex(0);
    setStatus("Playing");
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6">PlayTab</Typography>
      {filteredSongs.length === 0 && !isPlaying && !isGameOver && (
        <Typography>No songs match your filters. Adjust configuration.</Typography>
      )}
      {filteredSongs.length > 0 && (
        <>
          <Typography>
            {isGameOver
              ? "Game Over."
              : isPlaying
              ? `Playing song ${currentIndex + 1} of ${filteredSongs.length}`
              : "Not started."}
          </Typography>

          <List>
            {filteredSongs.map((song, idx) => (
              <ListItem key={song.SongID || idx} button="true" selected={idx === currentIndex}>
                <ListItemText primary={song.SongTitle} secondary={song.ArtistMaster} />
              </ListItem>
            ))}
          </List>

          <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
            {!isPlaying && !isGameOver && filteredSongs.length > 0 && (
              <Button variant="contained" onClick={startGame}>
                Start
              </Button>
            )}
            {isPlaying && (
              <>
                <Button variant="contained" onClick={handleNextSong}>
                  Next
                </Button>
                <Button variant="contained" onClick={handleCancel}>
                  Cancel
                </Button>
              </>
            )}
            {isGameOver && (
              <Button variant="contained" onClick={handleCancel}>
                Reset
              </Button>
            )}
          </Stack>
        </>
      )}
    </Box>
  );
}

PlayTab.propTypes = {
  // No props passed directly
};