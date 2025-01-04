"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useGameContext } from "@/contexts/GameContext";

/**
 * Provide quiz-specific logic & validations:
 *  - load styles/artists
 *  - validate config
 *  - compute scoring parameters
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

  // Basic maxScore calculation
  const calculateMaxScore = useCallback((timeLimit) => {
    // 1) Clamp time between 3 and 30
    const clamped = Math.max(3, Math.min(timeLimit, 30));

    // 2) Cubic polynomial coefficients (approx. interpolation):
    // Score(t) = a - b*t + c*t^2 - d*t^3
    // => passing near (3, 500), (9, 250), (15, 150), (30, 50)
    const a = 705.39;
    const b = 79.0;
    const c = 3.69;
    const d = 0.0595;

    // 3) Compute polynomial
    const val =
      a -
      b * clamped +
      c * (clamped ** 2) -
      d * (clamped ** 3);

    // 4) Round if you want an integer
    return Math.round(val);
  }, []);


  // Wrong answer penalty
  const WRONG_PENALTY = 0.10;
  // Interval => 100ms
  const INTERVAL_MS = 100;

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
  }, [config, validateInputs]);

  // -----------------------
  // D) Handlers for config changes
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

  // Return only what we use
  return {
    // Core config & error messages
    config,
    validationMessage,
    primaryStyles,
    artistOptions,

    // Scoring parameters
    calculateMaxScore,
    WRONG_PENALTY,
    INTERVAL_MS,

    // Config update handlers
    handleNumSongsChange,
    handleTimeLimitChange,
    handleLevelsChange,
    handleStylesChange,
    handleArtistsChange,
  };
}
