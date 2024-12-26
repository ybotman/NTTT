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
import SongSnippet from "@/components/ui/SongSnippet";

export default function PlayTab({ songs, config, onCancel }) {
  const wavesurferRef = useRef(null);
  const playTimeoutRef = useRef(null);
  const fadeIntervalRef = useRef(null);
  const listRef = useRef(null);
  const countdownRef = useRef(null);

  const [duration, setDuration] = useState(0);
  const [randomStart, setRandomStart] = useState(0); // 1) store randomStart in state
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  const PLAY_DURATION = config.timeLimit ?? 15;
  const FADE_DURATION = 0.8;

  // useEffect((() => {
  //   console.log("PlayTab - Config:", config);
  // },[]));

  // // We might not need anything special in this effect for config, but included for completeness
  useEffect(() => {
    console.log("PlayTab - Config:", config);
  }, []);

  // ---- Cleanup wavesurfer
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
    setRandomStart(0); // reset snippet start
  }, []);

  // ---- Fade volume
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

  // ---- Next Song
  const handleNextSong = useCallback(() => {
    cleanupWaveSurfer();
    if (currentIndex + 1 < songs.length) {
      setCurrentIndex((prevIndex) => prevIndex + 1);
    } else {
      setIsPlaying(false);
      setCurrentIndex(-1);
    }
  }, [cleanupWaveSurfer, currentIndex, songs.length]);

  // ---- Start playback with fade in/out
  const startPlaybackWithFade = useCallback(() => {
    if (!wavesurferRef.current) return;
    wavesurferRef.current.setVolume(0);

    // Initialize countdown from PLAY_DURATION
    setTimeLeft(PLAY_DURATION);
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }
    // Count down in 0.1s steps
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
      // Then wait the remainder to fade out
      playTimeoutRef.current = setTimeout(
        () => {
          fadeVolume(1, 0, FADE_DURATION, handleNextSong);
        },
        (PLAY_DURATION - FADE_DURATION) * 1000,
      );
    });
  }, [fadeVolume, FADE_DURATION, PLAY_DURATION, handleNextSong]);

  // ---- Load current song
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

    // On wavesurfer ready
    ws.on("ready", () => {
      setReady(true);
      const dur = ws.getDuration();
      setDuration(dur);
      console.log(`PlayTab - Song duration (seconds): ${dur}`);

      // 2) Compute randomStart outside so we can store it in state
      const maxStart = dur * 0.75;
      const startVal = Math.random() * maxStart;
      setRandomStart(startVal);

      // Seek wave
      ws.seekTo(startVal / dur);

      // Start playback
      ws.play()
        .then(() => {
          startPlaybackWithFade();
        })
        .catch((err) => {
          console.error("PlayTab - Error playing audio:", err);
          handleNextSong();
        });
    });

    // On wavesurfer error
    ws.on("error", (err) => {
      console.error("PlayTab - Wavesurfer error:", err);
      handleNextSong();
    });

    // Load
    ws.load(currentSong.AudioUrl);
    wavesurferRef.current = ws;
  }, [
    currentIndex,
    songs,
    startPlaybackWithFade,
    handleNextSong,
    cleanupWaveSurfer,
  ]);

  // ---- Jump to a song by index
  const playSongAtIndex = useCallback((idx) => {
    setCurrentIndex(idx);
    setIsPlaying(true);
  }, []);

  // ---- if playing & currentIndex changes, load the new song
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

  // Automatically start if songs exist and no one is playing
  useEffect(() => {
    if (songs.length > 0 && !isPlaying && currentIndex === -1) {
      setCurrentIndex(0);
      setIsPlaying(true);
    }
  }, [songs, isPlaying, currentIndex]);

  // Auto-scroll to the currently playing item
  useEffect(() => {
    if (listRef.current && currentIndex >= 0) {
      const listItem = listRef.current.querySelector(
        `[data-idx="${currentIndex}"]`,
      );
      if (listItem) {
        listItem.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }, [currentIndex]);

  // Render metadata for each song
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

  // Time-left countdown as progress
  const progressValue = timeLeft > 0 ? (timeLeft / PLAY_DURATION) * 100 : 0;

  return (
    <Box
      className={styles.container}
      sx={{
        minHeight: "100vh",
        background: "var(--background)",
        color: "var(--foreground)",
      }}
    >
      {/* If playing, show countdown and linear progress */}
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
      {/* 3) Snippet bar if we have a duration */}
      {duration > 0 && (
        <SongSnippet
          //         label="Snippet Range"
          duration={duration}
          lower={randomStart}
          upper={Math.min(duration, randomStart + PLAY_DURATION)}
        />
      )}

      {/* If no songs, say so */}
      {songs.length === 0 ? (
        <Typography>No songs. Adjust configuration and try again.</Typography>
      ) : (
        <>
          {/* Song list container */}
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
                const title = song.Title || song.SongTitle || "Unknown Title";
                const artist = song.ArtistMaster || "Unknown Artist";
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
                              component="span"
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
            {/* Next button if playing */}
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
            {/* Cancel button always */}
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
