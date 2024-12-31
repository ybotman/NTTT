//-----------------------------------------------------------------------------
// src/app/hooks/useArtistQuiz.js
//-----------------------------------------------------------------------------

import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Original default export from your snippet
 * (unchanged, plus we add the PlayTab logic below).
 */
export default function useConfig(gameName) {
  // Original local state
  const [config, setConfig] = useState({
    numSongs: 10,
    timeLimit: 15,
    levels: [1, 2],
    styles: { Tango: true, Vals: false, Milonga: false },
  });

  // On mount, try to load saved config from localStorage
  useEffect(() => {
    const savedConfig = localStorage.getItem(`${gameName}_config`);
    if (savedConfig) setConfig(JSON.parse(savedConfig));
  }, [gameName]);

  // Standard updates & save
  const updateConfig = (key, value) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const saveConfig = () => {
    localStorage.setItem(`${gameName}_config`, JSON.stringify(config));
  };

  // --------------------------------------------------------------------------
  // BELOW:  "MIGRATED" or "DUPLICATED" logic from PlayTab
  // --------------------------------------------------------------------------

  /**
   * Returns the max score for a given timeLimit (3..15):
   *   500 - ((timeLimit - 3) / 12) * 450
   */
  const calculateMaxScore = useCallback((timeLimit) => {
    const clamped = Math.min(Math.max(timeLimit, 3), 15);
    return 500 - ((clamped - 3) / 12) * 450;
  }, []);

  /**
   * Returns how much to decrement per 0.1 second
   * => maxScore / (timeLimit * 10)
   */
  const calculateDecrementPerInterval = useCallback((maxScore, timeLimit) => {
    return maxScore / (timeLimit * 10);
  }, []);

  // Wrong Answer Penalty => 5% of current
  const WRONG_PENALTY = 0.05;

  // We update time/score every 0.1s
  const INTERVAL_MS = 100;

  // For convenience, you could also replicate the fadeVolume or interval logic:
  // e.g. placeholders if you want them accessible from the hook:

  const decrementIntervalRef = useRef(null);
  const timeIntervalRef = useRef(null);

  /**
   * Example: Clears the intervals that might be running in your PlayTab
   */
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

  return {
    // Original fields
    config,
    updateConfig,
    saveConfig,

    // Duplicated logic from PlayTab
    calculateMaxScore,
    calculateDecrementPerInterval,
    WRONG_PENALTY,
    INTERVAL_MS,
    decrementIntervalRef,
    timeIntervalRef,
    clearIntervals,
  };
}
