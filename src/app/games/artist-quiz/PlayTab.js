// ---------------------------------------------------------------------------
// src/app/games/artist-quiz/PlayTab.js
// ---------------------------------------------------------------------------
"use client";

import React, {
  useEffect,
  useRef,
  useState,
  useCallback
} from "react";
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

import { useGameContext } from "@/contexts/GameContext";
import useArtistQuiz from "@/hooks/useArtistQuiz";
import useWaveSurfer from "@/hooks/useWaveSurfer";

export default function PlayTab({ songs, config, onCancel }) {
  // 1) from context => Grab the filtered artists
  const { filteredArtists } = useGameContext();

  // 2) from artistQuiz => scoring/time
  const {
    calculateMaxScore,
    calculateDecrementPerInterval,
    WRONG_PENALTY,
    INTERVAL_MS,
    decrementIntervalRef,
    timeIntervalRef,
    clearIntervals,
  } = useArtistQuiz("artistQuiz");

  // 3) from waveSurfer => audio
  const {
    waveSurferRef,
    initWaveSurfer,
    cleanupWaveSurfer,
    loadSong,
    fadeVolume,
  } = useWaveSurfer({ onSongEnd: null });

  // 4) Local states
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [roundOver, setRoundOver] = useState(false);
  const [roundScore, setRoundScore] = useState(0);
  const [sessionScore, setSessionScore] = useState(0);

  const [answers, setAnswers] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [wrongAnswers, setWrongAnswers] = useState([]);

  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // 5) from config
  const timeLimit = config.timeLimit ?? 15;
  const numSongs = config.numSongs ?? 10;

  // scoring
  const maxScore = calculateMaxScore(timeLimit);
  const decrementPerInterval = calculateDecrementPerInterval(maxScore, timeLimit);

  // final summary state
  const [showFinalSummary, setShowFinalSummary] = useState(false);
  const fadeIntervalRef = useRef(null);

  // track last loaded URL
  const lastSongRef = useRef(null);

  // ---------------------------
  //  STOP all audio/timers
  // ---------------------------
  const stopAllAudioAndTimers = useCallback(() => {
    cleanupWaveSurfer();
    clearIntervals();
  }, [cleanupWaveSurfer, clearIntervals]);

  // ---------------------------
  //  initRound => set up local states
  // ---------------------------
  const initRound = useCallback(() => {
    if (currentIndex >= songs.length) return;
    console.log("initRound => picking song index:", currentIndex);

    const song = songs[currentIndex] || null;
    setCurrentSong(song);
    setSelectedAnswer(null);
    setWrongAnswers([]);
    setRoundOver(false);
    setRoundScore(maxScore);
    setTimeElapsed(0);
    setIsPlaying(false);
  }, [currentIndex, songs, maxScore]);

  // ---------------------------
  //  handleTimeUp => out of time
  // ---------------------------
  const handleTimeUp = useCallback(() => {
    stopAllAudioAndTimers();
    setRoundOver(true);
    setSessionScore((old) => old + Math.max(roundScore, 0));
    setSnackbarMessage(`Time's up! Correct => ${currentSong?.ArtistMaster || "Unknown"}`);
    setOpenSnackbar(true);
  }, [roundScore, currentSong, stopAllAudioAndTimers]);

  // ---------------------------
  //  startIntervals => scoring/time
  // ---------------------------
  const startIntervals = useCallback(() => {
    decrementIntervalRef.current = setInterval(() => {
      setRoundScore((old) => Math.max(old - decrementPerInterval, 0));
    }, INTERVAL_MS);

    timeIntervalRef.current = setInterval(() => {
      setTimeElapsed((old) => {
        const nextVal = old + 0.1;
        if (nextVal >= timeLimit) {
          handleTimeUp();
        }
        return nextVal;
      });
    }, INTERVAL_MS);
  }, [
    decrementIntervalRef,
    timeIntervalRef,
    decrementPerInterval,
    timeLimit,
    handleTimeUp,
  ]);

  // ---------------------------
  //  handleAnswerSelect => user picks
  // ---------------------------
  const handleAnswerSelect = (ans) => {
    console.log("Selected answer =>", ans);
    if (roundOver || !currentSong) return;
    if (selectedAnswer === ans) return;
    setSelectedAnswer(ans);

    const correctLower = (currentSong.ArtistMaster || "").trim().toLowerCase();
    const guessLower = ans.trim().toLowerCase();
    if (guessLower === correctLower) {
      // correct
      stopAllAudioAndTimers();
      setRoundOver(true);
      setSessionScore((prev) => prev + Math.max(roundScore, 0));
      setSnackbarMessage(`Correct! => ${currentSong.ArtistMaster}`);
      setOpenSnackbar(true);
    } else {
      // wrong => penalty
      setWrongAnswers((old) => [...old, ans]);
      setRoundScore((old) => {
        const newVal = Math.max(old - old * WRONG_PENALTY, 0);
        if (newVal <= 0) {
          stopAllAudioAndTimers();
          setRoundOver(true);
          setSnackbarMessage(
            `Score=0! Correct => ${currentSong.ArtistMaster}`
          );
          setOpenSnackbar(true);
        }
        return newVal;
      });
    }
  };

  // ---------------------------
  //  handleNextSong => next index
  // ---------------------------
  const handleNextSong = () => {
    console.log("Next round => ", currentIndex + 1);
    setOpenSnackbar(false);

    const nextIndex = currentIndex + 1;
    if (nextIndex >= numSongs || nextIndex >= songs.length) {
      setShowFinalSummary(true);
      return;
    }
    setCurrentIndex(nextIndex);
  };

  // ---------------------------
  //  getPerformanceMessage
  // ---------------------------
  const getPerformanceMessage = () => {
    const pct = (roundScore / maxScore) * 100;
    if (pct >= 80) return "Excellent job!";
    if (pct >= 50) return "Great work!";
    if (pct >= 20) return "Not bad!";
    if (pct > 1) return "Just Barely.";
    return "You'll get the next one!";
  };

  // If final summary => show
  if (showFinalSummary) {
    return (
      <Box
        className={styles.container}
        sx={{ display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", height: "100vh", p: 2 }}
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
          sx={{ backgroundColor: "var(--accent)", color: "var(--background)",
                "&:hover": { opacity: 0.8 }, mt: 3 }}
        >
          Close
        </Button>
      </Box>
    );
  }

  // ---------------------------
  //  A) load & play track if new
  // ---------------------------
  useEffect(() => {
    if (!currentSong) return;

    // skip if same track
    if (lastSongRef.current === currentSong.AudioUrl) {
      return;
    }
    lastSongRef.current = currentSong.AudioUrl;

    // 1) init waveSurfer if not done
    initWaveSurfer();

    // 2) load
    loadSong(currentSong.AudioUrl, () => {
      const ws = waveSurferRef.current;
      if (!ws) return;

      const dur = ws.getDuration();
      const randomStart = Math.floor(Math.random() * 90);
      const safeStart = Math.min(randomStart, dur - 1);
      ws.seekTo(safeStart / dur);

      ws.play()
        .then(() => {
          fadeVolume(0, 1, 1.0, () => {
            setIsPlaying(true);
            startIntervals();
          });
        })
        .catch((err) => {
          console.error("WaveSurfer play error:", err);
          handleNextSong();
        });
    });

    // cleanup on unmount
    return stopAllAudioAndTimers;
  }, [
    currentSong,
    waveSurferRef,
    initWaveSurfer,
    loadSong,
    fadeVolume,
    startIntervals,
    handleNextSong,
    stopAllAudioAndTimers,
  ]);

  // ---------------------------
  //  B) build distractors => correctArtist + getDistractors from filteredArtists
  // ---------------------------
  useEffect(() => {
    if (!currentSong) return;
    const correctArtist = currentSong.ArtistMaster || "";

    if (!filteredArtists || filteredArtists.length === 0) {
      console.warn("No filteredArtists => no distractors");
      setAnswers([correctArtist]);
      return;
    }

    const distractors = getDistractors(correctArtist, filteredArtists);
    const finalAnswers = shuffleArray([correctArtist, ...distractors]);
    setAnswers(finalAnswers);
  }, [currentSong, filteredArtists]);

  // ---------------------------
  //  Round init => changes in currentIndex
  // ---------------------------
  useEffect(() => {
    initRound();
    return clearIntervals; // cleanup old intervals each time
  }, [currentIndex, initRound, clearIntervals]);

  // progress bar
  const timePercent = (timeElapsed / timeLimit) * 100;

  // ---------------------------
  //  Render
  // ---------------------------
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
      <Typography
        variant="h5"
        sx={{ mb: 2, textAlign: "center", fontWeight: "bold" }}
      >
        Identify the Artist
      </Typography>

      {!currentSong || songs.length === 0 ? (
        <Typography>No songs. Adjust config and try again.</Typography>
      ) : (
        <>
          <Typography variant="h6" sx={{ mb: 2, textAlign: "center" }}>
            Time: {timeElapsed.toFixed(1)}/{timeLimit} |{" "}
            Score: {Math.floor(roundScore)}/{Math.floor(maxScore)}
          </Typography>

          {isPlaying && (
            <Box sx={{ mx: "auto", mb: 2, maxWidth: 400 }}>
              <LinearProgress
                variant="determinate"
                value={timePercent}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          )}

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

          {roundOver && (
            <Box sx={{ mt: 3, textAlign: "center" }}>
              {roundScore > 0 ? (
                <Typography variant="h6" gutterBottom>
                  {getPerformanceMessage()} (Round Score: {Math.floor(roundScore)})
                </Typography>
              ) : (
                <Typography variant="h6" gutterBottom>
                  No Score. Correct = {currentSong.ArtistMaster}
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
      AudioUrl: PropTypes.string.isRequired,
      ArtistMaster: PropTypes.string.isRequired,
      // ...
    })
  ).isRequired,
  config: PropTypes.object.isRequired,
  onCancel: PropTypes.func.isRequired,
};