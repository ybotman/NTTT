//-----------------------------------------------------------------------------
// src/app/games/artist-quiz/PlayTab.js
//-----------------------------------------------------------------------------
"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import PropTypes from "prop-types";
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  Snackbar,
  Alert,
  LinearProgress,
} from "@mui/material";
import styles from "./styles.module.css";
import { shuffleArray, getDistractors } from "@/utils/dataFetching";
import useArtistQuiz from "@/hooks/useArtistQuiz"; 
import useWaveSurfer from "@/hooks/useWaveSurfer";

export default function PlayTab({ songs, config, onCancel }) {
  // 1) Grab quiz scoring logic from hook
  const {
    calculateMaxScore,
    calculateDecrementPerInterval,
    WRONG_PENALTY,
    INTERVAL_MS,
    decrementIntervalRef,
    timeIntervalRef,
    clearIntervals,
  } = useArtistQuiz("artistQuiz");

  // 2) WaveSurfer Hook (handles init, fade, destroy, etc.)
  const {
    waveSurferRef,
    initWaveSurfer,
    cleanupWaveSurfer,
    loadSong,
    fadeVolume,
  } = useWaveSurfer({
    onSongEnd: null, // we can use fade logic instead of "finish" if desired
  });

  // 3) Local state for gameplay
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [roundOver, setRoundOver] = useState(false);
  const [roundScore, setRoundScore] = useState(0);
  const [sessionScore, setSessionScore] = useState(0);

  const [answers, setAnswers] = useState([]); // 1 correct + 3 distractors
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [wrongAnswers, setWrongAnswers] = useState([]); 
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // Config from the quiz
  const timeLimit = config.timeLimit ?? 15;
  const numSongs = config.numSongs ?? 10;

  // Derived scoring
  const maxScore = calculateMaxScore(timeLimit);
  const decrementPerInterval = calculateDecrementPerInterval(maxScore, timeLimit);

  // For round logic
  const [showFinalSummary, setShowFinalSummary] = useState(false);

  // 4) Additional Refs for fade or local timers
  const fadeIntervalRef = useRef(null);

  // -----------------------------------------------------
  //   Cleanup all intervals & WaveSurfer on unmount
  // -----------------------------------------------------
  const stopAllAudioAndTimers = useCallback(() => {
    // waveSurfer
    cleanupWaveSurfer();
    // scoring intervals (time/score) from useArtistQuiz
    clearIntervals();
  }, [cleanupWaveSurfer, clearIntervals]);

  // -----------------------------------------------------
  //   “initRound” => Setup local round state
  // -----------------------------------------------------
  const initRound = useCallback(() => {
    if (currentIndex >= songs.length) return;

    // pick the next song, reset states
    setCurrentSong(songs[currentIndex]);
    setSelectedAnswer(null);
    setWrongAnswers([]);
    setRoundOver(false);
    setRoundScore(maxScore);
    setTimeElapsed(0);
    setIsPlaying(false);
  }, [currentIndex, songs, maxScore]);

  // -----------------------------------------------------
  //   End-of-Round if time expires
  // -----------------------------------------------------
  const handleTimeUp = useCallback(() => {
    // stop audio, finalize round
    stopAllAudioAndTimers();
    setRoundOver(true);
    setSessionScore((prev) => prev + Math.max(roundScore, 0));
    setSnackbarMessage(
      `Time's up! Correct answer: ${currentSong?.ArtistMaster || "Unknown"}.`
    );
    setOpenSnackbar(true);
  }, [roundScore, currentSong, stopAllAudioAndTimers]);

  // -----------------------------------------------------
  //   Start intervals for scoring/time
  // -----------------------------------------------------
  const startIntervals = useCallback(() => {
    // score decrement
    decrementIntervalRef.current = setInterval(() => {
      setRoundScore((prev) => Math.max(prev - decrementPerInterval, 0));
    }, INTERVAL_MS);

    // time
    timeIntervalRef.current = setInterval(() => {
      setTimeElapsed((prev) => {
        const nextVal = prev + 0.1;
        if (nextVal >= timeLimit) {
          handleTimeUp();
        }
        return nextVal;
      });
    }, INTERVAL_MS);
  }, [decrementIntervalRef, timeIntervalRef, decrementPerInterval, timeLimit, handleTimeUp]);

  // -----------------------------------------------------
  //   handleAnswerSelect => user picks an artist
  // -----------------------------------------------------
  const handleAnswerSelect = (ans) => {
    if (roundOver || !currentSong) return; 
    if (selectedAnswer === ans) return; 

    setSelectedAnswer(ans);

    const correctArtist = (currentSong.ArtistMaster || "").trim().toLowerCase();
    const guess = ans.trim().toLowerCase();

    if (guess === correctArtist) {
      // correct => end round
      stopAllAudioAndTimers();
      setRoundOver(true);
      setSessionScore((prev) => prev + Math.max(roundScore, 0));
      setSnackbarMessage(`Correct! Artist: ${currentSong.ArtistMaster}`);
      setOpenSnackbar(true);
    } else {
      // wrong => 5% penalty
      setWrongAnswers((prev) => [...prev, ans]);
      setRoundScore((prev) => {
        const nextScore = Math.max(prev - prev * WRONG_PENALTY, 0);
        if (nextScore <= 0) {
          stopAllAudioAndTimers();
          setRoundOver(true);
          setSnackbarMessage(
            `Score is 0! Correct answer: ${currentSong.ArtistMaster}`
          );
          setOpenSnackbar(true);
        }
        return nextScore;
      });
    }
  };

  // -----------------------------------------------------
  //   Next Song or Show final summary
  // -----------------------------------------------------
  const handleNextSong = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= numSongs || nextIndex >= songs.length) {
      // no more
      setShowFinalSummary(true);
      return;
    }
    setOpenSnackbar(false);
    setCurrentIndex(nextIndex);
  };

  // -----------------------------------------------------
  //   For the final summary message
  // -----------------------------------------------------
  const getPerformanceMessage = () => {
    const pct = (roundScore / maxScore) * 100;
    if (pct >= 80) return "Excellent job!";
    if (pct >= 50) return "Great work!";
    if (pct >= 20) return "Not bad!";
    if (pct > 1)  return "Just Barely.";
    return "You'll get the next one!";
  };

  // -----------------------------------------------------
  //   If final summary, just show total
  // -----------------------------------------------------
  if (showFinalSummary) {
    return (
      <Box
        className={styles.container}
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          p: 2,
        }}
      >
        <Typography variant="h4" gutterBottom>
          Session Complete!
        </Typography>
        <Typography variant="h6" gutterBottom>
          Total Score: {Math.floor(sessionScore)}
        </Typography>
        <Button
          variant="contained"
          onClick={onCancel}
          sx={{
            backgroundColor: "var(--accent)",
            color: "var(--background)",
            "&:hover": { opacity: 0.8 },
            mt: 3,
          }}
        >
          Close
        </Button>
      </Box>
    );
  }

  // -----------------------------------------------------
  //   WaveSurfer Lifecycle
  // -----------------------------------------------------
  useEffect(() => {
    if (!currentSong) return;
    
    // 1) init waveSurfer once
    initWaveSurfer();

    // 2) load
    loadSong(currentSong.AudioUrl, () => {
      const ws = waveSurferRef.current;
      if (!ws) return;

      // random snippet start
      const dur = ws.getDuration();
      const randomStart = Math.floor(Math.random() * 90);
      const safeStart = Math.min(randomStart, dur - 1);
      ws.seekTo(safeStart / dur);

      // play => fade in => start intervals
      ws.play()
        .then(() => {
          fadeVolume(0, 1, 1.0, () => {
            setIsPlaying(true);
            startIntervals();
          });
        })
        .catch((err) => {
          console.error("Error playing audio:", err);
          handleNextSong();
        });
    });
    // cleanup on unmount or nextSong
    return stopAllAudioAndTimers;
  }, [currentSong, initWaveSurfer, loadSong, waveSurferRef, fadeVolume, startIntervals, handleNextSong, stopAllAudioAndTimers]);

  // -----------------------------------------------------
  //   Build answers => 1 correct + 3 distractors
  // -----------------------------------------------------
  useEffect(() => {
    if (!currentSong) return;
    const allArtists = songs
      .map((s) => s.ArtistMaster)
      .filter((a) => a && a.trim() !== "");
    const uniqueArtists = Array.from(new Set(allArtists));
    const correctArtist = currentSong.ArtistMaster || "";
    const distractors = getDistractors(correctArtist, uniqueArtists); 
    const finalAnswers = shuffleArray([correctArtist, ...distractors]); 
    setAnswers(finalAnswers);
  }, [currentSong, songs]);

  // -----------------------------------------------------
  //   Round init => on currentIndex change
  // -----------------------------------------------------
  useEffect(() => {
    initRound();
    // also clear intervals from prior round
    return clearIntervals;
  }, [currentIndex, initRound, clearIntervals]);

  // -----------------------------------------------------
  //   UI & Render
  // -----------------------------------------------------
  const timePercent = (timeElapsed / timeLimit) * 100;

  return (
    <Box
      className={styles.container}
      sx={{
        minHeight: "100vh",
        background: "var(--background)",
        color: "var(--foreground)",
        p: 2,
      }}
    >
      {/* Title */}
      <Typography
        variant="h5"
        sx={{ marginBottom: 2, textAlign: "center", fontWeight: "bold" }}
      >
        Identify the Artist
      </Typography>

      {/* If no songs => no data */}
      {!currentSong || songs.length === 0 ? (
        <Typography>No songs. Adjust config and retry.</Typography>
      ) : (
        <>
          {/* Time & Score */}
          <Typography variant="h6" sx={{ mb: 2, textAlign: "center" }}>
            Time: {timeElapsed.toFixed(1)}/{timeLimit} | 
            Score: {Math.floor(roundScore)}/{Math.floor(maxScore)}
          </Typography>

          {/* Progress bar */}
          {isPlaying && (
            <Box sx={{ mx: "auto", mb: 2, maxWidth: 400 }}>
              <LinearProgress
                variant="determinate"
                value={timePercent}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          )}

          {/* Answers => 4 total (1 correct + 3 distractors) */}
          <Typography variant="body1" sx={{ mb: 2, textAlign: "center" }}>
            Select the correct Artist:
          </Typography>
          <List sx={{ mb: 2, maxWidth: 400, margin: "auto" }}>
            {answers.map((ans) => {
              const isWrong = wrongAnswers.includes(ans);
              const isChosenCorrect =
                roundOver &&
                selectedAnswer === ans &&
                ans.trim().toLowerCase() ===
                  (currentSong.ArtistMaster || "").trim().toLowerCase();

              // styling
              let borderColor = "var(--border-color)";
              if (roundOver && isChosenCorrect) borderColor = "green";
              else if (isWrong) borderColor = "red";

              return (
                <ListItem
                  key={ans}
                  onClick={() => handleAnswerSelect(ans)}
                  disabled={roundOver || isWrong || isChosenCorrect}
                  sx={{
                    mb: 1,
                    border: `2px solid ${borderColor}`,
                    borderRadius: "4px",
                    cursor: "pointer",
                    "&:hover": { background: "var(--input-bg)" },
                  }}
                >
                  <ListItemText
                    primary={
                      <Typography sx={{ color: "var(--foreground)" }}>
                        {ans}
                      </Typography>
                    }
                  />
                </ListItem>
              );
            })}
          </List>

          {/* If roundOver => show next / feedback */}
          {roundOver && (
            <Box sx={{ mt: 3, textAlign: "center" }}>
              {roundScore > 0 ? (
                <Typography variant="h6" gutterBottom>
                  {getPerformanceMessage()} (Round Score: {Math.floor(roundScore)})
                </Typography>
              ) : (
                <Typography variant="h6" gutterBottom>
                  No Score. Correct: {currentSong.ArtistMaster}
                </Typography>
              )}
              <Typography variant="body1" gutterBottom>
                Session Total: {Math.floor(sessionScore)}
              </Typography>

              <Button
                variant="contained"
                color="secondary"
                onClick={handleNextSong}
                sx={{ mr: 2 }}
              >
                Next
              </Button>
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
          )}
        </>
      )}

      {/* Snackbar for messages */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={3000}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity="info"
          onClose={() => setOpenSnackbar(false)}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}

PlayTab.propTypes = {
  songs: PropTypes.arrayOf(
    PropTypes.shape({
      SongID: PropTypes.string,
      Title: PropTypes.string,
      ArtistMaster: PropTypes.string.isRequired,
      AudioUrl: PropTypes.string.isRequired,
      Style: PropTypes.string,
      Year: PropTypes.string,
      Composer: PropTypes.string,
      level: PropTypes.number,
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