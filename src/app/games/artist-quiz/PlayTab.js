// -------------------------------------------
// src/app/games/artist-quiz/PlayTab.js
// -------------------------------------------
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

import useWaveSurfer from "@/hooks/useWaveSurfer";
import useArtistQuiz from "@/hooks/useArtistQuiz";
import usePlay from "@/hooks/usePlay";
import useArtistQuizScoring from "@/hooks/useArtistQuizScoring";
import { shuffleArray } from "@/utils/dataFetching";

export default function PlayTab({ songs, config, onCancel }) {
  //
  // 1) Quiz logic
  //
  const {
    calculateMaxScore,
    WRONG_PENALTY,
    INTERVAL_MS,
    getDistractors,
  } = useArtistQuiz();

  //
  // 2) Basic config
  //
  const timeLimit = config.timeLimit ?? 15;
  const numSongs  = config.numSongs  ?? 10;
  const maxScore  = calculateMaxScore(timeLimit);

  //
  // 3) Scoring hook
  //
  const {
    timeElapsed,
    setTimeElapsed,
    roundScore,
    setRoundScore,
    roundOver,
    setRoundOver,
    sessionScore,
    setSessionScore,
    showFinalSummary,
    setShowFinalSummary,
    roundStats,
    setRoundStats,
    startIntervals,
    stopAllIntervals,
  } = useArtistQuizScoring({
    timeLimit,
    maxScore,
    WRONG_PENALTY,
    INTERVAL_MS,
    onTimesUp: null,    // or define a callback
    onEndOfGame: null,  // or define a callback
  });

  //
  // 4) waveSurfer
  //
  const {
    waveSurferRef,
    initWaveSurfer,
    cleanupWaveSurfer,
    loadSong,
    fadeVolume,
  } = useWaveSurfer({ onSongEnd: null });

  //
  // 5) get random "go phrase"
  //
  const { getGoPhrase } = usePlay();
  const [goPhrase, setGoPhrase] = useState("Ready?");

  //
  // 6) Local states for each round
  //
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentSong, setCurrentSong]   = useState(null);
  const [isPlaying, setIsPlaying]       = useState(false);

  const [answers, setAnswers]           = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [wrongAnswers, setWrongAnswers] = useState([]);

  // For avoiding reloading the same track multiple times
  const lastSongRef = useRef(null);

  // Snackbar feedback
  const [openSnackbar, setOpenSnackbar]     = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // -----------------------------
  // A) Stop everything
  // -----------------------------
  const stopAllAudioAndTimers = useCallback(() => {
    cleanupWaveSurfer();
    stopAllIntervals();
  }, [cleanupWaveSurfer, stopAllIntervals]);

  // -----------------------------
  // B) If time runs out
  // -----------------------------
  const handleTimeUp = useCallback(() => {
    stopAllAudioAndTimers();
    setRoundOver(true);

    // leftover => session
    setSessionScore((old) => old + Math.max(roundScore, 0));

    // stats
    setRoundStats((old) => [
      ...old,
      {
        timeUsed: timeElapsed,
        distractorsUsed: wrongAnswers.length,
      },
    ]);

    setSnackbarMessage(
      `Time's up! Correct Answer: ${currentSong?.ArtistMaster || "???"}`
    );
    setOpenSnackbar(true);
  }, [
    stopAllAudioAndTimers,
    setRoundOver,
    setSessionScore,
    roundScore,
    setRoundStats,
    timeElapsed,
    wrongAnswers,
    currentSong,
  ]);

  // -----------------------------
  // C) handle user picking an answer
  // -----------------------------
  const handleAnswerSelect = (ans) => {
    if (roundOver || !isPlaying || !currentSong) return;
    if (selectedAnswer === ans) return;

    setSelectedAnswer(ans);

    const correct = (currentSong.ArtistMaster || "").trim().toLowerCase();
    const guess   = ans.trim().toLowerCase();

    if (guess === correct) {
      // correct => finalize
      stopAllAudioAndTimers();
      setRoundOver(true);
      setSessionScore((old) => old + Math.max(roundScore, 0));

      // stats
      setRoundStats((old) => [
        ...old,
        {
          timeUsed: timeElapsed,
          distractorsUsed: wrongAnswers.length,
        },
      ]);

      setSnackbarMessage(`Correct! ${currentSong.ArtistMaster}`);
      setOpenSnackbar(true);
    } else {
      // wrong => penalty
      setWrongAnswers((old) => [...old, ans]);
      setRoundScore((oldVal) => {
        const newVal = Math.max(oldVal - oldVal * WRONG_PENALTY, 0);
        if (newVal <= 0) {
          // round ends
          stopAllAudioAndTimers();
          setRoundOver(true);

          setRoundStats((oldStats) => [
            ...oldStats,
            {
              timeUsed: timeElapsed,
              distractorsUsed: wrongAnswers.length + 1,
            },
          ]);

          setSnackbarMessage(`Score=0! Correct: ${currentSong.ArtistMaster}`);
          setOpenSnackbar(true);
        }
        return newVal;
      });
    }
  };

  // -----------------------------
  // D) Next Song or Final
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
  }, [currentIndex, numSongs, songs, setShowFinalSummary]);

  // -----------------------------
  // E) "Play Song" => snippet + fade
  // -----------------------------
  const clickPlaySong = useCallback(() => {
    if (!currentSong) return;
    if (lastSongRef.current === currentSong.AudioUrl) return;

    lastSongRef.current = currentSong.AudioUrl;
    initWaveSurfer();

    loadSong(currentSong.AudioUrl, () => {
      const ws = waveSurferRef.current;
      if (!ws) return;

      const dur = ws.getDuration();
      const randomStart = Math.floor(Math.random() * 90);
      ws.seekTo(Math.min(randomStart, dur - 1) / dur);

      ws.play()
        .then(() => {
          ws.setVolume(0);
          fadeVolume(0, 1, 1.0, () => {
            setIsPlaying(true);
            startIntervals(); // begin time/score countdown
          });
        })
        .catch((err) => {
          console.error("WaveSurfer play error:", err);
          // skip this track
          handleNextSong();
        });
    });
  }, [
    currentSong,
    waveSurferRef,
    initWaveSurfer,
    loadSong,
    fadeVolume,
    setIsPlaying,
    startIntervals,
    handleNextSong,
  ]);

  // -----------------------------
  // F) initRound => reset states
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

    // new random phrase
    (async () => {
      const phrase = await getGoPhrase();
      setGoPhrase(phrase);
    })();
  }, [
    currentIndex,
    songs,
    maxScore,
    setRoundOver,
    setRoundScore,
    setTimeElapsed,
    getGoPhrase,
  ]);

  // -----------------------------
  // G) Build answers => correct + 3 distractors
  // -----------------------------
  useEffect(() => {
    if (!currentSong) return;
    const correctArtist = currentSong.ArtistMaster || "";
    const allArtists    = [...new Set(songs.map((s) => s.ArtistMaster))];

    const distractors  = getDistractors(correctArtist, allArtists);
    const finalAnswers = shuffleArray([correctArtist, ...distractors]);
    setAnswers(finalAnswers);
  }, [currentSong, songs, getDistractors]);

  // -----------------------------
  // H) On mount / currentIndex => initRound
  // -----------------------------
  useEffect(() => {
    initRound();
    // cleanup intervals from the prior round
    return stopAllIntervals;
  }, [currentIndex, initRound, stopAllIntervals]);

  // -----------------------------
  // I) If final => show summary
  // -----------------------------
  if (showFinalSummary) {
    const totalRounds = roundStats.length;
    let avgTime       = 0;
    let avgDist       = 0;

    if (totalRounds > 0) {
      const sumTime = roundStats.reduce((acc, r) => acc + r.timeUsed, 0);
      const sumDist = roundStats.reduce((acc, r) => acc + r.distractorsUsed, 0);
      avgTime = sumTime / totalRounds;
      avgDist = sumDist / totalRounds;
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
          Average Time: {avgTime.toFixed(1)}s
        </Typography>
        <Typography variant="body1" gutterBottom>
          Average Distractors: {avgDist.toFixed(1)}
        </Typography>

        <Button
          variant="contained"
          onClick={() => {
            // Reset so that a second run starts fresh
            setCurrentIndex(0);
            setShowFinalSummary(false);
            setSessionScore(0);
            onCancel();
          }}
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

  //
  // Utility => performance text
  //
  const getPerformanceMessage = () => {
    const pct = (roundScore / maxScore) * 100;
    if (pct >= 80) return "Excellent job!";
    if (pct >= 50) return "Great work!";
    if (pct >= 20) return "Not bad!";
    if (pct > 1)  return "Just Barely.";
    return "You'll get the next one!";
  };

  // progress bar
  const timePercent = (timeElapsed / timeLimit) * 100;

  // -----------------------------
  // Normal Round UI
  // -----------------------------
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
      <Typography variant="h5" sx={{ mb: 2, textAlign: "center", fontWeight: "bold" }}>
        Identify the Artist
      </Typography>

      {/* Session Score */}
      <Typography variant="body1" sx={{ mb: 2, textAlign: "center" }}>
        Session Score: {Math.floor(sessionScore)}
      </Typography>

      {/* Round time + score */}
      <Typography variant="h6" sx={{ mb: 2, textAlign: "center" }}>
        Time: {timeElapsed.toFixed(1)}/{timeLimit} | Round Score:{" "}
        {Math.floor(roundScore)}/{Math.floor(maxScore)}
      </Typography>

      {/* If playing => progress bar */}
      {isPlaying && (
        <Box sx={{ mx: "auto", mb: 2, maxWidth: 400 }}>
          <LinearProgress
            variant="determinate"
            value={timePercent}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>
      )}

      {/* The "Play Song" button => uses random phrase */}
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
            {goPhrase || "I'm Ready!"}
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
          else if (isWrong)                borderColor = "red";

          // disable if roundOver or not playing or isWrong or isChosenCorrect
          const disabled = roundOver || !isPlaying || isWrong || isChosenCorrect;

          return (
            <ListItem
              key={ans}
              onClick={() => handleAnswerSelect(ans)}
              disabled={disabled}
              sx={{
                mb: 1,
                border: `2px solid ${borderColor}`,
                borderRadius: "4px",
                cursor: disabled ? "default" : "pointer",
                "&:hover": {
                  backgroundColor: disabled ? "inherit" : "var(--input-bg)",
                },
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

      {/* If roundOver => performance + Next/Cancel */}
      {roundOver && (
        <Box sx={{ mt: 3, textAlign: "center" }}>
          {roundScore > 0 ? (
            <Typography variant="h6" gutterBottom>
              {getPerformanceMessage()} (Round Score: {Math.floor(roundScore)})
            </Typography>
          ) : (
            <Typography variant="h6" gutterBottom>
              No Score. Answer: {currentSong?.ArtistMaster}
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
            onClick={() => {
              // also reset if you want a fresh start next time
              setCurrentIndex(0);
              setRoundOver(false);
              stopAllAudioAndTimers();
              onCancel();
            }}
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

      {/* Snackbar */}
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
      SongID:       PropTypes.string,
      AudioUrl:     PropTypes.string.isRequired,
      ArtistMaster: PropTypes.string.isRequired,
    }),
  ).isRequired,
  config: PropTypes.object.isRequired,
  onCancel: PropTypes.func.isRequired,
};