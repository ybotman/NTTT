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
  //
  // 1) Basic Quiz logic from ArtistQuiz
  //
  const { calculateMaxScore, WRONG_PENALTY, INTERVAL_MS } = useArtistQuiz();

  //
  // 2) Config
  //
  const timeLimit = config.timeLimit ?? 15;
  const maxScore = calculateMaxScore(timeLimit);

  //
  // 3) Local states (snackbar, message, lastSong, etc.)
  //
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const lastSongRef = useRef(null);

  //
  // 4) waveSurfer Hook
  //
  const { initWaveSurfer, cleanupWaveSurfer, playSnippet } = useWaveSurfer({
    onSongEnd: null,
  });

  //
  // 5) Hook that fetches random phrases (if needed)
  //
  const { getGoPhrase } = usePlay();

  //---------------------------------------------------------
  // D) handleTimesUp => invoked when timeLimit is reached
  //---------------------------------------------------------
  const handleTimesUp = useCallback(() => {
    console.log("PlayTab-> handleTimesUp");
    //stopAllAudioAndTimersRef();
    setRoundOver(true); // end the round
    setRoundScore(0);   // optionally force zero
  }, [setRoundOver, setRoundScore]);

  //---------------------------------------------------------
  // E) handleRoundOver => correct guess or forced zero
  //---------------------------------------------------------
  const handleRoundOver = useCallback(
    ({ correct }) => {
      console.log("PlayTab-> handleRoundOver -> correct?", correct);
      //stopAllAudioAndTimersRef();
      cleanupWaveSurfer();
      stopAllIntervals();
      setRoundOver(true);
    },
    [cleanupWaveSurfer, stopAllIntervals, setRoundOver]
  );

  // --------------------------------------------------------
  // Now we call the scoring hook (AFTER the above callbacks)
  // --------------------------------------------------------
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
    stopAllIntervals, // needed in our "fullyStopEverything"
    initRound,
    handleAnswerSelect,
    handleNextSong,
  } = useArtistQuizScoring({
    timeLimit,
    maxScore,
    WRONG_PENALTY,
    INTERVAL_MS,
    onTimesUp: handleTimesUp,       // We'll override with handleTimesUp below
    onRoundOver: handleRoundOver,   // We'll override with handleRoundOver below
    songs,
  });

  //---------------------------------------------------------
  // B) "stopAllAudioAndTimers" => waveSurfer cleanup
  //---------------------------------------------------------
  const stopAllAudioAndTimers = useCallback(() => {
    console.log("PlayTab-> stopAllAudioAndTimers");
    cleanupWaveSurfer();
  }, [cleanupWaveSurfer]);

  //---------------------------------------------------------
  // C) "fullyStopEverything" => waveSurfer + intervals
  //---------------------------------------------------------
  const fullyStopEverything = useCallback(() => {
    stopAllAudioAndTimers();
    stopAllIntervals();
  }, [stopAllAudioAndTimers, stopAllIntervals]);

  // We can alias it for simpler usage:
  const stopAllAudioAndTimersRef = fullyStopEverything;

  //---------------------------------------------------------
  // F) "doNextSong" => proceed to next round
  //---------------------------------------------------------
  const doNextSong = useCallback(() => {
    console.log("PlayTab-> doNextSong");
    setOpenSnackbar(false);
    handleNextSong();
  }, [handleNextSong]);

  //---------------------------------------------------------
  // G) "clickPlaySong" => waveSurfer snippet + fade
  //---------------------------------------------------------
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
  }, [
    currentSong,
    initWaveSurfer,
    playSnippet,
    setIsPlaying,
    startIntervals,
    doNextSong,
  ]);

  //---------------------------------------------------------
  // H) On mount or index => initRound, plus cleanup
  //---------------------------------------------------------
  useEffect(() => {
    initRound(currentIndex);
    return stopAllAudioAndTimersRef;
  }, [currentIndex, initRound, stopAllAudioAndTimersRef]);

  //---------------------------------------------------------
  // I) Rebuild answers when currentSong changes
  //---------------------------------------------------------
  useEffect(() => {
    if (!currentSong) return;

    const correct = currentSong.ArtistMaster || "";
    // Example: if using your distractors method
    // ...
    // setAnswers([... final array ...]);

  }, [currentSong, setAnswers]);

  //---------------------------------------------------------
  // H) Build answers whenever currentSong changes
  //---------------------------------------------------------
  useEffect(() => {
    if (!currentSong) return;

    const correctArtist = currentSong.ArtistMaster || "";
    const allArtists = [...new Set(songs.map((s) => s.ArtistMaster))];
    const distractors = getDistractorsByConfig(correctArtist, allArtists, config, 3);
    const finalAnswers = shuffleArray([correctArtist, ...distractors]);

    setAnswers(finalAnswers);
    console.log("PlayTab-> setAnswers =>", finalAnswers);
  }, [currentSong, songs, config, setAnswers]);

  //---------------------------------------------------------
  // I) On mount or index => initRound, plus cleanup
  //---------------------------------------------------------
  useEffect(() => {
    initRound(currentIndex);
    // Cleanup old intervals on unmount or index change
    return stopAllAudioAndTimersRef;
  }, [currentIndex, initRound, stopAllAudioAndTimersRef]);

  //---------------------------------------------------------
  // J) If final => summary screen logic here...
  //    (Your summary screen code remains unchanged)
  //---------------------------------------------------------

  //---------------------------------------------------------
  // K) Performance text + progress bar calculations
  //---------------------------------------------------------
  const getPerformanceMessage = () => {
    const pct = (roundScore / maxScore) * 100;
    if (pct >= 80) return "Excellent job!";
    if (pct >= 50) return "Great work!";
    if (pct >= 20) return "Not bad!";
    if (pct > 1) return "Just Barely.";
    return "You'll get the next one!";
  };

  const timePercent = (timeElapsed / timeLimit) * 100;

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
