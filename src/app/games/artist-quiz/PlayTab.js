"use client";

import React, { useEffect, useRef, useCallback, useState } from "react";
import PropTypes from "prop-types";
import {
  Box,
  Typography,
  Button,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";

import useWaveSurfer from "@/hooks/useWaveSurfer";
import useArtistQuiz from "@/hooks/useArtistQuiz";
import usePlay from "@/hooks/usePlay";
import useArtistQuizScoring from "@/hooks/useArtistQuizScoring";
import { shuffleArray } from "@/utils/dataFetching";
import { getDistractors } from "@/utils/dataFetching";
import RoundProgress from "@/components/ui/RoundProgress";

export default function PlayTab({ songs, config, onCancel }) {
  // 1) Basic quiz config
  const { calculateMaxScore, WRONG_PENALTY, INTERVAL_MS } = useArtistQuiz();
  const timeLimit = config.timeLimit ?? 15;
  const maxScore  = calculateMaxScore(timeLimit);

  // 2) Local state
  const [roundOver, setRoundOver] = useState(false);
  const lastSongRef = useRef(null);
  const numSongs = config.numSongs ?? 10;

  // waveSurfer
  const { initWaveSurfer, cleanupWaveSurfer, playSnippet } = useWaveSurfer({
    onSongEnd: null,
  });

  // Optional “go phrase”
  const { getGoPhrase } = usePlay();

  // 3) Call the scoring hook (no roundOver inside the hook)
  const {
    currentIndex,
    currentSong,
    isPlaying, setIsPlaying,
    answers,   setAnswers,
    selectedAnswer,
    wrongAnswers,
    timeElapsed, setTimeElapsed,
    roundScore,  setRoundScore,
    sessionScore, setSessionScore,
    showFinalSummary, setShowFinalSummary,
    roundStats,   setRoundStats,
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
    onTimesUp: () => {
      console.log("PlayTab-> onTimesUp => forcing 0 score + roundOver");
      setRoundScore(0);
      setRoundOver(true);
      stopAudio();
    },
    songs,
  });

  // 4) stopAudio => waveSurfer + intervals
  const stopAudio = useCallback(() => {
    console.log("PlayTab-> stopAudio => waveSurfer cleanup + stop intervals");
    cleanupWaveSurfer();
    stopAllIntervals();
  }, [cleanupWaveSurfer, stopAllIntervals]);

  // 5) handleAnswerSelect => see if correct => end round
  const handleAnswerSelect = useCallback(
    (ans) => {
      console.log("PlayTab-> handleAnswerSelect =>", ans);
      const { roundEnded, correct } = scoringAnswerSelect(ans);

      if (roundEnded) {
        setRoundOver(true);
        stopAudio();
        // If you want a "Correct => ..." console log or message:
        if (correct) {
          console.log("PlayTab-> Correct => NICE job!");
        } else {
          console.log("PlayTab-> forced zero => Round Over!");
        }
      }
    },
    [scoringAnswerSelect, stopAudio]
  );

  // 6) doNextSong => proceed to next
  const doNextSong = useCallback(() => {
    console.log("PlayTab-> doNextSong");
    setRoundOver(false);
    handleNextSong();
  }, [handleNextSong]);

  // 7) clickPlaySong => waveSurfer snippet
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

  // 8) Init round on mount or whenever index changes
  useEffect(() => {
    initRound(currentIndex);
    return () => stopAudio();
  }, [currentIndex, initRound, stopAudio]);

// 9) Build answers on currentSong change
useEffect(() => {
  if (!currentSong) return;
  const correctArtist = currentSong.ArtistMaster || "";

  getDistractors(correctArtist, config, 3)
    .then((distractors) => {
      // Combine correct + distractors and shuffle
      const finalAnswers = shuffleArray([correctArtist, ...distractors]);
      setAnswers(finalAnswers);
    })
    .catch((err) => {
      console.error("Error in getDistractors:", err);
      setAnswers([correctArtist]); // fallback
    });
}, [currentSong, config, setAnswers]);

  // A) timePercent for progress bar
  const timePercent = (timeElapsed / timeLimit) * 100;

  // B) Helper => performance text
  const getPerformanceMessage = () => {
    const pct = (roundScore / maxScore) * 100;
    if (pct >= 80) return "Excellent job!";
    if (pct >= 50) return "Great work!";
    if (pct >= 20) return "Not bad!";
    if (pct > 1)  return "Just Barely.";
    return "You'll get the next one!";
  };

  // C) If final => summary screen
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

  // D) Render the quiz UI
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

      <RoundProgress
        totalRounds={numSongs}
        currentRound={currentIndex}
      />
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

      {/* "Play Song" button */}
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

      {/* If roundOver => performance + Next + Cancel */}
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
              stopAudio();
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
    </Box>
  );
}

PlayTab.propTypes = {
  songs: PropTypes.arrayOf(
    PropTypes.shape({
      SongID: PropTypes.string,
      AudioUrl: PropTypes.string.isRequired,
      ArtistMaster: PropTypes.string.isRequired,
    })
  ).isRequired,
  config: PropTypes.object.isRequired,
  onCancel: PropTypes.func.isRequired,
};
