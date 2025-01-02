"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useGameContext } from "@/contexts/GameContext";

/**
 * Provide quiz-specific logic: validation, distractors, scoring functions, etc.
 */
export default function useArtistQuiz() {
  // 1) Access global config from GameContext
  const { config, updateConfig } = useGameContext();

  // 2) Local state for UI
  const [artistOptions, setArtistOptions] = useState([]);
  const [primaryStyles, setPrimaryStyles] = useState([]);
  const [validationMessage, setValidationMessage] = useState("");
  const hasFetchedDataRef = useRef(false);

  // -----------------------
  // A) Validation
  // -----------------------
  const validateInputs = useCallback(
    (c) => {
      const theConfig = c || config;
      const numSongs = theConfig.numSongs ?? 10;
      if (numSongs < 3 || numSongs > 25) {
        return "Number of Songs must be between 3 and 25.";
      }

      const timeLimit = theConfig.timeLimit ?? 15;
      if (timeLimit < 3 || timeLimit > 30) {
        return "Time Limit must be between 3 and 30 seconds.";
      }

      const stylesSelected = Object.keys(theConfig.styles || {}).filter(
        (k) => theConfig.styles[k],
      );
      if (stylesSelected.length === 0) {
        return "At least one style must be selected.";
      }

      const hasLevels = (theConfig.levels || []).length > 0;
      const hasArtists = (theConfig.artists || []).length > 3;
      if (!hasLevels && !hasArtists) {
        return "You must select at least 4 Artists or one Level.";
      }
      if (hasLevels && hasArtists) {
        return "Cannot select both Artists and Levels. Clear one of them.";
      }
      return "";
    },
    [config],
  );

  // For dynamic scoring:

  const calculateMaxScore = useCallback((timeLimit) => {
    const clamped = Math.max(3, Math.min(timeLimit, 15));
    return 500 - ((clamped - 3) / 12) * 200;
  }, []);

  // Decrement per 0.1s => maxScore / (timeLimit * 10)
  const calculateDecrementPerInterval = useCallback((maxScore, timeLimit) => {
    return maxScore / (timeLimit * 10);
  }, []);

  // Wrong answer penalty => 50% (0.5)
  const WRONG_PENALTY = 0.5;

  // We update time/score in 0.1 second intervals
  const INTERVAL_MS = 100;

  // We’ll keep these Refs so PlayTab can clear intervals
  const decrementIntervalRef = useRef(null);
  const timeIntervalRef = useRef(null);

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

  // -----------------------
  // B) One-time fetch for Styles & ArtistMaster
  // -----------------------
  useEffect(() => {
    if (hasFetchedDataRef.current) return;
    hasFetchedDataRef.current = true;

    // 1) Fetch styles
    const fetchStyles = async () => {
      try {
        const styleData = await fetch(`/songData/StyleMaster.json`).then((r) =>
          r.json(),
        );
        setPrimaryStyles(styleData.primaryStyles || []);

        // if no styles set in config, default "Tango: true"
        if (!config.styles || Object.keys(config.styles).length === 0) {
          updateConfig("styles", { Tango: true });
        }
      } catch (err) {
        console.error("Error fetching StyleMaster:", err);
      }
    };

    // 2) Fetch artists
    const fetchArtists = async () => {
      try {
        const artistData = await fetch(`/songData/ArtistMaster.json`).then(
          (r) => r.json(),
        );
        const activeArtists = artistData
          .filter((a) => a.active === "true")
          .sort((a, b) => {
            const levelA = parseInt(a.level, 10);
            const levelB = parseInt(b.level, 10);
            if (levelA !== levelB) return levelA - levelB;
            return a.artist.localeCompare(b.artist);
          })
          .map((artist) => ({
            label: `${artist.artist} (Level ${artist.level})`,
            value: artist.artist,
          }));
        setArtistOptions(activeArtists);
      } catch (err) {
        console.error("Error fetching ArtistMaster:", err);
      }
    };

    fetchStyles();
    fetchArtists();
  }, [config.styles, updateConfig]);

  // -----------------------
  // C) Re-validate on every config change
  // -----------------------
  useEffect(() => {
    const error = validateInputs(config);
    setValidationMessage(error);
    // Also store overall validity in config if you wish
    // updateConfig("validConfig", !error);
  }, [config, validateInputs]);

  // -----------------------
  // D) Helper: getDistractors
  //    Given the correct artist + a pool, returns 3 random, distinct from correct
  // -----------------------
  const getDistractors = useCallback((correctArtist, pool) => {
    // We want 3 unique artists that are not the correct one
    const filtered = pool.filter((a) => a !== correctArtist);
    // shuffle & pick 3
    for (let i = filtered.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [filtered[i], filtered[j]] = [filtered[j], filtered[i]];
    }
    return filtered.slice(0, 3);
  }, []);

  // -----------------------
  // E) Handlers for config changes
  // -----------------------
  const handleNumSongsChange = (val) => updateConfig("numSongs", val);
  const handleTimeLimitChange = (val) => updateConfig("timeLimit", val);

  const handleLevelsChange = (newLevels) => {
    if ((config.artists || []).length > 0 && newLevels.length > 0) {
      setValidationMessage(
        "Levels not available when artists are selected. Clear artists first.",
      );
      return;
    }
    updateConfig("levels", newLevels);
  };

  const handleStylesChange = (updated) => {
    updateConfig("styles", updated);
  };

  const handleArtistsChange = (arr) => {
    if (arr.length > 0 && (config.levels || []).length > 0) {
      updateConfig("levels", []);
      setValidationMessage("Clearing levels because artists are selected.");
    }
    updateConfig("artists", arr);
  };

  return {
    // Core config & error messages
    config,
    validationMessage,
    primaryStyles,
    artistOptions,

    // Exposed scoring logic
    calculateMaxScore,
    calculateDecrementPerInterval,
    WRONG_PENALTY,
    INTERVAL_MS,
    decrementIntervalRef,
    timeIntervalRef,
    clearIntervals,

    // Distractors
    getDistractors,

    // Config update handlers
    handleNumSongsChange,
    handleTimeLimitChange,
    handleLevelsChange,
    handleStylesChange,
    handleArtistsChange,
  };
}
