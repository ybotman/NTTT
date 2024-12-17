//------------------------------------------------------------
// src/app/games/artistquiz/page.js
//------------------------------------------------------------
"use client";

import React, { useState, useRef, useEffect, useCallback, useContext } from "react";
import PropTypes from "prop-types";
import { Box, Button, Typography, Stack } from "@mui/material";
import Image from "next/image";
import { ScoreContext } from "@/contexts/ScoreContext";
import { fetchSongsAndArtists, getDistractors, shuffleArray } from "@/utils/dataFetching";
import { calculateMaxScore, calculateDecrementPerInterval } from "@/utils/scoring";
import { playAudio, stopAudio, getRandomStartTime } from "@/utils/audio";

export default function ArtistQuizPage() {
  const { sessionScore, setSessionScore } = useContext(ScoreContext);

  const [songs, setSongs] = useState([]);
  const [artists, setArtists] = useState([]);
  const [playedSongs, setPlayedSongs] = useState(new Set());

  const [currentSong, setCurrentSong] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [correctAnswer, setCorrectAnswer] = useState("");

  const [timeElapsed, setTimeElapsed] = useState(0);
  const [timeLimit, setTimeLimit] = useState(15);
  const [score, setScore] = useState(0);

  const [quizOver, setQuizOver] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [disabledAnswers, setDisabledAnswers] = useState(new Set());

  const audioRef = useRef(null);
  const scoreIntervalRef = useRef(null);
  const timerIntervalRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    fetchSongsAndArtists().then(({ validSongs, validArtists }) => {
      if (mounted) {
        setSongs(validSongs);
        setArtists(validArtists);
        console.log("Loaded Songs and Artists");
      }
    });
    return () => {
      mounted = false;
      clearIntervals();
    };
  }, []);

  const clearIntervals = () => {
    if (scoreIntervalRef.current) clearInterval(scoreIntervalRef.current);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
  };

  const loadNewSong = useCallback(() => {
    if (playedSongs.size >= songs.length) {
      finalizeQuiz();
      return;
    }

    let randomSong;
    do {
      const randomIndex = Math.floor(Math.random() * songs.length);
      randomSong = songs[randomIndex];
    } while (playedSongs.has(randomSong.SongID));

    setPlayedSongs((prev) => new Set(prev).add(randomSong.SongID));
    setCurrentSong(randomSong);

    setCorrectAnswer(randomSong.ArtistMaster);
    const distractors = getDistractors(randomSong.ArtistMaster, artists);
    setAnswers(shuffleArray([randomSong.ArtistMaster, ...distractors]));

    const maxScore = calculateMaxScore(timeLimit);
    setScore(maxScore);
    setTimeElapsed(0);
    setDisabledAnswers(new Set()); // Reset disabled answers

    stopAudio(audioRef.current);
    setIsPlaying(false);

    console.log("New Song Loaded:", randomSong.Title);
  }, [songs, playedSongs, artists, timeLimit]);

  const startAudio = useCallback(() => {
    if (currentSong && audioRef.current) {
      const startTime = getRandomStartTime(90);
      audioRef.current.currentTime = startTime;
      playAudio(audioRef.current, startTime);
      setIsPlaying(true);

      startTimer();
    }
  }, [currentSong]);

  const startTimer = () => {
    clearIntervals();
    const decrement = calculateDecrementPerInterval(score, timeLimit);

    scoreIntervalRef.current = setInterval(() => {
      setScore((prev) => Math.max(prev - decrement, 0));
    }, 100);

    timerIntervalRef.current = setInterval(() => {
      setTimeElapsed((prev) => {
        if (prev + 0.1 >= timeLimit) {
          finalizeRound();
          return timeLimit;
        }
        return prev + 0.1;
      });
    }, 100);
  };

  const finalizeRound = useCallback(() => {
    clearIntervals();
    stopAudio(audioRef.current);
    setQuizOver(true);
    setIsPlaying(false);
    console.log("Round Over. Final Score:", score);
  }, [score]);

  const handleAnswerSelect = (answer) => {
    if (quizOver || disabledAnswers.has(answer)) return;

    if (answer === correctAnswer) {
      setFeedbackMessage("Correct!");
      finalizeRound();
      setSessionScore((prev) => prev + Math.round(score));
    } else {
      setScore((prev) => prev * 0.95); // 5% penalty
      setFeedbackMessage("Wrong! -5% score penalty");
      setDisabledAnswers((prev) => new Set(prev).add(answer));
    }
  };

  const finalizeQuiz = () => {
    setGameStarted(false);
    console.log("Quiz Complete. Total Score:", sessionScore);
  };

  const handleNextSong = () => {
    setFeedbackMessage("");
    setQuizOver(false);
    loadNewSong();
  };

  const handleStartGame = () => {
    setGameStarted(true);
    setSessionScore(0);
    setPlayedSongs(new Set());
    loadNewSong();
  };

  return (
    <Box sx={{ p: 2, maxWidth: 600, margin: "auto", textAlign: "center" }}>
      <Image src="/NTTTBanner.jpg" alt="NTTT Banner" width={600} height={100} />

      <Typography variant="h6">Session Score: {Math.round(sessionScore)}</Typography>

      {!gameStarted && (
        <Button variant="contained" onClick={handleStartGame}>
          Start Artist Quiz
        </Button>
      )}

      {gameStarted && currentSong && (
        <>
          <audio ref={audioRef} src={currentSong.audioUrl} />
          {!isPlaying && !quizOver && (
            <Button variant="contained" color="primary" onClick={startAudio}>
              Play Song
            </Button>
          )}

          <Typography sx={{ mt: 2 }}>
            Time: {timeElapsed.toFixed(1)}s | Score: {Math.round(score)}
          </Typography>

          <Typography variant="h6">Who is the Artist?</Typography>

          <Stack spacing={2} sx={{ mt: 2 }}>
            {answers.map((ans) => (
              <Button
                key={ans}
                variant="outlined"
                disabled={disabledAnswers.has(ans)}
                onClick={() => handleAnswerSelect(ans)}
                sx={{
                  opacity: disabledAnswers.has(ans) ? 0.5 : 1,
                }}
              >
                {ans}
              </Button>
            ))}
          </Stack>

          {quizOver && (
            <Button variant="contained" color="secondary" onClick={handleNextSong}>
              Next Song
            </Button>
          )}
        </>
      )}
    </Box>
  );
}

ArtistQuizPage.propTypes = {};