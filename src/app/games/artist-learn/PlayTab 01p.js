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
import styles from "../styles.module.css";
import SongSnippet from "@/components/ui/SongSnippet";
import { useGameContext } from "@/contexts/GameContext";

// Our new custom hooks
import useArtistLearn from "@/hooks/useArtistLearn"; // For autoNext, currentIndex, etc.
import useWaveSurfer from "@/hooks/useWaveSurfer"; // For wave logic

/**
 * iOS detection (unchanged)
 */
function isIOS() {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

export default function PlayTab({ songs, config, onCancel }) {
  // GameContext for scoring
  const { currentScore, setCurrentScore, completeGame } = useGameContext();

  // Pull relevant state & methods from useArtistLearn
  const {
    currentIndex,
    setCurrentIndex,
    autoNext,
    toggleAutoNext,
    gameOver,
    getCurrentSong,
    handleNextSong,
  } = useArtistLearn();

  // We keep these local states the same:
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [duration, setDuration] = useState(0);
  const [randomStart, setRandomStart] = useState(0);
  const [ready, setReady] = useState(false);

  // Because we’re not renaming them, we keep these refs:
  const wavesurferRef = useRef(null); // We’ll tie this to waveSurferRef from the hook
  const fadeIntervalRef = useRef(null);
  const playTimeoutRef = useRef(null);
  const countdownRef = useRef(null);
  const listRef = useRef(null);

  // iOS detection, same as before
  const onIOS = isIOS();
  const [iosBugOpen, setIosBugOpen] = useState(onIOS);

  // from config
  const PLAY_DURATION = config.timeLimit ?? 15;
  const FADE_DURATION = 0.8;

  // ---- useWaveSurfer hook usage ----
  const {
    waveSurferRef,
    initWaveSurfer,
    cleanupWaveSurfer,
    loadSong,
    fadeVolume,
  } = useWaveSurfer({
    // When the song ends or an error occurs, do same logic as handleNextSong
    onSongEnd: () => {
      if (autoNext) {
        handleNextSongLocal(); // local wrapper
      }
    },
  });

  // Local wrapper: Because your code calls “handleNextSong” in multiple places,
  // we pass the wave cleanup and final score logic here if needed.
  const handleNextSongLocal = useCallback(() => {
    cleanupLocalWaveSurfer();
    // Then call your original “handleNextSong” from the hook
    handleNextSong();

    // If that indicates we’re out of songs (like in your original code),
    // we can also do your final scoring if needed.
  }, [handleNextSong]);

  // Keep your existing effect logging config
  useEffect(() => {
    console.log("PlayTab - config:", config);
  }, [config]);

  // The old local waveSurfer cleanup is replaced by hooking into the waveSurfer hook:
  const cleanupLocalWaveSurfer = useCallback(() => {
    // clear local intervals
    if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
    if (playTimeoutRef.current) clearTimeout(playTimeoutRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    fadeIntervalRef.current = null;
    playTimeoutRef.current = null;
    countdownRef.current = null;
    setReady(false);
    setDuration(0);
    setTimeLeft(0);
    setRandomStart(0);

    // Actually destroy waveSurfer
    cleanupWaveSurfer();
  }, [cleanupWaveSurfer]);

  // Equivalent to startPlaybackWithFade (just uses fadeVolume from the hook)
  const startPlaybackWithFade = useCallback(() => {
    if (!waveSurferRef.current) return;

    // wavesurfer volume=0
    waveSurferRef.current.setVolume(0);

    // countdown
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
      // after fade in, wait remainder, fade out
      playTimeoutRef.current = setTimeout(
        () => {
          fadeVolume(1, 0, FADE_DURATION, () => {
            if (autoNext) {
              handleNextSongLocal();
            }
          });
        },
        (PLAY_DURATION - FADE_DURATION) * 1000,
      );
    });
  }, [
    waveSurferRef,
    fadeVolume,
    PLAY_DURATION,
    FADE_DURATION,
    autoNext,
    handleNextSongLocal,
  ]);

  // Load song, but with the waveSurfer hook
  const loadCurrentSong = useCallback(() => {
    cleanupLocalWaveSurfer();

    const currentSong = songs[currentIndex];
    if (!currentSong) {
      setIsPlaying(false);
      setCurrentIndex(-1);
      return;
    }
    console.log("Playing Song:", currentSong);

    // init wave if not already
    initWaveSurfer();

    // Use the hook’s “loadSong”
    loadSong(currentSong.AudioUrl, () => {
      // On “ready” callback from waveSurfer
      setReady(true);
      const dur = waveSurferRef.current?.getDuration() || 0;
      setDuration(dur);

      const maxStart = dur * 0.75;
      const startVal = Math.random() * maxStart;
      setRandomStart(startVal);

      waveSurferRef.current?.seekTo(startVal / dur);

      waveSurferRef.current
        ?.play()
        .then(() => {
          startPlaybackWithFade();
        })
        .catch((err) => {
          console.error("Error playing audio:", err);
          handleNextSongLocal();
        });
    });
  }, [
    songs,
    currentIndex,
    initWaveSurfer,
    loadSong,
    waveSurferRef,
    cleanupLocalWaveSurfer,
    startPlaybackWithFade,
    handleNextSongLocal,
    setIsPlaying,
    setCurrentIndex,
  ]);

  // === The rest of your original logic remains, but we replaced waveSurfer calls. ===

  // If playing & currentIndex changes, load
  useEffect(() => {
    if (isPlaying && currentIndex >= 0 && currentIndex < songs.length) {
      loadCurrentSong();
    }
    return cleanupLocalWaveSurfer;
  }, [isPlaying, currentIndex, songs, loadCurrentSong, cleanupLocalWaveSurfer]);

  // Auto-start if songs exist
  useEffect(() => {
    // if gameOver => do nothing
    if (gameOver) return;
    if (songs.length > 0 && !isPlaying && currentIndex === -1) {
      setCurrentIndex(0);
      setIsPlaying(true);
    }
  }, [songs, isPlaying, currentIndex, gameOver]);

  // Scroll to active song
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

  // Basic scoring check => if your “gameOver” from useArtistLearn is different from local
  // keep your old approach or unify them as you see fit.
  if (gameOver) {
    return (
      <Box
        className={styles.container}
        sx={{
          minHeight: "100vh",
          background: "var(--background)",
          color: "var(--foreground)",
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
    );
  }

  // For rendering the progress bar
  const progressValue = timeLeft > 0 ? (timeLeft / PLAY_DURATION) * 100 : 0;

  return (
    <Box sx={{ display: "flex", gap: 2, p: 2 }}>
      {/* Left Column */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          width: "200px",
        }}
      >
        <FormControlLabel
          control={
            <Switch
              checked={autoNext}
              onChange={(e) => {
                toggleAutoNext();
              }}
              disabled={onIOS} // iOS -> disable
            />
          }
          label="Auto-Next"
        />

        {isPlaying && (
          <Button
            variant="contained"
            onClick={() => {
              cleanupLocalWaveSurfer();
              handleNextSongLocal();
            }}
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

      {/* Right Column */}
      <Box
        className={styles.container}
        sx={{
          minHeight: "100vh",
          background: "var(--background)",
          color: "var(--foreground)",
          flexGrow: 1,
        }}
      >
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

        {duration > 0 && (
          <SongSnippet
            duration={duration}
            lower={randomStart}
            upper={Math.min(duration, randomStart + PLAY_DURATION)}
          />
        )}

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
                        secondary={[
                          song.Style || "",
                          song.Year || "",
                          song.Composer || "",
                        ]
                          .filter(Boolean)
                          .join(" | ")}
                      />
                    </ListItem>
                  );
                })}
              </List>
            </Box>
          </>
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
