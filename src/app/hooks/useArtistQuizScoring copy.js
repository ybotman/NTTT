// -------------------------------------------
// src/app/hooks/useArtistQuizScoring.js
// -------------------------------------------
"use client";

import { useState, useRef, useCallback } from "react";

/**
 * Provide time & scoring logic for Artist Quiz,
 * plus initRound and handleAnswerSelect to unify logic.
 */
export default function useArtistQuizScoring({
  timeLimit,
  maxScore,
  WRONG_PENALTY,
  INTERVAL_MS,
  onTimesUp,
  onRoundOver,      // new callback for correct or forced-zero
  onEndOfGame,
  getGoPhrase, // pass in from usePlay if desired
  songs,       // pass in full songs array
}) {
  // -----------------------------
  // Round & Session states
  // -----------------------------
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentSong, setCurrentSong]   = useState(null);
  const [isPlaying, setIsPlaying]       = useState(false);

  const [answers, setAnswers] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [wrongAnswers, setWrongAnswers] = useState([]);

  const [timeElapsed, setTimeElapsed] = useState(0);
  const [roundScore, setRoundScore]   = useState(maxScore);
  const [roundOver, setRoundOver]     = useState(false);

  const [sessionScore, setSessionScore]       = useState(0);
  const [showFinalSummary, setShowFinalSummary] = useState(false);

  // Each round’s stats => { timeUsed, distractorsUsed }
  const [roundStats, setRoundStats] = useState([]);

  // Refs for intervals
  const decrementIntervalRef = useRef(null);
  const timeIntervalRef      = useRef(null);

  // -------------------------------------------------------
  // (A) initRound => Sets up the next round
  // -------------------------------------------------------
  const initRound = useCallback(async (idx) => {
    console.log("uAQS-Init round", idx);
    if (!songs || idx >= songs.length) return;

    // 1) reset states for new round
    setCurrentIndex(idx);
    setCurrentSong(songs[idx]);
    setSelectedAnswer(null);
    setWrongAnswers([]);
    setRoundOver(false);
    setRoundScore(maxScore);
    setTimeElapsed(0);
    setIsPlaying(false);

    // 2) If we do random "go phrase"
    if (getGoPhrase) {
      const phrase = await getGoPhrase();
    }
  }, [songs, maxScore, getGoPhrase]);
  // -------------------------------------------------------
  // (D) stopAllIntervals => clear the intervals
  // -------------------------------------------------------
  const stopAllIntervals = useCallback(() => {
    console.log("uAQS-Stopping intervals");
    if (decrementIntervalRef.current) {
      clearInterval(decrementIntervalRef.current);
      decrementIntervalRef.current = null;
    }
    if (timeIntervalRef.current) {
      clearInterval(timeIntervalRef.current);
      timeIntervalRef.current = null;
    }
  }, []);

  // -------------------------------------------------------
  // (B) handleAnswerSelect => user picks an answer
  // -------------------------------------------------------
  const handleAnswerSelect = (ans) => {
  console.log("uAQS-handleAnswerSelect", ans);
  if (!currentSong || roundOver || !isPlaying) return;

  // if (selectedAnswer === ans) return;
  setSelectedAnswer(ans);

  const correctArtist = (currentSong.ArtistMaster || "").trim().toLowerCase();
  const guess = ans.trim().toLowerCase();

  console.log("guess:", guess, " correct:", correctArtist);

  if (guess === correctArtist) {// CORRECT => finalize round
    stopAllIntervals();
    setRoundOver(true);
    setSessionScore(old => old + Math.max(roundScore, 0));
    setRoundStats(old => [
      ...old,
      { timeUsed: timeElapsed, distractorsUsed: wrongAnswers.length },
    ]);

    onRoundOver?.({ correct: true });
  } else {
    // WRONG => apply penalty
    setWrongAnswers((old) => [...old, ans]);
    const newVal = Math.max(roundScore - roundScore * WRONG_PENALTY, 0);
    setRoundScore(newVal);

    if (newVal <= 0) {
      stopAllIntervals();
      setRoundOver(true);
      onRoundOver?.({ correct: false });
      setRoundStats(old => [
        ...old,
        { timeUsed: timeElapsed, distractorsUsed: wrongAnswers.length + 1 },
      ]);
       onRoundOver?.({ correct: false });

    } else {
      // let them guess again => do not set roundOver
      //setSnackbarMessage(`Wrong guess! - Score penalized. Try again.`);
    }
  }
};


  // -------------------------------------------------------
  // (C) startIntervals => begin the time & score countdown
  // -------------------------------------------------------
  const startIntervals = useCallback(() => {
    // Score decrement

    decrementIntervalRef.current = setInterval(() => {
      setRoundScore((old) => {
        const nextVal = Math.max(
          old - (maxScore / (timeLimit * 10)),
          0
        );
        return nextVal;
      });
    }, INTERVAL_MS);

    // Time countdown
    timeIntervalRef.current = setInterval(() => {
      setTimeElapsed((old) => {
        const nextVal = old + 0.1;
        if (nextVal >= timeLimit) {
          // time is up => callback
          if (onTimesUp) onTimesUp();
        }
        return nextVal;
      });
    }, INTERVAL_MS);
  }, [maxScore, timeLimit, INTERVAL_MS, onTimesUp]);

  // -------------------------------------------------------
  // (E) handleNextSong => proceed or end
  // -------------------------------------------------------
  const handleNextSong = useCallback(() => {
    console.log("uAQS-handleNextSong");
    const nextIndex = currentIndex + 1;
    if (!songs || nextIndex >= songs.length) {
      // no more => final
      setShowFinalSummary(true);
      if (onEndOfGame) onEndOfGame();
      return;
    }
    initRound(nextIndex);
  }, [currentIndex, songs, onEndOfGame, initRound]);

  // Return your entire scoring + round data
  return {
    // Round states
    currentIndex,
    currentSong,
    isPlaying, setIsPlaying,
    answers, setAnswers,
    selectedAnswer,
    wrongAnswers,
    timeElapsed, setTimeElapsed,
    roundScore,   setRoundScore,
    roundOver,    setRoundOver,
    // Session states
    sessionScore, setSessionScore,
    showFinalSummary, setShowFinalSummary,
    roundStats,       setRoundStats,
    // Intervals
    startIntervals,
    stopAllIntervals,
    // Methods
    initRound,
    handleAnswerSelect,
    handleNextSong,

    // Optionally keep handleTimeUp etc. if needed
  };
}