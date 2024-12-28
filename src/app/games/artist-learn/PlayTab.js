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
import { useGameContext } from "@/contexts/GameContext";

export default function PlayTab({ songs, config, onCancel }) {
  const { currentScore, setCurrentScore, completeGame } = useGameContext();

  // Refs for WaveSurfer & timers
  const waveSurferRef = useRef(null);
  const fadeIntervalRef = useRef(null);
  const countdownRef = useRef(null);
  const playTimeoutRef = useRef(null);

  // UI/Playback states
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  // For showing the snippet range & time left
  const [duration, setDuration] = useState(0);
  const [randomStart, setRandomStart] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);

  const [ready, setReady] = useState(false); // When WaveSurfer says "ready"
  const listRef = useRef(null);

  const PLAY_DURATION = config.timeLimit ?? 15;
  const FADE_DURATION = 0.8;

  useEffect(() => {
    console.log("PlayTab - config:", config);
  }, [config]);

  // ============== CREATE WAVESURFER ONE TIME ==============
  useEffect(() => {
    // Create
    waveSurferRef.current = WaveSurfer.create({
      container: document.createElement("div"), // we won't visually show waves
      waveColor: "transparent",
      progressColor: "transparent",
      barWidth: 0,
      height: 0,
      backend: "WebAudio",
    });

    // Listen for "ready" -> do final steps to start playback, fade, etc.
    waveSurferRef.current.on("ready", handleWaveReady);

    // Listen for errors
    waveSurferRef.current.on("error", (err) => {
      console.error("WaveSurfer error:", err);
      handleNextSong(); // skip to next if error
    });

    // Cleanup on unmount
    return () => {
      cleanupAll();
      if (waveSurferRef.current) {
        waveSurferRef.current.destroy();
        waveSurferRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============== MAIN CLEANUP (ALL TIMERS, ETC.) ==============
  const cleanupAll = useCallback(() => {
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
  }, []);

  // ============== FADE VOLUME HELPER ==============
  const fadeVolume = useCallback((fromVol, toVol, durationSec, callback) => {
    if (!waveSurferRef.current) return;
    const steps = 15;
    const stepTime = (durationSec * 1000) / steps;
    let currentStep = 0;
    const volumeStep = (toVol - fromVol) / steps;
    let currentVol = fromVol;

    fadeIntervalRef.current = setInterval(() => {
      currentStep++;
      currentVol += volumeStep;
      if (waveSurferRef.current) {
        waveSurferRef.current.setVolume(Math.max(Math.min(currentVol, 1), 0));
      }
      if (currentStep >= steps) {
        clearInterval(fadeIntervalRef.current);
        fadeIntervalRef.current = null;
        callback?.();
      }
    }, stepTime);
  }, []);

  // ============== WHEN WAVESURFER SAYS "READY" ==============
  //    -> random start, .play(), start fade in/out
  const handleWaveReady = useCallback(() => {
    if (!waveSurferRef.current) return;
    setReady(true);

    const dur = waveSurferRef.current.getDuration();
    setDuration(dur);

    // Random start
    const maxStart = dur * 0.75;
    const startVal = Math.random() * maxStart;
    setRandomStart(startVal);

    waveSurferRef.current.seekTo(startVal / dur);

    // Attempt to play
    waveSurferRef.current
      .play()
      .then(() => {
        startPlaybackWithFade();
      })
      .catch((err) => {
        console.error("Error playing audio:", err);
        handleNextSong();
      });
  }, [startPlaybackWithFade, handleNextSong]);

  // ============== START PLAYBACK WITH FADE ==============
  const startPlaybackWithFade = useCallback(() => {
    if (!waveSurferRef.current) return;

    // set to volume=0, then fade in
    waveSurferRef.current.setVolume(0);

    // Start countdown
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
      // after fade in, wait remainder -> fade out
      playTimeoutRef.current = setTimeout(() => {
        fadeVolume(1, 0, FADE_DURATION, handleNextSong);
      }, (PLAY_DURATION - FADE_DURATION) * 1000);
    });
  }, [fadeVolume, PLAY_DURATION, FADE_DURATION, handleNextSong]);

  // ============== NEXT SONG ==============
  const handleNextSong = useCallback(() => {
    // Stop old track logic (timers, etc.) but keep waveSurferRef for next track
    cleanupAll();

    // Move index forward
    const nextIndex = currentIndex + 1;
    if (nextIndex < songs.length) {
      setCurrentIndex(nextIndex);
    } else {
      // End of playlist
      setIsPlaying(false);
      setCurrentIndex(-1);
      setGameOver(true);

      // Example final scoring
      const finalScore = currentScore + 1;
      setCurrentScore(finalScore);
      completeGame(finalScore);
    }
  }, [
    currentIndex,
    songs,
    cleanupAll,
    completeGame,
    currentScore,
    setCurrentScore,
  ]);

  // ============== LOAD A SONG INTO WAVESURFER ==============
  const loadSong = useCallback(
    (index) => {
      const currentSong = songs[index];
      if (!waveSurferRef.current || !currentSong) {
        // If no more songs or waveSurfer is missing
        setIsPlaying(false);
        setGameOver(true);
        return;
      }
      console.log("Playing Song:", currentSong);
      waveSurferRef.current.load(currentSong.AudioUrl);
    },
    [songs],
  );

  // ============== WATCH currentIndex + isPlaying ==============
  //    -> load new track if valid
  useEffect(() => {
    if (isPlaying && currentIndex >= 0 && currentIndex < songs.length) {
      loadSong(currentIndex);
    }
    // we do NOT destroy waveSurfer here. Just do timer cleanup in handleNextSong
  }, [isPlaying, currentIndex, songs, loadSong]);

  // ============== AUTO-START IF SONGS EXIST ==============
  useEffect(() => {
    if (gameOver) return;
    if (songs.length > 0 && !isPlaying && currentIndex === -1) {
      setCurrentIndex(0);
      setIsPlaying(true);
    }
  }, [songs, isPlaying, currentIndex, gameOver]);

  // ============== SCROLL TO ACTIVE SONG ==============
  useEffect(() => {
    if (listRef.current && currentIndex >= 0) {
      const item = listRef.current.querySelector(`[data-idx="${currentIndex}"]`);
      if (item) {
        item.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }, [currentIndex]);

  // ============== RENDER ==============
  const progressValue = timeLeft > 0 ? (timeLeft / PLAY_DURATION) * 100 : 0;

  // If gameOver -> final message
  if (gameOver) {
    return (
      <Box
        className={styles.container}
        sx={{ minHeight: "100vh", textAlign: "center", p: 2 }}
      >
        <Typography variant="h5" sx={{ mb: 2 }}>
          All done!
        </Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>
          Your score: {currentScore}
        </Typography>
        <Button variant="contained" onClick={onCancel}>
          Close
        </Button>
      </Box>
    );
  }

  return (
    <Box
      className={styles.container}
      sx={{
        minHeight: "100vh",
      }}
    >
      {/* Progress Bar & Time Left */}
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

      {/* Snippet range display */}
      {duration > 0 && (
        <SongSnippet
          duration={duration}
          lower={randomStart}
          upper={Math.min(duration, randomStart + PLAY_DURATION)}
        />
      )}

      {/* If no songs */}
      {songs.length === 0 ? (
        <Typography>No songs. Adjust configuration and try again.</Typography>
      ) : (
        <>
          {/* Song List */}
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

          {/* Controls */}
          <Stack
            direction="row"
            spacing={2}
            sx={{ justifyContent: "center", mt: 2 }}
          >
            {isPlaying && (
              <Button variant="contained" onClick={handleNextSong} disabled={!ready}>
                Next
              </Button>
            )}
            <Button variant="outlined" onClick={onCancel}>
              Cancel
            </Button>
          </Stack>
        </>
      )}
    </Box>
  );
}

PlayTab.propTypes = {
  songs: PropTypes.array.isRequired,
  config: PropTypes.object.isRequired,
  onCancel: PropTypes.func.isRequired,
};
