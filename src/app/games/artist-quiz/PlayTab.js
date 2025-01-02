"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import PropTypes from "prop-types";
import {
  Box,
  Typography,
  Button,
  LinearProgress,
  Snackbar,
  Alert,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";

import { useGameContext } from "@/contexts/GameContext";
import useWaveSurfer from "@/hooks/useWaveSurfer";
import useArtistQuiz from "@/hooks/useArtistQuiz";
import { shuffleArray } from "@/utils/dataFetching";

export default function PlayTab({ songs, config, onCancel }) {
  // 1) Pull quiz logic
  const {
    calculateMaxScore,
    calculateDecrementPerInterval,
    WRONG_PENALTY,
    INTERVAL_MS,
    decrementIntervalRef,
    timeIntervalRef,
    clearIntervals,
    getDistractors,
  } = useArtistQuiz();

  // 2) Local states
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Timer & scoring for the round
  const [roundScore, setRoundScore] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);

  // For the entire session
  const [sessionScore, setSessionScore] = useState(0);
  const [roundOver, setRoundOver] = useState(false);
  const [showFinalSummary, setShowFinalSummary] = useState(false);

  // Extra stats to compute average
  // each element => { timeUsed, distractorsUsed }
  const [roundStats, setRoundStats] = useState([]);

  // Answers
  const [answers, setAnswers] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [wrongAnswers, setWrongAnswers] = useState([]);

  // UI
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // Extract from config
  const timeLimit = config.timeLimit ?? 15;
  const numSongs = config.numSongs ?? 10;

  // Scoring formulas
  const maxScore = calculateMaxScore(timeLimit);
  const decrementPerInterval = calculateDecrementPerInterval(
    maxScore,
    timeLimit,
  );

  // waveSurfer
  const {
    waveSurferRef,
    initWaveSurfer,
    cleanupWaveSurfer,
    loadSong,
    fadeVolume,
  } = useWaveSurfer({ onSongEnd: null });

  // To avoid reloading the same track
  const lastSongRef = useRef(null);

  // -----------------------------
  // A) stopAllAudioAndTimers
  // -----------------------------
  const stopAllAudioAndTimers = useCallback(() => {
    cleanupWaveSurfer();
    clearIntervals();
  }, [cleanupWaveSurfer, clearIntervals]);

  // -----------------------------
  // B) handleTimeUp => user ran out of time
  // -----------------------------
  const handleTimeUp = useCallback(() => {
    stopAllAudioAndTimers();
    setRoundOver(true);

    // add leftover roundScore to session
    setSessionScore((prev) => prev + Math.max(roundScore, 0));

    // record stats
    setRoundStats((prev) => [
      ...prev,
      {
        timeUsed: timeElapsed,
        distractorsUsed: wrongAnswers.length,
      },
    ]);

    setSnackbarMessage(
      `Time's up! Correct => ${currentSong?.ArtistMaster || "???"}`,
    );
    setOpenSnackbar(true);
  }, [
    roundScore,
    stopAllAudioAndTimers,
    timeElapsed,
    wrongAnswers,
    currentSong,
  ]);

  // -----------------------------
  // C) startIntervals => decrement logic
  // -----------------------------
  const startIntervals = useCallback(() => {
    // Score
    decrementIntervalRef.current = setInterval(() => {
      setRoundScore((prev) => Math.max(prev - decrementPerInterval, 0));
    }, INTERVAL_MS);

    // Time
    timeIntervalRef.current = setInterval(() => {
      setTimeElapsed((prev) => {
        const nextVal = prev + 0.1;
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

  // -----------------------------
  // D) handleAnswerSelect => user picks
  // -----------------------------
  const handleAnswerSelect = (ans) => {
    if (roundOver || !currentSong) return;
    if (selectedAnswer === ans) return;

    setSelectedAnswer(ans);
    const correct = (currentSong.ArtistMaster || "").toLowerCase();
    const guess = ans.toLowerCase();

    if (guess === correct) {
      // correct
      stopAllAudioAndTimers();
      setRoundOver(true);
      setSessionScore((prev) => prev + Math.max(roundScore, 0));

      // record stats
      setRoundStats((prev) => [
        ...prev,
        {
          timeUsed: timeElapsed,
          distractorsUsed: wrongAnswers.length,
        },
      ]);

      setSnackbarMessage(`Correct => ${currentSong.ArtistMaster}`);
      setOpenSnackbar(true);
    } else {
      // wrong => penalty
      setWrongAnswers((prev) => [...prev, ans]);
      setRoundScore((prev) => {
        const newVal = Math.max(prev - prev * WRONG_PENALTY, 0);
        if (newVal <= 0) {
          stopAllAudioAndTimers();
          setRoundOver(true);

          // record stats
          setRoundStats((old) => [
            ...old,
            {
              timeUsed: timeElapsed,
              distractorsUsed: wrongAnswers.length + 1,
            },
          ]);

          setSnackbarMessage(`Score=0! Correct => ${currentSong.ArtistMaster}`);
          setOpenSnackbar(true);
        }
        return newVal;
      });
    }
  };

  // -----------------------------
  // E) handleNextSong => next
  // -----------------------------
  const handleNextSong = useCallback(() => {
    setOpenSnackbar(false);
    const nextIndex = currentIndex + 1;
    if (nextIndex >= numSongs || nextIndex >= songs.length) {
      // end
      setShowFinalSummary(true);
      return;
    }
    setCurrentIndex(nextIndex);
  }, [currentIndex, numSongs, songs]);

  // -----------------------------
  // F) random seek + fade in
  // -----------------------------
  const FADE_DURATION = 0.8; // same as learn
  const PLAY_DURATION = config.timeLimit ?? 15; // or some default

  const clickPlaySong = useCallback(() => {
    if (!currentSong) return;
    // skip if we have the same track
    if (lastSongRef.current === currentSong.AudioUrl) return;
    lastSongRef.current = currentSong.AudioUrl;

    initWaveSurfer();
    loadSong(currentSong.AudioUrl, () => {
      const ws = waveSurferRef.current;
      if (!ws) {
        console.warn("No waveSurferRef => cannot play audio.");
        return;
      }

      // random snippet
      const dur = ws.getDuration();
      const randomStart = Math.floor(Math.random() * 90);
      ws.seekTo(Math.min(randomStart, dur - 1) / dur);

      ws.play()
        .then(() => {
          // Optionally set volume to 0 if you haven't yet
          ws.setVolume(0);

          // fade in over 1 second
          fadeVolume(0, 1, 1.0, () => {
            setIsPlaying(true);
            startIntervals(); // or handle more logic if needed
          });
        })
        .catch((err) => {
          console.error("WaveSurfer play error:", err);
          handleNextSong();
        });
    });
  }, [
    currentSong,
    FADE_DURATION,
    PLAY_DURATION,
    waveSurferRef,
    lastSongRef,
    initWaveSurfer,
    loadSong,
    fadeVolume,
    setIsPlaying,
    handleNextSong,
  ]);

  // -----------------------------
  // G) initRound => local states
  // -----------------------------
  const initRound = useCallback(() => {
    if (currentIndex >= songs.length) return;
    const song = songs[currentIndex];
    setCurrentSong(song);
    setSelectedAnswer(null);
    setWrongAnswers([]);
    setRoundOver(false);
    setRoundScore(maxScore);
    setTimeElapsed(0);
    setIsPlaying(false);
  }, [currentIndex, songs, maxScore]);

  // -----------------------------
  // H) Build answers => correct + 3 distractors
  // -----------------------------
  useEffect(() => {
    if (!currentSong) return;
    const correctArtist = currentSong.ArtistMaster || "";
    const allArtists = [...new Set(songs.map((s) => s.ArtistMaster))];
    const distractors = getDistractors(correctArtist, allArtists);
    const finalAnswers = shuffleArray([correctArtist, ...distractors]);
    setAnswers(finalAnswers);
  }, [currentSong, songs, getDistractors]);

  // -----------------------------
  // I) On mount or index => initRound
  // -----------------------------
  useEffect(() => {
    initRound();
    return clearIntervals; // clear old intervals
  }, [currentIndex, initRound, clearIntervals]);

  // -----------------------------
  // J) final summary
  // -----------------------------
  if (showFinalSummary) {
    const totalRounds = roundStats.length;
    let avgTime = 0;
    let avgDistractors = 0;
    if (totalRounds > 0) {
      const sumTime = roundStats.reduce((acc, r) => acc + r.timeUsed, 0);
      const sumDistractors = roundStats.reduce(
        (acc, r) => acc + r.distractorsUsed,
        0,
      );
      avgTime = sumTime / totalRounds;
      avgDistractors = sumDistractors / totalRounds;
    }

    return (
      <Box
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
        <Typography variant="body1" gutterBottom>
          Average Time: {avgTime.toFixed(1)} sec
        </Typography>
        <Typography variant="body1" gutterBottom>
          Average Distractors: {avgDistractors.toFixed(1)}
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

  // Utility to get performance text
  const getPerformanceMessage = () => {
    const pct = (roundScore / maxScore) * 100;
    if (pct >= 80) return "Excellent job!";
    if (pct >= 50) return "Great work!";
    if (pct >= 20) return "Not bad!";
    if (pct > 1) return "Just Barely.";
    return "You'll get the next one!";
  };

  // Time bar
  const timePercent = (timeElapsed / timeLimit) * 100;

  return (
    <Box
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
        sx={{ mb: 2, textAlign: "center", fontWeight: "bold" }}
      >
        Identify the Artist
      </Typography>

      {/* Running session score */}
      <Typography variant="body1" sx={{ mb: 2, textAlign: "center" }}>
        Session Score (So Far): {Math.floor(sessionScore)}
      </Typography>

      {/* Round time + score */}
      <Typography variant="h6" sx={{ mb: 2, textAlign: "center" }}>
        Time: {timeElapsed.toFixed(1)}/{timeLimit} | Round Score:{" "}
        {Math.floor(roundScore)}/{Math.floor(maxScore)}
      </Typography>

      {/* If playing => show progress bar */}
      {isPlaying && (
        <Box sx={{ mx: "auto", mb: 2, maxWidth: 400 }}>
          <LinearProgress
            variant="determinate"
            value={timePercent}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>
      )}

      {/* Manual Play button (when not playing and not roundOver) */}
      {!isPlaying && !roundOver && currentSong && (
        <Box sx={{ textAlign: "center", mb: 2 }}>
          <Button
            variant="contained"
            onClick={clickPlaySong}
            sx={{
              backgroundColor: "var(--accent)",
              color: "var(--background)",
              "&:hover": { opacity: 0.8 },
            }}
          >
            I am Ready!
          </Button>
        </Box>
      )}

      {/* Answers */}
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
              (currentSong?.ArtistMaster || "").trim().toLowerCase();

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
                "&:hover": { backgroundColor: "var(--input-bg)" },
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

      {/* If roundOver => show performance + next/cancel */}
      {roundOver && (
        <Box sx={{ mt: 3, textAlign: "center" }}>
          {roundScore > 0 ? (
            <Typography variant="h6" gutterBottom>
              {getPerformanceMessage()} (Round Score: {Math.floor(roundScore)})
            </Typography>
          ) : (
            <Typography variant="h6" gutterBottom>
              No Score. Correct = {currentSong?.ArtistMaster}
            </Typography>
          )}

          <Typography variant="body1" gutterBottom>
            Session Total: {Math.floor(sessionScore)}
          </Typography>

          <Button variant="contained" onClick={handleNextSong} sx={{ mr: 2 }}>
            Next
          </Button>
          <Button
            variant="outlined"
            onClick={onCancel}
            sx={{
              borderColor: "var(--foreground)",
              color: "var(--foreground)",
              "&:hover": {
                backgroundColor: "var(--foreground)",
                color: "var(--background)",
              },
            }}
          >
            Cancel
          </Button>
        </Box>
      )}

      {/* Snackbar for user feedback */}
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
    }),
  ).isRequired,
  config: PropTypes.object.isRequired,
  onCancel: PropTypes.func.isRequired,
};
