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
} from "@mui/material";
import WaveSurfer from "wavesurfer.js";
import styles from "./styles.module.css";
import { calculateMaxScore, calculateDecrementPerInterval } from "@/utils/scoring";
import { shuffleArray, getDistractors } from "@/utils/dataFetching";

// Constants
const INTERVAL_MS = 100; // 0.1 second interval
const MAX_PLAY_DURATION = 10; // 10 seconds snippet

export default function PlayTab({ songs, config, onCancel }) {
  const wavesurferRef = useRef(null);
  const decrementIntervalRef = useRef(null);
  const timeIntervalRef = useRef(null);
  const fadeIntervalRef = useRef(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [metadataLoaded, setMetadataLoaded] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [roundOver, setRoundOver] = useState(false);
  const [sessionScore, setSessionScore] = useState(0);
  const [randomStart, setRandomStart] = useState(0);
  
  const [ready, setReady] = useState(false); // Indicates WaveSurfer is ready

  const timeLimit = config.timeLimit ?? 15;
  const numSongs = config.numSongs ?? 10;

  const maxScore = calculateMaxScore(timeLimit);
  const decrementPerInterval = calculateDecrementPerInterval(maxScore, timeLimit);

  const fadeVolume = useCallback((fromVol, toVol, durationSec, callback) => {
    if (!wavesurferRef.current) return;
    const steps = 15;
    const stepTime = (durationSec * 1000) / steps;
    let currentStep = 0;
    const volumeStep = (toVol - fromVol) / steps;
    let currentVol = fromVol;

    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
    }

    fadeIntervalRef.current = setInterval(() => {
      currentStep++;
      currentVol += volumeStep;
      if (wavesurferRef.current) {
        wavesurferRef.current.setVolume(Math.min(Math.max(currentVol, 0), 1));
      }

      if (currentStep >= steps) {
        clearInterval(fadeIntervalRef.current);
        fadeIntervalRef.current = null;
        if (callback) callback();
      }
    }, stepTime);
  }, []);

  const loadRound = useCallback(() => {
    if (currentIndex >= songs.length || currentIndex < 0) {
      // No more songs
      return;
    }
    const song = songs[currentIndex];
    setCurrentSong(song);
    setMetadataLoaded(false);
    setTimeElapsed(0);
    setSelectedAnswer(null);
    setRoundOver(false);
    setIsPlaying(false);
    setReady(false);

    const startT = Math.floor(Math.random() * 90);
    setRandomStart(startT);

    setScore(maxScore);
  }, [songs, currentIndex, maxScore]);

  useEffect(() => {
    if (songs.length > 0) {
      loadRound();
    }
  }, [songs, loadRound]);

  const startScoringIntervals = useCallback(() => {
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
  }, [decrementPerInterval]);

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

  const endRoundDueToTime = () => {
    setRoundOver(true);
    setSessionScore((prev) => prev + Math.max(score, 0));
  };

  const handleAnswerSelect = (answer) => {
    if (roundOver || selectedAnswer !== null) return;
    setSelectedAnswer(answer);

    const correctArtist = currentSong.ArtistMaster.trim().toLowerCase();
    const userAnswer = answer.trim().toLowerCase();
    if (userAnswer === correctArtist) {
      // Correct
      stopAudio();
      setRoundOver(true);
      setSessionScore((prev) => prev + Math.max(score, 0));
    } else {
      // Wrong, reduce score by 5%
      setScore((prev) => {
        const newScore = Math.max(prev - prev * 0.05, 0);
        if (newScore <= 0) {
          stopAudio();
          setRoundOver(true);
          setSessionScore((p) => p);
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
      console.log("Session Over. Total Score:", sessionScore);
      onCancel();
      return;
    }
    setCurrentIndex(nextIndex);
    loadRound();
  };

  useEffect(() => {
    if (!currentSong) return;

    const ws = WaveSurfer.create({
      container: document.createElement("div"),
      waveColor: "transparent",
      progressColor: "transparent",
      barWidth: 0,
      height: 0,
      backend: "WebAudio",
    });

    ws.on("ready", () => {
      setReady(true);
      const dur = ws.getDuration();
      const maxStart = dur * 0.75;
      const startPos = Math.min(randomStart, maxStart);
      ws.seekTo(startPos / dur);

      // Set volume to 0 initially
      ws.setVolume(0.0);

      ws.play().then(() => {
        // After starting play, fade in volume and start scoring/timing
        fadeVolume(0, 1, 0.75, () => {
          // Once faded in, start intervals
          setIsPlaying(true);
          startScoringIntervals();
        });
      }).catch((err) => {
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

  useEffect(() => {
    if (!currentSong) return;
    const allArtists = songs
      .map((s) => s.ArtistMaster)
      .filter((a) => a && a.trim() !== "");

    const uniqueArtists = Array.from(new Set(allArtists))
      .map((artistName) => ({ artist: artistName }));

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
      <Typography
        variant="h5"
        className={styles.h5}
        sx={{ marginBottom: "1rem", textAlign:"center", fontWeight:"bold" }}
      >
        Identify the Artist
      </Typography>

      {songs.length === 0 || !currentSong ? (
        <Typography>No songs. Adjust configuration and try again.</Typography>
      ) : (
        <>
          <Typography variant="h6" sx={{mb:2, textAlign:'center'}}>
            Time: {timeElapsed.toFixed(1)}s of {timeLimit}s | Score: {Math.floor(score)} / {Math.floor(maxScore)}
          </Typography>

          <Typography variant="body1" sx={{ mb:2, textAlign:"center"}}>
            Choose the correct artist:
          </Typography>

          <List sx={{
            mb:2,
            maxWidth:"400px",
            margin:"auto"
          }}>
            {answers.map((ans) => {
              const correct = currentSong.ArtistMaster.trim().toLowerCase() === ans.trim().toLowerCase();
              const chosen = selectedAnswer === ans;
              return (
                <ListItem
                  key={ans}
                  button="true"
                  onClick={() => handleAnswerSelect(ans)}
                  sx={{
                    mb:1,
                    border: chosen
                      ? correct
                        ? "2px solid green"
                        : "2px solid red"
                      : "1px solid var(--border-color)",
                    borderRadius:"4px",
                    '&:hover': {
                      background:"var(--input-bg)"
                    }
                  }}
                  disabled={roundOver}
                >
                  <ListItemText
                    primary={
                      <Typography sx={{ color:"var(--foreground)" }}>
                        {ans}
                      </Typography>
                    }
                  />
                </ListItem>
              );
            })}
          </List>

          {roundOver && (
            <Box sx={{mt:3, textAlign:"center"}}>
              <Typography variant="h5" gutterBottom>
                {score <= 0 ? "No Score This Round" : `${getPerformanceMessage()} Score: ${Math.floor(score)}`}
              </Typography>
              <Typography variant="body1" gutterBottom>
                Session Total: {Math.floor(sessionScore)}
              </Typography>
              <Button
                variant="contained"
                color="secondary"
                onClick={handleNextSong}
                sx={{mr:2}}
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
