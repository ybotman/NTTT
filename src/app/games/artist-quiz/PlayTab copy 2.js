"use client";

import React, { useEffect, useRef, useCallback, useState } from "react";
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
import { getDistractorsByConfig } from "@/utils/dataFetching";

export default function PlayTab({ songs, config, onCancel }) {
  // -----------------------------
  // 1) Basic quiz config
  // -----------------------------
  const { calculateMaxScore, WRONG_PENALTY, INTERVAL_MS } = useArtistQuiz();
  const timeLimit = config.timeLimit ?? 15;
  const maxScore  = calculateMaxScore(timeLimit);

  // -----------------------------
  // 2) Parent local states
  // -----------------------------
  const [roundOver, setRoundOver]     = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const lastSongRef = useRef(null);

  // WaveSurfer
  const { initWaveSurfer, cleanupWaveSurfer, playSnippet } = useWaveSurfer({ onSongEnd: null });

  // (Optional) random phrase
  const { getGoPhrase } = usePlay();

  // -----------------------------
  // 3) onTimesUp => time is up
  // -----------------------------
  const onTimesUp = useCallback(() => {
    console.log("PlayTab-> onTimesUp => setting roundOver + forcing 0 score");
    setRoundOver(true);
    setRoundScore(0);
    stopAudio();
  }, [setRoundOver, setRoundScore]);

  // The main scoring hook (no roundOver inside the hook):
  const {
    currentIndex,
    currentSong,
    isPlaying,     setIsPlaying,
    answers,       setAnswers,
    selectedAnswer,
    wrongAnswers,
    timeElapsed,
    setTimeElapsed,
    roundScore,    setRoundScore,
    sessionScore,  setSessionScore,
    showFinalSummary, setShowFinalSummary,
    roundStats,    setRoundStats,
    startIntervals,
    stopAllIntervals,
    initRound,
    handleAnswerSelect: scoringAnswerSelect,
    handleNextSong,
  } = useArtistQuizScoring({
    timeLimit,
    maxScore,
    WRONG_PENALTY,
    INTERVAL_MS,
    onTimesUp,       // Called when timeLimit is reached => parent sets roundOver
    songs,
  });

  // -----------------------------
  // 4) Stop Audio
  // -----------------------------
  const stopAudio = useCallback(() => {
    console.log("PlayTab-> stopAudio => waveSurfer cleanup + stop intervals");
    cleanupWaveSurfer();
    stopAllIntervals();
  }, [cleanupWaveSurfer, stopAllIntervals]);

  // -----------------------------
  // 5) handleAnswerSelect => user picks an answer in the UI
  // We call the hook's logic to see if it's correct/forced zero
  // Then we decide if roundOver
  // -----------------------------
  const handleAnswerSelect = useCallback(
    (ans) => {
      console.log("PlayTab-> handleAnswerSelect =>", ans);
      const { roundEnded, correct } = scoringAnswerSelect(ans);

      // If the hook returns roundEnded => user got correct or forced 0
      if (roundEnded) {
        setRoundOver(true);
        stopAudio();
      }
    },
    [scoringAnswerSelect, setRoundOver, stopAudio]
  );

  // -----------------------------
  // 6) doNextSong => proceed
  // -----------------------------
  const doNextSong = useCallback(() => {
    console.log("PlayTab-> doNextSong");
    setOpenSnackbar(false);
    setRoundOver(false); // new round => reset parent roundOver
    handleNextSong();
  }, [handleNextSong, setRoundOver]);

  // -----------------------------
  // 7) clickPlaySong => waveSurfer snippet
  // -----------------------------
  const clickPlaySong = useCallback(() => {
    console.log("PlayTab-> clickPlaySong");
    if (!currentSong) return;
    if (lastSongRef.current === currentSong.AudioUrl) return;
    lastSongRef.current = currentSong.AudioUrl;

    initWaveSurfer();
    playSnippet(currentSong.AudioUrl, {
      snippetMaxStart: 90,
      fadeDurationSec: 1.0,
      onPlaySuccess: () => {
        setIsPlaying(true);
        startIntervals();
      },
      onPlayError: (err) => {
        console.error("Snippet play error:", err);
        doNextSong();
      },
    });
  }, [currentSong, initWaveSurfer, playSnippet, setIsPlaying, startIntervals, doNextSong]);

  // -----------------------------
  // 8) initRound on mount or index
  // -----------------------------
  useEffect(() => {
    initRound(currentIndex);
    return () => stopAudio();
  }, [currentIndex, initRound, stopAudio]);

  // -----------------------------
  // 9) Build answers whenever currentSong changes
  // -----------------------------
  useEffect(() => {
    if (!currentSong) return;
    const correctArtist = currentSong.ArtistMaster || "";
    const allArtists = [...new Set(songs.map((s) => s.ArtistMaster))];
    const distractors = getDistractorsByConfig(correctArtist, allArtists, config, 3);
    const finalAnswers = shuffleArray([correctArtist, ...distractors]);
    setAnswers(finalAnswers);
    console.log("PlayTab-> setAnswers =>", finalAnswers);
  }, [currentSong, songs, config, setAnswers]);

  // (If final => summary screen omitted for brevity or your existing code remains the same.)

  // For display:
  const timePercent = (timeElapsed / timeLimit) * 100;

  const getPerformanceMessage = () => {
    const pct = (roundScore / maxScore) * 100;
    if (pct >= 80) return "Excellent job!";
    if (pct >= 50) return "Great work!";
    if (pct >= 20) return "Not bad!";
    if (pct > 1)  return "Just Barely.";
    return "You'll get the next one!";
  };


  //---------------------------------------------------------
  // K) Render
  //---------------------------------------------------------
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

      {/* "Play Song" button => random phrase */}
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
            Im Ready!
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

          // disable if roundOver or not playing or isWrong or isChosenCorrect
          const disabled =
            roundOver || !isPlaying || isWrong || isChosenCorrect;

          return (
            <ListItem
              key={ans}
              onClick={() => {
                // call scoring hook's handleAnswerSelect
                handleAnswerSelect(ans);
              }}
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

      {/* If roundOver => show performance + Next/Cancel */}
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

          <Button variant="contained" onClick={doNextSong} sx={{ mr: 2 }}>
            Next
          </Button>
          <Button
            variant="outlined"
            onClick={() => {
              // also reset if you want a fresh start
              stopAllAudioAndTimersRef();
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
    }),
  ).isRequired,
  config: PropTypes.object.isRequired,
  onCancel: PropTypes.func.isRequired,
};
