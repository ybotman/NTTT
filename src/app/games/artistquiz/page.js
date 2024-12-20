"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useContext,
} from "react";
import PropTypes from "prop-types";
import {
  Box,
  Button,
  Typography,
  Stack,
  Checkbox,
  FormGroup,
  FormControlLabel,
  TextField,
  Snackbar,
  Alert,
} from "@mui/material";
import Image from "next/image";
import { ScoreContext } from "@/contexts/ScoreContext";
import {
  fetchSongsAndArtists,
  getDistractors,
  shuffleArray,
} from "@/utils/dataFetching";
import {
  calculateMaxScore,
  calculateDecrementPerInterval,
} from "@/utils/scoring";
import { playAudio, stopAudio, getRandomStartTime } from "@/utils/audio";

export default function ArtistQuizPage() {
  const { sessionScore, setSessionScore } = useContext(ScoreContext);

  const audioRef = useRef(null);
  const timerRef = useRef(null);

  // Configuration loaded/stored here
  const [config, setConfig] = useState({
    numSongs: 10,
    timeLimit: 15,
    levels: [1, 2],
    styles: { Tango: true, Milonga: true, Vals: true },
    includeCandombe: false,
    includeAlternative: false,
  });

  // Data sets
  const [artists, setArtists] = useState([]);
  const [songs, setSongs] = useState([]);
  const [filteredSongs, setFilteredSongs] = useState([]);

  // Gameplay state
  const [playedSongs, setPlayedSongs] = useState(new Set());
  const [currentSong, setCurrentSong] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [disabledAnswers, setDisabledAnswers] = useState(new Set());

  const [score, setScore] = useState(0);
  const [maxScore, setMaxScore] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [quizOver, setQuizOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  // roundState: "ready" | "playing" | "over" | "done"
  const [roundState, setRoundState] = useState("ready");

  // For end-of-round feedback messaging
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [showSnackbar, setShowSnackbar] = useState(false);

  // Load configuration from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedAqSongs = localStorage.getItem("nttt_aq_songs");
      const storedAqSeconds = localStorage.getItem("nttt_aq_seconds");
      const storedLevels = localStorage.getItem("nttt_aq_levels");

      setConfig((prev) => ({
        ...prev,
        numSongs: storedAqSongs ? Number(storedAqSongs) : prev.numSongs,
        timeLimit: storedAqSeconds ? Number(storedAqSeconds) : prev.timeLimit,
        levels: storedLevels ? JSON.parse(storedLevels) : prev.levels,
      }));
    }
  }, []);

  // Load songs and artists once config is set/changed
  useEffect(() => {
    fetchSongsAndArtists().then(({ validSongs, validArtists }) => {
      setSongs(validSongs);
      setArtists(validArtists);
      filterSongs(validSongs);
    });
  }, [config]);

  const filterSongs = (songsToFilter) => {
    const { levels, styles, includeCandombe, includeAlternative } = config;
    const filtered = songsToFilter.filter((song) => {
      return (
        levels.includes(Number(song.level)) &&
        styles[song.Style] &&
        (includeCandombe || song.Candombe === "N") &&
        (includeAlternative || song.Alternative === "N")
      );
    });
    setFilteredSongs(filtered);
  };

  const loadNewSong = useCallback(() => {
    if (playedSongs.size >= config.numSongs || filteredSongs.length === 0) {
      // All songs done
      finalizeQuiz();
      return;
    }

    let randomSong;
    let tries = 0;
    do {
      const randomIndex = Math.floor(Math.random() * filteredSongs.length);
      randomSong = filteredSongs[randomIndex];
      tries++;
      if (tries > 1000) break; // safety break
    } while (playedSongs.has(randomSong.SongID));

    setPlayedSongs((prev) => new Set(prev).add(randomSong.SongID));
    setCurrentSong(randomSong);
    setCorrectAnswer(randomSong.ArtistMaster);

    const distractors = getDistractors(randomSong.ArtistMaster, artists);
    const allAnswers = shuffleArray([randomSong.ArtistMaster, ...distractors]);
    setAnswers(allAnswers);

    const mScore = calculateMaxScore(config.timeLimit);
    setMaxScore(mScore);
    setScore(mScore);
    setTimeElapsed(0);
    setSelectedAnswer(null);
    setDisabledAnswers(new Set());
    setQuizOver(false);
    setFeedbackMessage("");
    setRoundState("ready");
  }, [filteredSongs, playedSongs, config, artists]);

  const handleStartGame = () => {
    setSessionScore(0);
    setPlayedSongs(new Set());
    setGameStarted(true);
    loadNewSong();
  };

  const startRound = () => {
    // Begin playback, timer
    startAudio();
    startTimer();
    setRoundState("playing");
  };

  const startAudio = () => {
    if (currentSong && audioRef.current) {
      const startTime = getRandomStartTime(90);
      audioRef.current.currentTime = startTime;
      playAudio(audioRef.current, startTime);
    }
  };

  const stopAllAudio = () => {
    if (audioRef.current) {
      stopAudio(audioRef.current);
    }
  };

  const startTimer = () => {
    stopTimer(); // Ensure no double intervals
    timerRef.current = setInterval(() => {
      setTimeElapsed((prev) => {
        const newTime = prev + 0.1;
        // Decrement score over time
        setScore((oldScore) => {
          const decrement = calculateDecrementPerInterval(
            maxScore,
            config.timeLimit,
          );
          return oldScore - decrement;
        });

        if (newTime >= config.timeLimit) {
          // Time is up
          onTimeUp();
        }
        return newTime;
      });
    }, 100);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const onTimeUp = () => {
    stopTimer();
    stopAllAudio();
    // Time out means score could be negative as well
    // End round
    finalizeRound(false);
  };

  const handleAnswerSelect = (answer) => {
    if (roundState !== "playing" || quizOver || disabledAnswers.has(answer))
      return;

    if (answer === correctAnswer) {
      // Correct
      setFeedbackMessage("Correct!");
      setSessionScore((prev) => prev + Math.round(score));
      finalizeRound(true);
    } else {
      // Wrong
      setScore((prev) => prev * 0.95); // 5% penalty
      setFeedbackMessage("Wrong!");
      setDisabledAnswers((prev) => new Set(prev).add(answer));
    }
  };

  const finalizeRound = (wasCorrect) => {
    stopTimer();
    stopAllAudio();
    setQuizOver(true);
    setRoundState("over");
    // Show feedback message based on final score fraction
    const fraction = score / maxScore;
    let message = "Better luck next time";
    if (fraction > 0.85) message = "Amazing";
    else if (fraction > 0.7) message = "Great Job";
    else if (fraction > 0.5) message = "NICE";
    else if (fraction > 0.25) message = "Got it in Time!";
    else if (fraction > 0.01) message = "Just Under There!";
    else if (fraction <= 0) message = "Better luck next time";

    setFeedbackMessage(message);
    setShowSnackbar(true);
  };

  const nextSong = () => {
    setShowSnackbar(false);
    loadNewSong();
  };

  const finalizeQuiz = () => {
    stopTimer();
    stopAllAudio();
    setGameStarted(false);
    setRoundState("done");
  };

  const closeSnackbar = () => {
    setShowSnackbar(false);
  };

  // Summary after all songs
  const renderSummary = () => {
    const fraction = sessionScore / ((config.numSongs || 10) * 500);
    // 500 max possible at best scenario
    let message = "Better luck next time";
    if (fraction > 0.85) message = "Amazing";
    else if (fraction > 0.7) message = "Great Job";
    else if (fraction > 0.5) message = "NICE";
    else if (fraction > 0.25) message = "Got it in Time!";
    else if (fraction > 0.01) message = "Just Under There!";
    else if (fraction <= 0) message = "Better luck next time";

    return (
      <Box sx={{ textAlign: "center", mt: 4 }}>
        <Typography variant="h5">Quiz Complete!</Typography>
        <Typography variant="h6">
          Your Total Score: {Math.round(sessionScore)}
        </Typography>
        <Typography variant="body1">{message}</Typography>
        <Button
          variant="contained"
          sx={{ mt: 2 }}
          onClick={() => window.location.reload()}
        >
          Return to Start
        </Button>
      </Box>
    );
  };

  return (
    <Box sx={{ p: 2, maxWidth: 600, margin: "auto", textAlign: "center" }}>
      {/* Banner */}
      <Image src="/NTTTBanner.jpg" alt="NTTT Banner" width={600} height={100} />

      <Typography variant="h6">
        Session Score: {Math.round(sessionScore)}
      </Typography>

      {!gameStarted && roundState !== "done" && (
        <>
          {/* Configuration Section */}
          <Box sx={{ my: 2, textAlign: "left" }}>
            <Typography variant="h6">
              Configuration (Loaded from Saved Config)
            </Typography>
            <Typography># of Songs: {config.numSongs}</Typography>
            <Typography>Seconds per Song: {config.timeLimit}</Typography>
            <Typography>Levels: {config.levels.join(", ")}</Typography>
            <Typography>
              Styles:{" "}
              {Object.keys(config.styles)
                .filter((s) => config.styles[s])
                .join(", ")}
            </Typography>
          </Box>
          <Button variant="contained" onClick={handleStartGame}>
            Start Artist Quiz
          </Button>
        </>
      )}

      {gameStarted && currentSong && roundState !== "done" && (
        <>
          <audio ref={audioRef} src={currentSong.audioUrl} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Who is the Artist?
          </Typography>

          {/* If roundState = ready: show answers disabled, and a "Ready to Play" button */}
          {roundState === "ready" && (
            <>
              <Stack spacing={2} sx={{ mt: 2 }}>
                {answers.map((ans) => (
                  <Button key={ans} variant="outlined" disabled>
                    {ans}
                  </Button>
                ))}
              </Stack>
              <Button variant="contained" sx={{ mt: 2 }} onClick={startRound}>
                Ready to Play
              </Button>
            </>
          )}

          {/* If roundState = playing: show answers enabled */}
          {roundState === "playing" && (
            <>
              <Stack spacing={2} sx={{ mt: 2 }}>
                {answers.map((ans) => (
                  <Button
                    key={ans}
                    variant="outlined"
                    disabled={disabledAnswers.has(ans)}
                    onClick={() => handleAnswerSelect(ans)}
                  >
                    {ans}
                  </Button>
                ))}
              </Stack>
              <Typography variant="body1" sx={{ mt: 2 }}>
                Time: {timeElapsed.toFixed(1)}s / {config.timeLimit}s
              </Typography>
              <Typography variant="body1">
                Current Score: {Math.round(score)}
              </Typography>
            </>
          )}

          {/* If roundState = over: show feedback message and next song button */}
          {roundState === "over" && (
            <>
              <Typography variant="h5" sx={{ mt: 3 }}>
                {feedbackMessage}
              </Typography>
              <Typography variant="body1">
                Score This Round: {Math.round(score)}
              </Typography>
              {playedSongs.size < config.numSongs ? (
                <Button variant="contained" sx={{ mt: 2 }} onClick={nextSong}>
                  Ready for Next
                </Button>
              ) : (
                <Button
                  variant="contained"
                  sx={{ mt: 2 }}
                  onClick={finalizeQuiz}
                >
                  View Summary
                </Button>
              )}
            </>
          )}
        </>
      )}

      {roundState === "done" && renderSummary()}

      <Snackbar
        open={showSnackbar}
        autoHideDuration={3000}
        onClose={closeSnackbar}
      >
        <Alert onClose={closeSnackbar} severity="info" sx={{ width: "100%" }}>
          {feedbackMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}

ArtistQuizPage.propTypes = {
  // no props currently
};
