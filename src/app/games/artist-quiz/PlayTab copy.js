// -------------------------------------------
// src/app/games/artist-quiz/PlayTab.js
// -------------------------------------------
"use client";

import React, { useEffect, useRef, useCallback } from "react";
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
  // 1) Basic Quiz logic
  //
  const { calculateMaxScore, WRONG_PENALTY, INTERVAL_MS, getDistractors } =
    useArtistQuiz();

  //
  // 2) Config
  //
  const timeLimit = config.timeLimit ?? 15;
  const numSongs = config.numSongs ?? 10;
  const maxScore = calculateMaxScore(timeLimit);

  //
  // 3) The scoring hook (handles initRound, answerSelect, intervals, etc.)
  //
  const {
    currentIndex,
    currentSong,
    isPlaying,
    setIsPlaying,
    answers,
    setAnswers,
    selectedAnswer,
    wrongAnswers,
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
    initRound,
    handleAnswerSelect,
    handleNextSong,
  } = useArtistQuizScoring({
    timeLimit,
    maxScore,
    WRONG_PENALTY,
    INTERVAL_MS,
    onTimesUp: handleTimesUp,
    onRoundOver: handleRoundOver,
    // onEndOfGame: null,
    songs, // pass the entire songs array so it can do initRound logic
  });

  //
  // 4) waveSurfer
  //
  const { waveSurferRef, initWaveSurfer, cleanupWaveSurfer, playSnippet } =
    useWaveSurfer({ onSongEnd: null });
  //
  // 5) get random "go phrase"
  //
  const { getGoPhrase } = usePlay();

  // For feedback
  const [openSnackbar, setOpenSnackbar] = React.useState(false);
  const [snackbarMessage, setSnackbarMessage] = React.useState("");

  // Also track if we already loaded a track
  const lastSongRef = useRef(null);

  //
  // A) Stop everything
  //
  const stopAllAudioAndTimers = useCallback(() => {
    console.log("PlayTab-> stopAllAudioAndTimers");
    cleanupWaveSurfer();
    stopAllIntervals();
  }, [cleanupWaveSurfer, stopAllIntervals]);
  // Bn) Callback when time runs out
  const handleTimesUp = useCallback(() => {
    stopAllAudioAndTimers();
    setRoundOver(true);
  }, [stopAllAudioAndTimers, setRoundOver]);

  // Cn) Callback when round ends (correct guess or forced zero)
  const handleRoundOver = useCallback(
    ({ correct }) => {
      console.log("PlayTab-> handleRoundOver -> correct?", correct);
      stopAllAudioAndTimers();
    },
    [stopAllAudioAndTimers],
  );

  //
  // B) Actually next or final
  //
  const doNextSong = useCallback(() => {
    console.log("PlayTab-> doNextSong");
    setOpenSnackbar(false);
    handleNextSong(); // from the scoring hook
  }, [handleNextSong]);

  //
  // C) "clickPlaySong" => waveSurfer snippet+fade
  //
  const clickPlaySong = useCallback(() => {
    console.log("PlayTab-> clickPlaySong");
    if (!currentSong) return;
    if (lastSongRef.current === currentSong.AudioUrl) return;
    lastSongRef.current = currentSong.AudioUrl;
    initWaveSurfer();

    // waveSurfer's new snippet function
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
  }, [
    currentSong,
    initWaveSurfer,
    playSnippet,
    setIsPlaying,
    startIntervals,
    doNextSong,
  ]);

  //
  // D) Build answers whenever currentSong changes
  //
  useEffect(() => {
    if (!currentSong) return;
    const correctArtist = currentSong.ArtistMaster || "";
    const allArtists = [...new Set(songs.map((s) => s.ArtistMaster))];
    const distractors = getDistractors(correctArtist, allArtists);
    const finalAnswers = shuffleArray([correctArtist, ...distractors]);
    setAnswers(finalAnswers);
    console.log("PlayTab-> useEffect-> setAnswers", finalAnswers);
  }, [currentSong, songs, getDistractors, setAnswers]);

  //
  // E) On mount or index => initRound
  //
  useEffect(() => {
    initRound(currentIndex);
    // Cleanup old intervals
    return stopAllAudioAndTimers;
  }, [currentIndex, initRound, stopAllAudioAndTimers]);

  //
  // F) If final => summary
  //
  if (showFinalSummary) {
    const totalRounds = roundStats.length;
    let avgTime = 0,
      avgDist = 0;

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

  //
  // Utility: performance text
  //
  const getPerformanceMessage = () => {
    const pct = (roundScore / maxScore) * 100;
    if (pct >= 80) return "Excellent job!";
    if (pct >= 50) return "Great work!";
    if (pct >= 20) return "Not bad!";
    if (pct > 1) return "Just Barely.";
    return "You'll get the next one!";
  };

  // progress bar
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
            {/* Could fetch & store a local 'goPhrase' in the scoring hook or here */}
            I&apos;m Ready!
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
                // now we call scoring hook's handleAnswerSelect
                handleAnswerSelect(ans);
                // If you want to show a snackbar, do it here or in the hook
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
              // also reset if you want a fresh start next time
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
