"use client";

import { useState, useRef, useCallback } from "react";

/**
 * Provide time & scoring logic for Artist Quiz,
 * but the parent owns roundOver & stopping audio.
 */
export default function useArtistQuizScoring({
  timeLimit,
  maxScore,
  WRONG_PENALTY,
  INTERVAL_MS,
  onTimesUp,     // parent decides how to handle roundOver
  onEndOfGame,   // optional
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
  const initRound = useCallback(async (idx) => {
    if (!songs || idx >= songs.length) return;
    setCurrentIndex(idx);
    setCurrentSong(songs[idx]);
    setSelectedAnswer(null);
    setWrongAnswers([]);
    setRoundScore(maxScore);
    setTimeElapsed(0);
    setIsPlaying(false);

    if (getGoPhrase) {
      const phrase = await getGoPhrase(); // ignoring
    }
  }, [songs, maxScore, getGoPhrase]);

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

  // handleAnswerSelect => returns { roundEnded, correct }
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
      // Return object so parent can set roundOver
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
        // forced zero => parent ends round
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
          // Time is up => parent sets roundOver
          stopAllIntervals();
          if (onTimesUp) onTimesUp();
        }
        return nextVal;
      });
    }, INTERVAL_MS);
  }, [maxScore, timeLimit, INTERVAL_MS, onTimesUp]);

  // handleNextSong => go to next index or end
  const handleNextSong = useCallback(() => {
    const nextIndex = currentIndex + 1;
    if (!songs || nextIndex >= songs.length) {
      setShowFinalSummary(true);
      if (onEndOfGame) onEndOfGame();
      return;
    }
    initRound(nextIndex);
  }, [currentIndex, songs, onEndOfGame, initRound]);

  return {
    currentIndex,
    currentSong,
    isPlaying, setIsPlaying,
    answers,   setAnswers,
    selectedAnswer,
    wrongAnswers,

    timeElapsed,  setTimeElapsed,
    roundScore,   setRoundScore,
    sessionScore, setSessionScore,
    showFinalSummary, setShowFinalSummary,
    roundStats,   setRoundStats,

    startIntervals,
    stopAllIntervals,
    initRound,
    handleAnswerSelect,
    handleNextSong,
  };
}