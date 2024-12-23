//--------
//src/app/games/artist-learn/PlayTab.js
//--------

"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import PropTypes from "prop-types";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Stack,
  Button,
  LinearProgress,
} from "@mui/material";
import WaveSurfer from "wavesurfer.js";
import styles from "../styles.module.css";

export default function PlayTab({ songs, config, onCancel }) {
  const wavesurferRef = useRef(null);
  const playTimeoutRef = useRef(null);
  const fadeIntervalRef = useRef(null);
  const listRef = useRef(null);
  const countdownRef = useRef(null);

  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [ready, setReady] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  const PLAY_DURATION = config.timeLimit ?? 15;
  const FADE_DURATION = 0.75;
  console.log("PlayTab - Config:", config);
  console.log("PlayTab - PLAY_DURATION:", PLAY_DURATION);

  useEffect(() => {
    console.log("PlayTab - Received Config:", config);
  }, [config]);

  const cleanupWaveSurfer = useCallback(() => {
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }
    if (wavesurferRef.current) {
      wavesurferRef.current.destroy();
      wavesurferRef.current = null;
    }
    if (playTimeoutRef.current) {
      clearTimeout(playTimeoutRef.current);
      playTimeoutRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setReady(false);
    setDuration(0);
    setTimeLeft(0);
  }, []);

  const fadeVolume = useCallback((fromVol, toVol, durationSec, callback) => {
    if (!wavesurferRef.current) return;
    const steps = 15;
    const stepTime = (durationSec * 1000) / steps;
    let currentStep = 0;
    const volumeStep = (toVol - fromVol) / steps;
    let currentVol = fromVol;

    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
    }

    fadeIntervalRef.current = setInterval(() => {
      currentStep++;
      currentVol += volumeStep;
      if (wavesurferRef.current) {
        wavesurferRef.current.setVolume(Math.min(Math.max(currentVol, 0), 1));
      }
      if (currentStep >= steps) {
        clearInterval(fadeIntervalRef.current);
        fadeIntervalRef.current = null;
        if (callback) callback();
      }
    }, stepTime);
  }, []);

  const handleNextSong = useCallback(() => {
    cleanupWaveSurfer();
    if (currentIndex + 1 < songs.length) {
      setCurrentIndex((prevIndex) => prevIndex + 1);
    } else {
      setIsPlaying(false);
      setCurrentIndex(-1);
    }
  }, [cleanupWaveSurfer, currentIndex, songs.length]);

  // Start the fade-in & fade-out sequence and the countdown
  const startPlaybackWithFade = useCallback(() => {
    if (!wavesurferRef.current) return;
    wavesurferRef.current.setVolume(0);

    // Initialize countdown from PLAY_DURATION
    setTimeLeft(PLAY_DURATION);
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }
    // *** Count down every 0.1s instead of 1s
    countdownRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0.1) {
          clearInterval(countdownRef.current);
          countdownRef.current = null;
          return 0;
        }
        return prev - 0.1;
      });
    }, 100);

    // Fade in
    fadeVolume(0, 1, FADE_DURATION, () => {
      // Then wait the remainder of PLAY_DURATION to fade out
      playTimeoutRef.current = setTimeout(() => {
        fadeVolume(1, 0, FADE_DURATION, handleNextSong);
      }, (PLAY_DURATION - FADE_DURATION) * 1000);
    });
  }, [fadeVolume, FADE_DURATION, PLAY_DURATION, handleNextSong]);

  const loadCurrentSong = useCallback(() => {
    cleanupWaveSurfer();
    const currentSong = songs[currentIndex];
    if (!currentSong) {
      setIsPlaying(false);
      setCurrentIndex(-1);
      return;
    }

    console.log("PlayTab - Playing Song:", currentSong);

    const ws = WaveSurfer.create({
      container: document.createElement("div"),
      waveColor: "transparent",
      progressColor: "transparent",
      barWidth: 0,
      height: 0,
      backend: "WebAudio",
    });

    ws.on("ready", () => {
      setReady(true);
      const dur = ws.getDuration();
      setDuration(dur);
      console.log(`PlayTab - Song duration (seconds): ${dur}`);

      // Seek to a random start point (up to 75% in)
      const maxStart = dur * 0.75;
      const randomStart = Math.random() * maxStart;
      ws.seekTo(randomStart / dur);

      ws
        .play()
        .then(() => {
          startPlaybackWithFade();
        })
        .catch((err) => {
          console.error("PlayTab - Error playing audio:", err);
          handleNextSong();
        });
    });

    ws.on("error", (err) => {
      console.error("PlayTab - Wavesurfer error:", err);
      handleNextSong();
    });

    ws.load(currentSong.AudioUrl);
    wavesurferRef.current = ws;
  }, [
    currentIndex,
    songs,
    startPlaybackWithFade,
    handleNextSong,
    cleanupWaveSurfer,
  ]);

  const playSongAtIndex = useCallback((idx) => {
    setCurrentIndex(idx);
    setIsPlaying(true);
  }, []);

  // Load song on change
  useEffect(() => {
    if (isPlaying && currentIndex >= 0 && currentIndex < songs.length) {
      loadCurrentSong();
    }
    return () => {
      cleanupWaveSurfer();
    };
  }, [
    isPlaying,
    currentIndex,
    songs.length,
    loadCurrentSong,
    cleanupWaveSurfer,
  ]);

  // Automatically start if songs are available and none playing
  useEffect(() => {
    if (songs.length > 0 && !isPlaying && currentIndex === -1) {
      setCurrentIndex(0);
      setIsPlaying(true);
    }
  }, [songs, isPlaying, currentIndex]);

  // Auto-scroll to current item
  useEffect(() => {
    if (listRef.current && currentIndex >= 0) {
      const listItem = listRef.current.querySelector(
        `[data-idx="${currentIndex}"]`
      );
      if (listItem) {
        listItem.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }, [currentIndex]);

  const renderMetadata = (song) => {
    const style = song.Style || "";
    const year = song.Year || "";
    const composer = song.Composer || "";
    const alternative = song.Alternative === "Y" ? "Alternative " : "";
    const candombe = song.Candombe === "Y" ? "Candombe " : "";
    const cancion = song.Cancion === "Y" ? "Cancion " : "";
    const singer = song.Singer === "Y" ? "Singer " : "";
    const extras = [alternative, candombe, cancion, singer]
      .join("")
      .trim()
      .replace(/\s+/g, " ");
    const metaParts = [style, year, composer, extras].filter(Boolean);
    return metaParts.length > 0 ? metaParts.join(" | ") : "";
  };

  // Calculate progress for LinearProgress (0 -> 100)
  const progressValue =
    timeLeft > 0 ? (timeLeft / PLAY_DURATION) * 100 : 0;

  return (
    <Box
      className={styles.container}
      sx={{
        minHeight: "100vh",
        background: "var(--background)",
        color: "var(--foreground)",
      }}
    >
      {/* Display time countdown */}
      {isPlaying && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body1" sx={{ mb: 1 }}>
            Time Remaining: {timeLeft.toFixed(1)}s
          </Typography>
          <LinearProgress
            variant="determinate"
            value={progressValue}
            sx={{ height: "8px", borderRadius: "4px" }}
          />
        </Box>
      )}
      <Typography
        variant="h5"
        className={styles.h5}
        sx={{ marginBottom: "1rem" }}
      >
        Now Playing
      </Typography>
      {songs.length === 0 ? (
        <Typography>No songs. Adjust configuration and try again.</Typography>
      ) : (
        <>
          <Box
            ref={listRef}
            className={styles.listContainer}
            sx={{
              maxHeight: "calc(100vh - 200px)",
              overflowY: "auto",
              border: "1px solid var(--border-color)",
              borderRadius: "8px",
              padding: "10px",
            }}
          >
            <List>
              {songs.map((song, idx) => {
                const title =
                  song.Title || song.SongTitle || "Unknown Title";
                const artist =
                  song.ArtistMaster || "Unknown Artist";
                const meta = renderMetadata(song);
                const isCurrent = idx === currentIndex;
                return (
                  <ListItem
                    key={song.SongID || idx}
                    data-idx={idx}
                    onClick={() => playSongAtIndex(idx)}
                    className={isCurrent ? styles.activeSong : styles.songRow}
                    sx={{
                      cursor: "pointer",
                      marginBottom: "0.5rem",
                      border: isCurrent ? "2px solid var(--accent)" : "none",
                      "&:hover": {
                        background: "var(--input-bg)",
                      },
                    }}
                  >
                    <ListItemText
                      primary={title}
                      secondary={
                        <>
                          <Typography
                            component="span"
                            variant="body2"
                            color="var(--foreground)"
                          >
                            {artist}
                          </Typography>
                          {meta && (
                            <Typography
                              component="div"
                              variant="caption"
                              sx={{
                                color: "var(--foreground)",
                                opacity: 0.8,
                              }}
                            >
                              {meta}
                            </Typography>
                          )}
                        </>
                      }
                    />
                  </ListItem>
                );
              })}
            </List>
          </Box>
          <Stack
            direction="row"
            spacing={2}
            sx={{ justifyContent: "center", marginTop: "1rem" }}
          >
            {isPlaying && (
              <Button
                variant="contained"
                className={styles.button}
                onClick={handleNextSong}
                disabled={!ready}
                sx={{
                  background: "var(--accent)",
                  color: "var(--background)",
                  "&:hover": {
                    opacity: 0.8,
                  },
                }}
              >
                Next
              </Button>
            )}
            <Button
              variant="outlined"
              className={`${styles.button} ${styles.outlined}`}
              onClick={onCancel}
              sx={{
                borderColor: "var(--foreground)",
                color: "var(--foreground)",
                "&:hover": {
                  background: "var(--foreground)",
                  color: "var(--background)",
                },
              }}
            >
              Cancel
            </Button>
          </Stack>
        </>
      )}
    </Box>
  );
}

PlayTab.propTypes = {
  songs: PropTypes.arrayOf(
    PropTypes.shape({
      SongID: PropTypes.string,
      Title: PropTypes.string,
      SongTitle: PropTypes.string,
      ArtistMaster: PropTypes.string,
      AudioUrl: PropTypes.string,
      Style: PropTypes.string,
      Year: PropTypes.string,
      Composer: PropTypes.string,
      Alternative: PropTypes.string,
      Candombe: PropTypes.string,
      Cancion: PropTypes.string,
      Singer: PropTypes.string,
    }),
  ).isRequired,
  config: PropTypes.shape({
    numSongs: PropTypes.number,
    timeLimit: PropTypes.number,
    levels: PropTypes.arrayOf(PropTypes.number),
    styles: PropTypes.objectOf(PropTypes.bool),
  }).isRequired,
  onCancel: PropTypes.func.isRequired,
};
