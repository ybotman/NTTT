"use client";

import { useState, useRef, useCallback } from "react";

/**
 * Provide time & scoring logic for the Artist Quiz.
 * The parent owns 'roundOver' and waveSurfer stop,
 * but we manage time/score intervals.
 */
export default function useArtistQuizScoring({
  timeLimit,
  maxScore,
  WRONG_PENALTY,
  INTERVAL_MS,
  onTimesUp,     // parent callback when time is up
  getGoPhrase,   // optional
  songs,
}) {
  // Round & Session states
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentSong, setCurrentSong]   = useState(null);
  const [isPlaying,   setIsPlaying]     = useState(false);

  const [answers, setAnswers]           = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [wrongAnswers,  setWrongAnswers]    = useState([]);

  const [timeElapsed, setTimeElapsed]   = useState(0);
  const [roundScore,  setRoundScore]    = useState(maxScore);

  const [sessionScore, setSessionScore] = useState(0);
  const [showFinalSummary, setShowFinalSummary] = useState(false);
  const [roundStats, setRoundStats]     = useState([]);

  // Interval refs
  const decrementIntervalRef = useRef(null);
  const timeIntervalRef      = useRef(null);

  // initRound
  const initRound = useCallback(
    async (idx) => {
      if (!songs || idx >= songs.length) return;

      setCurrentIndex(idx);
      setCurrentSong(songs[idx]);
      setSelectedAnswer(null);
      setWrongAnswers([]);
      setRoundScore(maxScore);
      setTimeElapsed(0);
      setIsPlaying(false);

      if (getGoPhrase) {
        const phrase = await getGoPhrase();
        // you could store or log the phrase, if needed
      }
    },
    [songs, maxScore, getGoPhrase]
  );

  // stopAllIntervals
  const stopAllIntervals = useCallback(() => {
    if (decrementIntervalRef.current) {
      clearInterval(decrementIntervalRef.current);
      decrementIntervalRef.current = null;
    }
    if (timeIntervalRef.current) {
      clearInterval(timeIntervalRef.current);
      timeIntervalRef.current = null;
    }
  }, []);

  // handleAnswerSelect => return { roundEnded, correct }
  const handleAnswerSelect = (ans) => {
    if (!currentSong || !isPlaying) {
      return { roundEnded: false, correct: false };
    }
    setSelectedAnswer(ans);

    const correctArtist = (currentSong.ArtistMaster || "").trim().toLowerCase();
    const guess = ans.trim().toLowerCase();
    const isCorrect = guess === correctArtist;

    if (isCorrect) {
      stopAllIntervals();
      setSessionScore((old) => old + Math.max(roundScore, 0));
      setRoundStats((old) => [
        ...old,
        { timeUsed: timeElapsed, distractorsUsed: wrongAnswers.length },
      ]);
      return { roundEnded: true, correct: true };
    } else {
      // Wrong => penalize
      setWrongAnswers((old) => [...old, ans]);
      const newVal = Math.max(roundScore - roundScore * WRONG_PENALTY, 0);
      setRoundScore(newVal);

      if (newVal <= 0) {
        stopAllIntervals();
        setRoundStats((old) => [
          ...old,
          { timeUsed: timeElapsed, distractorsUsed: wrongAnswers.length + 1 },
        ]);
        return { roundEnded: true, correct: false };
      } else {
        // let them guess again
        return { roundEnded: false, correct: false };
      }
    }
  };

  // startIntervals => time & score countdown
  const startIntervals = useCallback(() => {
    decrementIntervalRef.current = setInterval(() => {
      setRoundScore((old) => Math.max(old - maxScore / (timeLimit * 10), 0));
    }, INTERVAL_MS);

    timeIntervalRef.current = setInterval(() => {
      setTimeElapsed((old) => {
        const nextVal = old + 0.1;
        if (nextVal >= timeLimit) {
          stopAllIntervals();
          if (onTimesUp) onTimesUp();
        }
        return nextVal;
      });
    }, INTERVAL_MS);
  }, [maxScore, timeLimit, INTERVAL_MS, onTimesUp, stopAllIntervals]);

  // handleNextSong => proceed or final
  const handleNextSong = useCallback(() => {
    const nextIndex = currentIndex + 1;
    if (!songs || nextIndex >= songs.length) {
      setShowFinalSummary(true);
      return;
    }
    initRound(nextIndex);
  }, [currentIndex, songs, initRound]);

  return {
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
  };
}
