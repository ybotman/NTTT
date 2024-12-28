//--------------------------------------------------------------
// src/app/games/artist-learn/PlayTab.js
//--------------------------------------------------------------
"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import PropTypes from "prop-types";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Button,
  LinearProgress,
  Snackbar,
  Alert,
  FormControlLabel,
  Switch,
} from "@mui/material";
import WaveSurfer from "wavesurfer.js";
import styles from "../styles.module.css";
import SongSnippet from "@/components/ui/SongSnippet";
import { useGameContext } from "@/contexts/GameContext";

// iOS check
function isIOS() {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

export default function PlayTab({ songs, config, onCancel }) {
  const { currentScore, setCurrentScore, completeGame } = useGameContext();

  // Refs & States
  const wavesurferRef = useRef(null);
  const playTimeoutRef = useRef(null);
  const fadeIntervalRef = useRef(null);
  const countdownRef = useRef(null);
  const listRef = useRef(null);

  const [duration, setDuration] = useState(0);
  const [randomStart, setRandomStart] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [ready, setReady] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const onIOS = isIOS();
  const [autoNext, setAutoNext] = useState(!onIOS);
  const [iosBugOpen, setIosBugOpen] = useState(onIOS);

  const PLAY_DURATION = config.timeLimit ?? 15;
  const FADE_DURATION = 0.8;

  useEffect(() => {
    console.log("PlayTab - config:", config);
  }, [config]);

  // Cleanup waveSurfer
  const cleanupWaveSurfer = useCallback(() => {
    if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
    if (wavesurferRef.current) wavesurferRef.current.destroy();
    if (playTimeoutRef.current) clearTimeout(playTimeoutRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    fadeIntervalRef.current = null;
    wavesurferRef.current = null;
    playTimeoutRef.current = null;
    countdownRef.current = null;

    setReady(false);
    setDuration(0);
    setTimeLeft(0);
    setRandomStart(0);
  }, []);

  // Fade volume
  const fadeVolume = useCallback((fromVol, toVol, durationSec, callback) => {
    if (!wavesurferRef.current) return;
    const steps = 15;
    const stepTime = (durationSec * 1000) / steps;
    let currentStep = 0;
    const volumeStep = (toVol - fromVol) / steps;
    let currentVol = fromVol;

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

  // Next song
  const handleNextSong = useCallback(() => {
    cleanupWaveSurfer();
    if (currentIndex + 1 < songs.length) {
      setCurrentIndex((prev) => prev + 1);
      // small gap
      setTimeout(() => {}, 500);
    } else {
      setIsPlaying(false);
      setCurrentIndex(-1);
      setGameOver(true);

      // example scoring
      const finalScore = currentScore + 1;
      setCurrentScore(finalScore);
      completeGame(finalScore);
    }
  }, [
    cleanupWaveSurfer,
    currentIndex,
    songs,
    currentScore,
    setCurrentScore,
    completeGame,
  ]);

  // Start playback fade
  const startPlaybackWithFade = useCallback(() => {
    if (!wavesurferRef.current) return;
    wavesurferRef.current.setVolume(0);

    setTimeLeft(PLAY_DURATION);
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

    // fade in
    fadeVolume(0, 1, FADE_DURATION, () => {
      // wait remainder, fade out
      playTimeoutRef.current = setTimeout(() => {
        fadeVolume(1, 0, FADE_DURATION, () => {
          if (autoNext) {
            handleNextSong();
          }
        });
      }, (PLAY_DURATION - FADE_DURATION) * 1000);
    });
  }, [fadeVolume, PLAY_DURATION, FADE_DURATION, handleNextSong, autoNext]);

  // Load current song
  const loadCurrentSong = useCallback(() => {
    cleanupWaveSurfer();
    const currentSong = songs[currentIndex];
    if (!currentSong) {
      setIsPlaying(false);
      setCurrentIndex(-1);
      return;
    }
    console.log("Playing Song:", currentSong);

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

      const maxStart = dur * 0.75;
      const startVal = Math.random() * maxStart;
      setRandomStart(startVal);

      ws.seekTo(startVal / dur);

      ws.play()
        .then(() => {
          startPlaybackWithFade();
        })
        .catch((err) => {
          console.error("Error playing audio:", err);
          handleNextSong();
        });
    });

    ws.on("error", (err) => {
      console.error("Wavesurfer error:", err);
      handleNextSong();
    });

    ws.load(currentSong.AudioUrl);
    wavesurferRef.current = ws;
  }, [
    songs,
    currentIndex,
    cleanupWaveSurfer,
    startPlaybackWithFade,
    handleNextSong,
  ]);

  // If playing & currentIndex changes, load
  useEffect(() => {
    if (isPlaying && currentIndex >= 0 && currentIndex < songs.length) {
      loadCurrentSong();
    }
    return cleanupWaveSurfer;
  }, [isPlaying, currentIndex, songs, loadCurrentSong, cleanupWaveSurfer]);

  // Auto-start if songs exist
  useEffect(() => {
    if (gameOver) return;
    if (songs.length > 0 && !isPlaying && currentIndex === -1) {
      setCurrentIndex(0);
      setIsPlaying(true);
    }
  }, [songs, isPlaying, currentIndex, gameOver]);

  // Scroll to active
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

  // For snippet
  const progressValue = timeLeft > 0 ? (timeLeft / PLAY_DURATION) * 100 : 0;

  // If gameOver
  if (gameOver) {
    return (
      <Box
        className={styles.container}
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          background: "var(--background)",
          color: "var(--foreground)",
        }}
      >
        <Box
          sx={{
            flex: "0 0 auto",
            textAlign: "center",
            p: 2,
          }}
        >
          <Typography variant="h5" sx={{ mb: 2 }}>
            All done!
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Your score: {currentScore}
          </Typography>
          <Button
            variant="contained"
            onClick={onCancel}
            sx={{
              background: "var(--accent)",
              color: "var(--background)",
              "&:hover": { opacity: 0.8 },
            }}
          >
            Close
          </Button>
        </Box>
      </Box>
    );
  }

  // Minimal function to render each song's metadata
  const renderMetadata = (song) => {
    const artist = song.ArtistMaster || "";
    const style = song.Style || "";
    const year = song.Year || "";
    const composer = song.Composer || "";
    return [artist, style, year, composer].filter(Boolean).join(" | ");
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100vh", // full height
        background: "var(--background)",
        color: "var(--foreground)",
      }}
    >
      {/* Top portion with Switch/Next/Cancel, plus progress & snippet */}
      <Box sx={{ flex: "0 0 auto", p: 2 }}>
        {/* iOS bug message */}
        <Snackbar
          open={iosBugOpen && onIOS}
          autoHideDuration={6000}
          onClose={() => setIosBugOpen(false)}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert
            onClose={() => setIosBugOpen(false)}
            severity="info"
            sx={{ width: "100%" }}
          >
            Bug: This iPhone cannot auto-play. Please tap the songs to play!
          </Alert>
        </Snackbar>

        {/* Switch/Next/Cancel row */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            mb: 2,
          }}
        >
          <FormControlLabel
            control={
              <Switch
                checked={autoNext}
                onChange={(e) => setAutoNext(e.target.checked)}
                disabled={onIOS} 
              />
            }
            label="Auto-Next"
          />

          {isPlaying && (
            <Button
              variant="contained"
              onClick={handleNextSong}
              disabled={!ready}
              sx={{
                background: "var(--accent)",
                color: "var(--background)",
                "&:hover": { opacity: 0.8 },
              }}
            >
              Next
            </Button>
          )}

          <Button
            variant="outlined"
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
        </Box>

        {/* If playing => show time & progress */}
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

        {/* Snippet if duration > 0 */}
        {duration > 0 && (
          <SongSnippet
            duration={duration}
            lower={randomStart}
            upper={Math.min(duration, randomStart + PLAY_DURATION)}
          />
        )}
      </Box>

      {/* Bottom portion: scrollable list */}
      <Box
        sx={{
          flex: "1 1 auto", // fill remaining space
          overflowY: "auto",
          p: 2,
        }}
      >
        {songs.length === 0 ? (
          <Typography>No songs. Adjust configuration and try again.</Typography>
        ) : (
          <Box
            ref={listRef}
            sx={{
              border: "1px solid var(--border-color)",
              borderRadius: "8px",
              p: 2,
            }}
          >
            <List>
              {songs.map((song, idx) => {
                const title = song.Title || "Unknown Title";
                const isCurrent = idx === currentIndex;
                return (
                  <ListItem
                    key={song.SongID}
                    data-idx={idx}
                    onClick={() => {
                      setCurrentIndex(idx);
                      setIsPlaying(true);
                    }}
                    sx={{
                      cursor: "pointer",
                      mb: 1,
                      border: isCurrent ? "2px solid var(--accent)" : "none",
                      "&:hover": { background: "var(--input-bg)" },
                    }}
                  >
                    <ListItemText
                      primary={title}
                      secondary={renderMetadata(song)}
                    />
                  </ListItem>
                );
              })}
            </List>
          </Box>
        )}
      </Box>
    </Box>
  );
}

PlayTab.propTypes = {
  songs: PropTypes.array.isRequired,
  config: PropTypes.object.isRequired,
  onCancel: PropTypes.func.isRequired,
};
