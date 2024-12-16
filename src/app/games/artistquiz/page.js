//------------------------------------------------------------
// src/app/games/artistquiz/page.js (ArtistQuiz MVP)
//------------------------------------------------------------
"use client";
import React, { useState, useRef, useEffect, useCallback, useContext } from 'react';
import PropTypes from 'prop-types';
import { Box, Button, Typography, Stack, Paper } from '@mui/material';
import Image from 'next/image';
import { ScoreContext } from '@/contexts/ScoreContext';
import { fetchSongsAndArtists, getDistractors, shuffleArray } from '@/utils/dataFetching';
import { calculateMaxScore, calculateDecrementPerInterval } from '@/utils/scoring';

export default function ArtistQuizPage() {
  const { sessionScore, setSessionScore } = useContext(ScoreContext);
  const [songs, setSongs] = useState([]);
  const [artists, setArtists] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [selectedAnswer, setSelectedAnswer] = useState(null);

  const [timeElapsed, setTimeElapsed] = useState(0);
  const [timeLimit, setTimeLimit] = useState(15);
  const [numberOfSongs, setNumberOfSongs] = useState(10);
  const [songsPlayed, setSongsPlayed] = useState(0);
  const [levelsSelected, setLevelsSelected] = useState([1,2]); // from config

  const [score, setScore] = useState(0);
  const [basePoints, setBasePoints] = useState(0);
  const [quizOver, setQuizOver] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [finalMessage, setFinalMessage] = useState("");

  const [isPlaying, setIsPlaying] = useState(false);
  const [metadataLoaded, setMetadataLoaded] = useState(false);
  const [audioStartTime, setAudioStartTime] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);

  const audioRef = useRef(null);
  const scoreIntervalRef = useRef(null);
  const timerIntervalRef = useRef(null);

  useEffect(() => {
    // Load config from localStorage
    if (typeof window !== 'undefined') {
      const storedSongs = localStorage.getItem('nttt_aq_songs');
      if (storedSongs) setNumberOfSongs(Number(storedSongs));

      const storedSeconds = localStorage.getItem('nttt_aq_seconds');
      if (storedSeconds) setTimeLimit(Number(storedSeconds));

      const storedLevels = localStorage.getItem('nttt_aq_levels');
      if (storedLevels) setLevelsSelected(JSON.parse(storedLevels));
    }
  }, []);

  useEffect(() => {
    // Fetch IP and log location
    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => {
        console.log("User Location:", data.city, data.region, data.country_name);
      })
      .catch(err => console.error("Location fetch error:", err));
  }, []);

  useEffect(() => {
    let mounted = true;
    fetchSongsAndArtists().then(({ validSongs, validArtists }) => {
      if (mounted) {
        setSongs(validSongs);
        setArtists(validArtists);
      }
    });
    return () => { mounted = false; };
  }, []);

  const loadNewSong = useCallback(() => {
    if (songs.length === 0) return;

    if (songsPlayed >= numberOfSongs) {
      // All songs played
      finalizeQuiz();
      return;
    }

    const filteredSongs = songs.filter((s) => {
      // In a future scenario, we could filter by levels or other criteria.
      // For now, we just return all since we only have levels at the config level.
      // If we had logic for levels, we could do so if there's metadata linking levels to songs.
      return true;
    });

    if (filteredSongs.length === 0) {
      console.warn("No songs match the current criteria.");
      finalizeQuiz();
      return;
    }

    const randomIndex = Math.floor(Math.random() * filteredSongs.length);
    const song = filteredSongs[randomIndex];

    setTimeElapsed(0);
    setIsPlaying(false);
    setQuizOver(false);
    setSelectedAnswer(null);
    setFeedbackMessage("");
    setFinalMessage("");
    setMetadataLoaded(false);

    const startT = Math.floor(Math.random() * 90);
    setAudioStartTime(startT);

    const maxScore = calculateMaxScore(timeLimit);
    setBasePoints(maxScore);
    setScore(maxScore);

    setCurrentSong(song);
  }, [songs, numberOfSongs, songsPlayed, timeLimit]);

  useEffect(() => {
    if (currentSong && artists.length > 0) {
      const candidateArtist = currentSong.ArtistMaster && currentSong.ArtistMaster.trim() !== ""
        ? currentSong.ArtistMaster.trim()
        : "Unknown";

      setCorrectAnswer(candidateArtist);
      const distractors = getDistractors(candidateArtist, artists);
      const finalAnswers = shuffleArray([candidateArtist, ...distractors]);
      setAnswers(finalAnswers);
    }
  }, [currentSong, artists]);

  const handleMetadataLoaded = useCallback(() => {
    setMetadataLoaded(true);
    if (audioRef.current) {
      audioRef.current.currentTime = audioStartTime;
    }
  }, [audioStartTime]);

  const startAudio = useCallback(() => {
    if (!currentSong || !audioRef.current) return;
    const playFromStartTime = () => {
      audioRef.current.currentTime = audioStartTime;
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      });
    };
    if (metadataLoaded) {
      playFromStartTime();
    } else {
      const checkInterval = setInterval(() => {
        if (metadataLoaded && audioRef.current) {
          clearInterval(checkInterval);
          playFromStartTime();
        }
      }, 100);
    }
  }, [currentSong, metadataLoaded, audioStartTime]);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
  }, []);

  const finalizeQuiz = useCallback(() => {
    stopAudio();
    setGameStarted(false);
    setQuizOver(true);
    // Session ends here (no next song)
    console.log("All songs played. Session complete!");
  }, [stopAudio]);

  const finalizeRound = useCallback(() => {
    stopAudio();
    const finalPoints = Math.round(score);
    setSessionScore((prev) => prev + finalPoints);

    let msg = "";
    if (finalPoints > basePoints * 0.8) {
      msg = "Excellent job!";
    } else if (finalPoints > basePoints * 0.5) {
      msg = "Great work!";
    } else if (finalPoints > basePoints * 0.2) {
      msg = "Not bad!";
    } else {
      msg = "Better luck next time.";
    }
    setFinalMessage(msg);
  }, [basePoints, score, setSessionScore, stopAudio]);

  useEffect(() => {
    if (isPlaying && !quizOver && gameStarted) {
      const decrement = calculateDecrementPerInterval(basePoints, timeLimit);

      scoreIntervalRef.current = setInterval(() => {
        setScore((prev) => prev - decrement);
      }, 100);

      timerIntervalRef.current = setInterval(() => {
        setTimeElapsed((prev) => {
          const next = prev + 0.1;
          if (next >= timeLimit) {
            // Time up!
            finalizeRound();
          }
          return next;
        });
      }, 100);
    } else {
      if (scoreIntervalRef.current) {
        clearInterval(scoreIntervalRef.current);
        scoreIntervalRef.current = null;
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
    return () => {
      if (scoreIntervalRef.current) clearInterval(scoreIntervalRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isPlaying, quizOver, basePoints, timeLimit, finalizeRound, gameStarted]);

  const handleAnswerSelect = (answer) => {
    if (quizOver) return;

    const userAnswer = answer.trim().toLowerCase();
    const correct = correctAnswer.trim().toLowerCase();
    if (userAnswer === correct) {
      setSelectedAnswer(answer);
      setFeedbackMessage("Correct!");
      finalizeRound();
    } else {
      // Wrong answer penalty 5%
      const penalty = score * 0.05;
      setScore((prev) => prev - penalty);
      setSelectedAnswer(answer);
      setFeedbackMessage(`Wrong answer! -${penalty.toFixed(0)} points`);
    }
  };

  const handleNextSong = () => {
    setSongsPlayed((prev) => prev + 1);
    loadNewSong();
  };

  const handleStartGame = () => {
    setSessionScore(0);
    setSongsPlayed(0);
    setGameStarted(true);
    loadNewSong();
  };

  const timerColor = () => {
    if (timeLimit - timeElapsed <= 2) return "red";
    return "inherit";
  };

  return (
    <Box sx={{ p: 0, maxWidth: 600, margin: "auto", textAlign: "center" }}>
      <Box sx={{ position: "relative", width: "100%", mb: 2 }}>
        <Image
          src="/NTTTBanner.jpg"
          alt="NTTT Banner"
          width={600}
          height={100}
          style={{ width: "100%", height: "auto" }}
        />
      </Box>

      <Typography variant="h6" gutterBottom>
        Session Score: {Math.round(sessionScore)}
      </Typography>

      {!gameStarted && (
        <Button variant="contained" onClick={handleStartGame}>Start Artist Quiz</Button>
      )}

      {currentSong && gameStarted && (
        <>
          <audio
            ref={audioRef}
            src={currentSong.audioUrl}
            onLoadedMetadata={handleMetadataLoaded}
          />

          {!isPlaying && !quizOver && (
            <Box sx={{ mb: 2 }}>
              <Button variant="contained" color="primary" onClick={startAudio}>
                Play Song
              </Button>
              <Typography variant="caption" display="block">
                Starts at: {audioStartTime}s, Time Limit: {timeLimit}s
              </Typography>
            </Box>
          )}

          <Typography variant="h6" sx={{ mb: 2, color: timerColor() }}>
            Time: {timeElapsed.toFixed(1)}s | Current Score: {Math.round(score)}
          </Typography>

          <Typography variant="body1" sx={{ mb: 2 }}>
            Who is the Artist?
          </Typography>

          {feedbackMessage && (
            <Typography
              variant="subtitle1"
              sx={{
                mb: 2,
                color: feedbackMessage.startsWith("Wrong") ? "error.main" : "success.main",
              }}
            >
              {feedbackMessage}
            </Typography>
          )}

          <Stack spacing={2}>
            {answers.map((ans) => (
              <Button
                key={ans}
                variant={
                  selectedAnswer === ans && quizOver
                    ? ans.trim().toLowerCase() === correctAnswer.trim().toLowerCase()
                      ? "contained"
                      : "outlined"
                    : "outlined"
                }
                color={
                  selectedAnswer === ans && quizOver
                    ? ans.trim().toLowerCase() === correctAnswer.trim().toLowerCase()
                      ? "success"
                      : "error"
                    : "primary"
                }
                onClick={() => handleAnswerSelect(ans)}
                disabled={quizOver}
              >
                {ans}
              </Button>
            ))}
          </Stack>

          {quizOver && (
            <Box sx={{ mt: 3 }}>
              {songsPlayed < numberOfSongs ? (
                <>
                  <Typography variant="h5" gutterBottom>
                    Final Score for this Song: {Math.round(score)}
                  </Typography>
                  <Typography variant="h6" gutterBottom>
                    {finalMessage}
                  </Typography>
                  <Button variant="contained" color="secondary" onClick={handleNextSong}>
                    Next Song
                  </Button>
                </>
              ) : (
                <>
                  <Typography variant="h5" gutterBottom>
                    Round Score: {Math.round(score)}
                  </Typography>
                  <Typography variant="h6" gutterBottom>
                    {finalMessage}
                  </Typography>
                  <Typography variant="h6" gutterBottom>
                    No more songs! Your total session score is {Math.round(sessionScore)}.
                  </Typography>
                </>
              )}
            </Box>
          )}
        </>
      )}
    </Box>
  );
}

ArtistQuizPage.propTypes = {};