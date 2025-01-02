// -------------------------------------------
// src/app/hooks/useArtistQuizScoring.js
// -------------------------------------------
"use client";

import { useState, useRef, useCallback } from "react";

/**
 * Provide time & scoring logic for Artist Quiz.
 * 
 * @param {object} options
 * @param {number} options.timeLimit     - e.g. 15 seconds
 * @param {number} options.maxScore      - e.g. 500
 * @param {number} options.WRONG_PENALTY - e.g. 0.05
 * @param {number} options.INTERVAL_MS   - e.g. 100
 * @param {function} options.onTimesUp   - callback if time fully expires
 * @param {function} options.onEndOfGame - callback if we run out of songs
 */
export default function useArtistQuizScoring({
  timeLimit,
  maxScore,
  WRONG_PENALTY,
  INTERVAL_MS,
  onTimesUp,
  onEndOfGame,
}) {
  // -----------------------------
  // States for round
  // -----------------------------
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [roundScore, setRoundScore]   = useState(maxScore);
  const [roundOver, setRoundOver]     = useState(false);

  // -----------------------------
  // States for entire session
  // -----------------------------
  const [sessionScore, setSessionScore]       = useState(0);
  const [showFinalSummary, setShowFinalSummary] = useState(false);

  // Each round’s stats => { timeUsed, distractorsUsed }
  const [roundStats, setRoundStats] = useState([]);

  // Refs for intervals
  const decrementIntervalRef = useRef(null);
  const timeIntervalRef      = useRef(null);

  // -------------------------------------------------------
  // 1) startIntervals => begin the time & score countdown
  // -------------------------------------------------------
  const startIntervals = useCallback(() => {
    // Score decrement
    decrementIntervalRef.current = setInterval(() => {
      setRoundScore((old) => {
        // Decrement by maxScore/(timeLimit*10) every 0.1s
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
  // 2) stopAllIntervals => clear the intervals
  // -------------------------------------------------------
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

  // -------------------------------------------------------
  // 3) handleAnswer => user picks an answer
  //    (Alternatively, you might handle this logic in PlayTab.)
  // -------------------------------------------------------
  const handleAnswer = useCallback(
    (isCorrect, numberWrongSoFar, timeUsed) => {
      // 1) stop intervals
      stopAllIntervals();
      setRoundOver(true);

      // 2) if correct => add leftover roundScore to session
      if (isCorrect) {
        setSessionScore((old) => old + Math.max(roundScore, 0));

        // record stats => timeUsed, distractorsUsed
        setRoundStats((old) => [
          ...old,
          { timeUsed, distractorsUsed: numberWrongSoFar },
        ]);
      } else {
        // wrong => do the penalty logic
        setRoundScore((oldVal) => {
          const newVal = Math.max(oldVal - oldVal * WRONG_PENALTY, 0);
          // if that zeroed => also record stats
          if (newVal <= 0) {
            setSessionScore((prev) => prev + 0);
            setRoundStats((oldStats) => [
              ...oldStats,
              { timeUsed, distractorsUsed: numberWrongSoFar + 1 },
            ]);
          }
          return newVal;
        });
      }
    },
    [stopAllIntervals, roundScore, WRONG_PENALTY]
  );

  // -------------------------------------------------------
  // 4) handleTimeUp => explicitly sets roundOver + sessionScore
  // -------------------------------------------------------
  const handleTimeUp = useCallback(
    (timeUsed, numberWrongSoFar) => {
      stopAllIntervals();
      setRoundOver(true);

      // leftover roundScore => session
      setSessionScore((old) => old + Math.max(roundScore, 0));

      // record stats
      setRoundStats((old) => [
        ...old,
        { timeUsed, distractorsUsed: numberWrongSoFar },
      ]);
    },
    [stopAllIntervals, roundScore]
  );

  // -------------------------------------------------------
  // 5) handleNextSong => proceed or end
  // -------------------------------------------------------
  const handleNextSong = useCallback(
    (currentIndex, totalSongs) => {
      // reset round
      setRoundOver(false);
      setTimeElapsed(0);
      setRoundScore(maxScore);

      const nextIndex = currentIndex + 1;
      if (nextIndex >= totalSongs) {
        // no more => final
        setShowFinalSummary(true);
        if (onEndOfGame) onEndOfGame();
      }
    },
    [maxScore, onEndOfGame]
  );

  // Return **all** states & setStates used in PlayTab
  return {
    // Round states
    timeElapsed,
    setTimeElapsed,
    roundScore,
    setRoundScore,
    roundOver,
    setRoundOver,

    // Session states
    sessionScore,
    setSessionScore,
    showFinalSummary,
    setShowFinalSummary,
    roundStats,
    setRoundStats,

    // Interval logic
    startIntervals,
    stopAllIntervals,

    // Helpers
    handleAnswer,
    handleTimeUp,
    handleNextSong,
  };
}