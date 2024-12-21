//--------
//src/app/games/artist-quiz/PlayTab.js
//--------

"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import PropTypes from "prop-types";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Stack,
  Button,
  Snackbar,
  Alert,
} from "@mui/material";
import WaveSurfer from "wavesurfer.js";
import styles from "./styles.module.css";
import { calculateMaxScore, calculateDecrementPerInterval } from "@/utils/scoring";
import { shuffleArray, getDistractors } from "@/utils/dataFetching";

// Constants
const INTERVAL_MS = 100; // 0.1 second interval
const MAX_PLAY_DURATION = 10; // 10 seconds snippet
const WRONG_PENALTY = 0.05; // 5% penalty per wrong guess

export default function PlayTab({ songs, config, onCancel }) {
  const wavesurferRef = useRef(null);
  const decrementIntervalRef = useRef(null);
  const timeIntervalRef = useRef(null);
  const fadeIntervalRef = useRef(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [wrongAnswers, setWrongAnswers] = useState([]); // Track which answers are guessed wrong
  const [roundOver, setRoundOver] = useState(false);
  const [sessionScore, setSessionScore] = useState(0);
  const [randomStart, setRandomStart] = useState(0);

  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const timeLimit = config.timeLimit ?? 15;
  const numSongs = config.numSongs ?? 10;

  const maxScore = calculateMaxScore(timeLimit);
  const decrementPerInterval = calculateDecrementPerInterval(maxScore, timeLimit);

  // Initialize the round
  const loadRound = useCallback(() => {
    if (currentIndex >= songs.length || currentIndex < 0) {
      // No more songs, session might end
      return;
    }
    const song = songs[currentIndex];
    setCurrentSong(song);
    setTimeElapsed(0);
    setSelectedAnswer(null);
    setWrongAnswers([]);
    setRoundOver(false);
    setIsPlaying(false);

    // Random snippet start
    const startT = Math.floor(Math.random() * 90);
    setRandomStart(startT);

    // Reset score for new round
    setScore(maxScore);
  }, [songs, currentIndex, maxScore]);

  useEffect(() => {
    if (songs.length > 0) {
      loadRound();
    }
  }, [songs, loadRound]);

  const clearIntervals = useCallback(() => {
    if (decrementIntervalRef.current) {
      clearInterval(decrementIntervalRef.current);
      decrementIntervalRef.current = null;
    }
    if (timeIntervalRef.current) {
      clearInterval(timeIntervalRef.current);
      timeIntervalRef.current = null;
    }
  }, []);

  const stopAudio = useCallback(() => {
    if (wavesurferRef.current) {
      wavesurferRef.current.stop();
    }
    setIsPlaying(false);
    clearIntervals();
  }, [clearIntervals]);

  const endRoundDueToTime = useCallback(() => {
    // Time ended
    setRoundOver(true);
    setSessionScore((prev) => prev + Math.max(score, 0));
    setSnackbarMessage(`Time's up! Correct artist: ${currentSong?.ArtistMaster || "Unknown"}`);
    setOpenSnackbar(true);
  }, [currentSong, score]);

  // Start intervals for scoring/time
  const beginScoring = useCallback(() => {
    decrementIntervalRef.current = setInterval(() => {
      setScore((prev) => {
        const next = prev - decrementPerInterval;
        return next <= 0 ? 0 : next;
      });
    }, INTERVAL_MS);

    timeIntervalRef.current = setInterval(() => {
      setTimeElapsed((prev) => {
        const next = prev + 0.1;
        if (next >= MAX_PLAY_DURATION) {
          stopAudio();
          endRoundDueToTime();
        }
        return next;
      });
    }, INTERVAL_MS);
  }, [decrementPerInterval, endRoundDueToTime, stopAudio]);

  // Audio initialization
  const fadeInVolume = useCallback((ws, durationSec, callback) => {
    const steps = 15;
    const stepTime = (durationSec * 1000) / steps;
    let currentStep = 0;
    const volumeStep = 1.0 / steps;
    let currentVol = 0;

    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
    }

    fadeIntervalRef.current = setInterval(() => {
      currentStep++;
      currentVol += volumeStep;
      ws.setVolume(Math.min(currentVol, 1));
      if (currentStep >= steps) {
        clearInterval(fadeIntervalRef.current);
        fadeIntervalRef.current = null;
        if (callback) callback();
      }
    }, stepTime);
  }, []);

  const handleAnswerSelect = (answer) => {
    if (roundOver) return; // Round ended
    if (selectedAnswer === answer) return; // Already chosen
    setSelectedAnswer(answer);

    const correct = currentSong.ArtistMaster.trim().toLowerCase() === answer.trim().toLowerCase();
    if (correct) {
      // Correct guess
      stopAudio();
      setRoundOver(true);
      setSessionScore((prev) => prev + Math.max(score, 0));
      setSnackbarMessage(`Correct! Artist: ${currentSong.ArtistMaster}`);
      setOpenSnackbar(true);
    } else {
      // Wrong guess
      setWrongAnswers((prev) => [...prev, answer]); 
      setScore((prev) => {
        const newScore = Math.max(prev - prev * WRONG_PENALTY, 0);
        if (newScore <= 0) {
          stopAudio();
          setRoundOver(true);
          setSnackbarMessage(`Score is 0. Correct was: ${currentSong.ArtistMaster}`);
          setOpenSnackbar(true);
        }
        return newScore;
      });
    }
  };

  const getPerformanceMessage = () => {
    const pct = (score / maxScore) * 100;
    if (pct >= 80) return "Excellent job!";
    if (pct >= 50) return "Great work!";
    if (pct >= 20) return "Not bad!";
    if (pct > 1) return "Just Barely.";
    return "You'll get the next one!";
  };

  const handleNextSong = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= numSongs || nextIndex >= songs.length) {
      // session ends
      console.log("Session Over. Total Score:", sessionScore + Math.max(score, 0));
      onCancel();
      return;
    }
    setCurrentIndex(nextIndex);
    setOpenSnackbar(false);
    loadRound();
  };

  // Setup WaveSurfer
  useEffect(() => {
    if (!currentSong) return;

    const ws = WaveSurfer.create({
      container: document.createElement("div"),
      waveColor: "transparent",
      progressColor: "transparent",
      barWidth: 0,
      height: 0,
      backend: "WebAudio",
      volume: 0,
    });

    ws.on("ready", () => {
      const dur = ws.getDuration();
      const maxStart = dur * 0.75;
      const startPos = Math.min(randomStart, maxStart);
      ws.seekTo(startPos / dur);

      ws.play()
        .then(() => {
          fadeInVolume(ws, 0.75, () => {
            setIsPlaying(true);
            beginScoring();
          });
        })
        .catch((err) => {
          console.error("Error playing audio:", err);
          handleNextSong();
        });
    });

    ws.on("error", (err) => {
      console.error("Wavesurfer error:", err);
      handleNextSong();
    });

    ws.load(currentSong.AudioUrl);
    wavesurferRef.current = ws;

    return () => {
      if (ws) ws.destroy();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSong]);

  // Build distractors for each new song
  useEffect(() => {
    if (!currentSong) return;
    const allArtists = songs.map((s) => s.ArtistMaster).filter((a) => a && a.trim() !== "");
    const uniqueArtists = Array.from(new Set(allArtists)).map((artistName) => ({ artist: artistName }));
    const correctArtist = currentSong.ArtistMaster;
    const distractors = getDistractors(correctArtist, uniqueArtists);
    const finalAnswers = shuffleArray([correctArtist, ...distractors]);
    setAnswers(finalAnswers);
  }, [currentSong, songs]);

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
      <Typography variant="h5" sx={{ marginBottom: "1rem", textAlign:"center", fontWeight:"bold" }}>
        Identify the Artist
      </Typography>

      {(!currentSong || songs.length === 0) ? (
        <Typography>No songs. Adjust configuration and try again.</Typography>
      ) : (
        <>
          <Typography variant="h6" sx={{ mb: 2, textAlign:'center' }}>
            Time: {timeElapsed.toFixed(1)}s of {timeLimit}s | Score: {Math.floor(score)}/{Math.floor(maxScore)}
          </Typography>

          <Typography variant="body1" sx={{ mb:2, textAlign:"center" }}>
            Pick the correct artist:
          </Typography>

          <List sx={{ mb:2, maxWidth:"400px", margin:"auto" }}>
            {answers.map((ans) => {
              const correct = currentSong.ArtistMaster.trim().toLowerCase() === ans.trim().toLowerCase();
              const chosen = selectedAnswer === ans;
              const isWrong = wrongAnswers.includes(ans);

              // Button styling logic
              let borderStyle = "1px solid var(--border-color)";
              if (roundOver && chosen && correct) borderStyle = "2px solid green";
              else if (chosen && correct) borderStyle = "2px solid green";
              else if (isWrong) borderStyle = "2px solid red";

              return (
                <ListItem
                  key={ans}
                  button="true"
                  onClick={() => handleAnswerSelect(ans)}
                  disabled={roundOver || isWrong || (chosen && correct)}
                  sx={{
                    mb:1,
                    border: borderStyle,
                    borderRadius:"4px",
                    "&:hover": { background:"var(--input-bg)" },
                  }}
                >
                  <ListItemText
                    primary={<Typography sx={{ color:"var(--foreground)" }}>{ans}</Typography>}
                  />
                </ListItem>
              );
            })}
          </List>

          {roundOver && (
            <Box sx={{ mt:3, textAlign:"center" }}>
              <Typography variant="h5" gutterBottom>
                {score <= 0 
                  ? `No Score This Round. Correct: ${currentSong.ArtistMaster}`
                  : `${getPerformanceMessage()} Score: ${Math.floor(score)}`}
              </Typography>
              <Typography variant="body1" gutterBottom>
                Session Total: {Math.floor(sessionScore)}
              </Typography>
              <Button
                variant="contained"
                color="secondary"
                onClick={handleNextSong}
                sx={{ mr:2 }}
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

      {/* Snackbar for correct answer or time-out message */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={4000}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setOpenSnackbar(false)}
          severity="info"
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
      SongTitle: PropTypes.string,
      ArtistMaster: PropTypes.string.isRequired,
      AudioUrl: PropTypes.string.isRequired,
      Style: PropTypes.string,
      Year: PropTypes.string,
      Composer: PropTypes.string,
      Alternative: PropTypes.string,
      Candombe: PropTypes.string,
      Cancion: PropTypes.string,
      Singer: PropTypes.string,
      level: PropTypes.number,
    })
  ).isRequired,
  config: PropTypes.shape({
    numSongs: PropTypes.number,
    timeLimit: PropTypes.number,
    levels: PropTypes.arrayOf(PropTypes.number),
    styles: PropTypes.objectOf(PropTypes.bool),
  }).isRequired,
  onCancel: PropTypes.func.isRequired,
};
