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

// Example placeholders for your icons
import HubIcon from "@mui/icons-material/Home"; // or whichever icon you have
import ScoreboardIcon from "@mui/icons-material/Scoreboard";
import DarkModeIcon from "@mui/icons-material/DarkMode";
// Alternatively import your actual icon components

export default function PlayTab({ songs, config, onCancel }) {
  // A) Grab context logic
  const { config: gameConfig } = useGameContext();

  // B) Grab quiz logic
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

  // C) Local States for gameplay
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Timer & scoring
  const [roundScore, setRoundScore] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);

  // Session Tracking
  const [sessionScore, setSessionScore] = useState(0);
  const [roundOver, setRoundOver] = useState(false);
  const [showFinalSummary, setShowFinalSummary] = useState(false);

  // **(NEW)** Extra stats for final summary:
  const [roundStats, setRoundStats] = useState([]);
  // each element => { timeUsed, distractorsUsed }

  // Answers
  const [answers, setAnswers] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [wrongAnswers, setWrongAnswers] = useState([]);

  // UI feedback
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // Extract from config
  const timeLimit = config.timeLimit ?? 15;
  const numSongs = config.numSongs ?? 10;

  // For dynamic scoring
  const maxScore = calculateMaxScore(timeLimit);
  const decrementPerInterval = calculateDecrementPerInterval(
    maxScore,
    timeLimit,
  );

  // waveSurfer
  const { waveSurferRef, initWaveSurfer, cleanupWaveSurfer, loadSong } =
    useWaveSurfer({ onSongEnd: null });

  // Track last loaded track
  const lastSongRef = useRef(null);

  // -----------------------------
  // 1) STOP everything
  // -----------------------------
  const stopAllAudioAndTimers = useCallback(() => {
    cleanupWaveSurfer();
    clearIntervals();
  }, [cleanupWaveSurfer, clearIntervals]);

  // -----------------------------
  // 2) handleTimeUp
  // -----------------------------
  const handleTimeUp = useCallback(() => {
    stopAllAudioAndTimers();
    setRoundOver(true);

    // Add leftover to session
    setSessionScore((old) => old + Math.max(roundScore, 0));

    // Record the stats for this round
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
    currentSong,
    stopAllAudioAndTimers,
    timeElapsed,
    wrongAnswers,
  ]);

  // -----------------------------
  // 3) startIntervals
  // -----------------------------
  const startIntervals = useCallback(() => {
    // Score decrement every 0.1s
    decrementIntervalRef.current = setInterval(() => {
      setRoundScore((old) => Math.max(old - decrementPerInterval, 0));
    }, INTERVAL_MS);

    // Time
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

  // -----------------------------
  // 4) handleAnswerSelect
  // -----------------------------
  const handleAnswerSelect = (ans) => {
    if (roundOver || !currentSong) return;
    if (selectedAnswer === ans) return; // same pick => ignore

    setSelectedAnswer(ans);

    const correct = (currentSong.ArtistMaster || "").trim().toLowerCase();
    const guess = ans.trim().toLowerCase();

    if (guess === correct) {
      // correct => finalize
      stopAllAudioAndTimers();
      setRoundOver(true);
      setSessionScore((old) => old + Math.max(roundScore, 0));

      // Record stats
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
      setWrongAnswers((old) => [...old, ans]);
      setRoundScore((old) => {
        const newVal = Math.max(old - old * WRONG_PENALTY, 0);
        if (newVal <= 0) {
          stopAllAudioAndTimers();
          setRoundOver(true);

          // Record stats
          setRoundStats((prev) => [
            ...prev,
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
  // 5) handleNextSong
  // -----------------------------
  const handleNextSong = useCallback(() => {
    setOpenSnackbar(false);
    const nextIndex = currentIndex + 1;
    if (nextIndex >= numSongs || nextIndex >= songs.length) {
      // final
      setShowFinalSummary(true);
      return;
    }
    setCurrentIndex(nextIndex);
  }, [currentIndex, numSongs, songs]);

  // Simple performance message
  const getPerformanceMessage = () => {
    const pct = (roundScore / maxScore) * 100;
    if (pct >= 80) return "Excellent job!";
    if (pct >= 50) return "Great work!";
    if (pct >= 20) return "Not bad!";
    if (pct >= 1) return "Just Barely.";
    return "You'll get the next one!";
  };

  // -----------------------------
  // 6) “Manual” button => loadAndPlaySongRaw
  //    (No fade, no random seek)
  // -----------------------------
  const manualPlaySong = useCallback(() => {
    if (!currentSong) return;
    if (lastSongRef.current === currentSong.AudioUrl) return;
    lastSongRef.current = currentSong.AudioUrl;

    initWaveSurfer();

    loadSong(currentSong.AudioUrl, () => {
      const ws = waveSurferRef.current;
      if (!ws) {
        console.warn("No waveSurferRef => cannot play audio.");
        return;
      }
      ws.setVolume(1.0);
      ws.play()
        .then(() => {
          setIsPlaying(true);
          startIntervals();
        })
        .catch((err) => {
          console.error("WaveSurfer play error:", err);
          handleNextSong();
        });
    });
  }, [
    currentSong,
    initWaveSurfer,
    loadSong,
    waveSurferRef,
    setIsPlaying,
    startIntervals,
    handleNextSong,
  ]);

  // -----------------------------
  // 7) initRound => set local states
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
  // 8) build answers => correct + 3 distractors
  // -----------------------------
  useEffect(() => {
    if (!currentSong) return;
    const correctArtist = currentSong.ArtistMaster || "";

    // We can pick from the same songs array:
    const allArtists = [...new Set(songs.map((s) => s.ArtistMaster))];
    const distractors = getDistractors(correctArtist, allArtists);
    const finalAnswers = shuffleArray([correctArtist, ...distractors]);
    setAnswers(finalAnswers);
  }, [currentSong, songs, getDistractors]);

  // -----------------------------
  // 9) On mount / index => initRound
  // -----------------------------
  useEffect(() => {
    initRound();
    return clearIntervals;
  }, [currentIndex, initRound, clearIntervals]);

  // -----------------------------
  // 10) If final => show summary
  // -----------------------------
  if (showFinalSummary) {
    // **Compute average time & average distractors** from roundStats
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

        {/* A) Final Score */}
        <Typography variant="h6" gutterBottom>
          Total Score: {Math.floor(sessionScore)}
        </Typography>

        {/* B) Average time + distractors */}
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

  // -----------------------------
  //  Add top-right icons row
  // -----------------------------
  // We'll place them in a small “toolbar” at top-right
  // Adjust styling as you wish
  const handleHubClick = () => {
    console.log("Navigate to hub...");
    // router.push("/games/gamehub") or something
  };
  const handleScoreClick = () => {
    console.log("Show high-scores or scoreboard...");
  };
  const handleThemeClick = () => {
    console.log("Toggle theme...");
  };

  // compute time progress for display
  const timePercent = (timeElapsed / timeLimit) * 100;

  return (
    <Box
      sx={{
        position: "relative",
        minHeight: "100vh",
        background: "var(--background)",
        color: "var(--foreground)",
        p: 2,
      }}
    >
      {/* 
        Top-Right icons 
        (Hub / Score / Theme):
      */}
      <Box
        sx={{
          position: "absolute",
          top: 8,
          right: 8,
          display: "flex",
          gap: 2,
          alignItems: "center",
        }}
      >
        <HubIcon sx={{ cursor: "pointer" }} onClick={handleHubClick} />
        <ScoreboardIcon sx={{ cursor: "pointer" }} onClick={handleScoreClick} />
        <DarkModeIcon sx={{ cursor: "pointer" }} onClick={handleThemeClick} />
      </Box>

      {/* Title */}
      <Typography
        variant="h5"
        sx={{ mt: 2, mb: 2, textAlign: "center", fontWeight: "bold" }}
      >
        Identify the Artist
      </Typography>

      {/* Show “Session Score” at top if desired */}
      <Typography variant="body1" sx={{ mb: 2, textAlign: "center" }}>
        Session Score (So Far): {sessionScore}
      </Typography>

      {/* Time & Round Score */}
      <Typography variant="h6" sx={{ mb: 2, textAlign: "center" }}>
        Time: {timeElapsed.toFixed(1)}/{timeLimit} | Round Score:{" "}
        {Math.floor(roundScore)}/{Math.floor(maxScore)}
      </Typography>

      {/* Progress bar if playing */}
      {isPlaying && (
        <Box sx={{ mx: "auto", mb: 2, maxWidth: 400 }}>
          <LinearProgress
            variant="determinate"
            value={timePercent}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>
      )}

      {/* If not playing & not roundOver => let user press 'Play Song' */}
      {!isPlaying && !roundOver && currentSong && (
        <Box sx={{ textAlign: "center", mb: 2 }}>
          <Button
            variant="contained"
            onClick={manualPlaySong}
            sx={{
              backgroundColor: "var(--accent)",
              color: "var(--background)",
              "&:hover": { opacity: 0.8 },
            }}
          >
            Play Song
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

      {/* If roundOver => Next/Cancel */}
      {roundOver && (
        <Box sx={{ mt: 3, textAlign: "center" }}>
          {roundScore > 0 ? (
            <Typography variant="h6" gutterBottom>
              {getPerformanceMessage()} (Round Score: {Math.floor(roundScore)})
            </Typography>
          ) : (
            <Typography variant="h6" gutterBottom>
              No Score. Correct =`&gt;` {currentSong?.ArtistMaster}
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
                background: "var(--foreground)",
                color: "var(--background)",
              },
            }}
          >
            Cancel
          </Button>
        </Box>
      )}

      {/* Snackbar for feedback */}
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
    }),
  ).isRequired,
  config: PropTypes.object.isRequired,
  onCancel: PropTypes.func.isRequired,
};
