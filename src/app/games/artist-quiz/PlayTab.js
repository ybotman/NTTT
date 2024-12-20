"use client";

import styles from "..styles.module.css";
import React, { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import {
  Box,
  Typography,
  Button,
  Stack,
  Snackbar,
  Alert
} from "@mui/material";
import { getRandomStartTime, playAudio, stopAudio } from "@/utils/audio";
import useArtistQuiz from "@/hooks/useArtistQuiz";

export default function PlayTab() {
  const audioRef = useRef(null);

  // Optional debug overrides for manual testing
  // Adjust these values as needed to force certain conditions.
  const debugOverrides = {
    // Uncomment and adjust as needed:
    // currentSong: { audioUrl: "/path/to/test-audio.mp3" },
    // answers: ["Artist A", "Artist B", "Artist C", "Artist D"],
    // score: 0,
    // roundState: "ready",
    // timeElapsed: 0,
    // feedbackMessage: "",
    // quizComplete: false,
    // sessionScore: 0,
    // config: { numSongs: 5, timeLimit: 10, levels: [1,2], styles: { Tango: true, Vals: false, Milonga: false } },
  };

  const {
    currentSong: baseCurrentSong,
    answers: baseAnswers,
    score: baseScore,
    roundState: baseRoundState,
    timeElapsed: baseTimeElapsed,
    feedbackMessage: baseFeedbackMessage,
    handleAnswerSelect,
    startGame,
    startRound,
    nextSong,
    finalizeQuiz,
    showSnackbar,
    closeSnackbar,
    sessionScore: baseSessionScore,
    config: baseConfig,
    quizComplete: baseQuizComplete
  } = useArtistQuiz();

  // Merge base states with debug overrides
  const currentSong = debugOverrides.currentSong ?? baseCurrentSong;
  const answers = debugOverrides.answers ?? baseAnswers ?? [];
  const score = debugOverrides.score ?? baseScore ?? 0;
  const roundState = debugOverrides.roundState ?? baseRoundState ?? "ready";
  const timeElapsed = debugOverrides.timeElapsed ?? baseTimeElapsed ?? 0;
  const feedbackMessage = debugOverrides.feedbackMessage ?? baseFeedbackMessage ?? "";
  const quizComplete = debugOverrides.quizComplete ?? baseQuizComplete ?? false;
  const sessionScore = debugOverrides.sessionScore ?? baseSessionScore ?? 0;
  const config = debugOverrides.config ?? baseConfig ?? { numSongs: 1, timeLimit: 5, levels: [1] };

  // Console logs to debug state
  console.log("PlayTab State:", {
    currentSong,
    answers,
    score,
    roundState,
    timeElapsed,
    feedbackMessage,
    sessionScore,
    config,
    quizComplete
  });

  const onLoadedMetadata = () => {
    if (audioRef.current && roundState === "playing") {
      console.log("Audio metadata loaded. Starting playback...");
      const duration = audioRef.current.duration;
      const startTime = getRandomStartTime(duration);
      console.log("Audio Duration:", duration, "Start Time:", startTime);
      audioRef.current.currentTime = startTime;
      playAudio(audioRef.current, startTime);
    }
  };

  useEffect(() => {
    if (roundState === "over" || roundState === "done" || quizComplete) {
      console.log("Stopping audio playback");
      stopAudio(audioRef.current);
    }
  }, [roundState, quizComplete]);

  const renderConfigurationNote = () => {
    console.log("Rendering Configuration Note with config:", config);
    return (
      <Box sx={{ my: 2, textAlign: "left" }}>
        <Typography variant="h6">Configuration</Typography>
        <Typography># of Songs: {config.numSongs}</Typography>
        <Typography>Seconds per Song: {config.timeLimit}</Typography>
        <Typography>Levels: {(config.levels || []).join(", ")}</Typography>
      </Box>
    );
  };

  const renderReadyState = () => {
    console.log("Rendering Ready State");
    return (
      <>
        <Typography variant="h6" sx={{ mt: 2 }}>
          Who is the Artist?
        </Typography>
        <Stack spacing={2} sx={{ mt: 2 }}>
          {answers.map((ans) => (
            <Button key={ans} variant="outlined" disabled>
              {ans}
            </Button>
          ))}
        </Stack>
        <Button variant="contained" sx={{ mt: 2 }} onClick={() => {
          console.log("Start Round clicked");
          startRound();
        }}>
          Ready to Play
        </Button>
      </>
    );
  };

  const renderPlayingState = () => {
    console.log("Rendering Playing State");
    return (
      <>
        <Typography variant="h6" sx={{ mt: 2 }}>
          Who is the Artist?
        </Typography>
        <Stack spacing={2} sx={{ mt: 2 }}>
          {answers.map((ans) => (
            <Button key={ans} variant="outlined" onClick={() => {
              console.log("Answer Selected:", ans);
              handleAnswerSelect(ans);
            }}>
              {ans}
            </Button>
          ))}
        </Stack>
        <Typography variant="body1" sx={{ mt: 2 }}>
          Time: {timeElapsed.toFixed(1)}s / {config.timeLimit}s
        </Typography>
        <Typography variant="body1">Current Score: {Math.round(score)}</Typography>
      </>
    );
  };

  const renderOverState = () => {
    console.log("Rendering Over State");
    return (
      <>
        <Typography variant="h5" sx={{ mt: 3 }}>
          {feedbackMessage}
        </Typography>
        <Typography variant="body1">Score This Round: {Math.round(score)}</Typography>
        <Button
          variant="contained"
          sx={{ mt: 2 }}
          onClick={() => {
            console.log("Next Song clicked");
            nextSong();
          }}
          disabled={quizComplete}
        >
          {quizComplete ? "View Summary" : "Next Song"}
        </Button>
        {quizComplete && (
          <Button
            variant="outlined"
            sx={{ mt: 2, ml: 2 }}
            onClick={() => {
              console.log("Finalize Quiz clicked");
              finalizeQuiz();
            }}
          >
            Finalize Quiz
          </Button>
        )}
      </>
    );
  };

  const renderDoneState = () => {
    console.log("Rendering Done State");
    return (
      <Box sx={{ textAlign: "center", mt: 4 }}>
        <Typography variant="h5">Quiz Complete!</Typography>
        <Typography variant="h6">Your Total Score: {Math.round(sessionScore)}</Typography>
        <Typography variant="body1">{feedbackMessage}</Typography>
        <Button variant="contained" sx={{ mt: 2 }} onClick={() => {
          console.log("Finalize Quiz clicked");
          finalizeQuiz();
        }}>
          Return to Start
        </Button>
      </Box>
    );
  };

  return (
    <Box sx={{ mt: 2, textAlign: "center" }}>
      <Typography variant="h6">Session Score: {Math.round(sessionScore || 0)}</Typography>
      {!quizComplete && roundState === "ready" && !currentSong && (
        <>
          {renderConfigurationNote()}
          <Button variant="contained" onClick={() => {
            console.log("Start Artist Quiz clicked");
            startGame();
          }}>
            Start Artist Quiz
          </Button>
        </>
      )}
      {currentSong && (
        <audio ref={audioRef} src={currentSong.audioUrl} onLoadedMetadata={onLoadedMetadata} />
      )}
      {roundState === "ready" && currentSong && renderReadyState()}
      {roundState === "playing" && renderPlayingState()}
      {roundState === "over" && renderOverState()}
      {roundState === "done" && renderDoneState()}
      <Snackbar open={showSnackbar} onClose={closeSnackbar} autoHideDuration={3000}>
        <Alert severity="info" onClose={closeSnackbar} sx={{ width: "100%" }}>
          {feedbackMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}

PlayTab.propTypes = {
  // No props currently passed directly to PlayTab.
};
