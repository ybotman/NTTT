// ------------------------------------------------------------
// src/app/contexts/GameContext.js
// ------------------------------------------------------------

import React, { createContext, useContext, useState, useEffect } from "react";
import PropTypes from "prop-types";

const GameContext = createContext(null);

export function useGameContext() {
  return useContext(GameContext);
}

export function GameProvider({ children }) {
  console.log("GameProvider children:", children);

  // 1) Game config (with null defaults where relevant)
  const [config, setConfig] = useState({
    numSongs: null,
    timeLimit: null,
    levels: [],
    styles: {},
    artists: [],
    periods:[],
    validConfig: false,
  });
  
  console.log("GameProvider config:", config);  


  // 2) Score/Usage tracking
  const [currentScore, setCurrentScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [completedGames, setCompletedGames] = useState(0);
  const [filteredArtists, setFilteredArtists] = useState([]);

  // -- Load from local storage on first mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("artistLearn_config");
        if (saved) {
          const parsed = JSON.parse(saved);
          // Merge with defaults if needed
          setConfig((prev) => ({
            ...prev,
            ...parsed,
          }));
        }
      } catch (err) {
        console.warn("Could not load local config:", err);
      }
    }
  }, []);

  // -- Save to local storage whenever config changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("artistLearn_config", JSON.stringify(config));
    }
  }, [config]);

  // 3) Config setter
  function updateConfig(key, value) {
    setConfig((prev) => ({ ...prev, [key]: value }));
    console.log(" - Updated Config:", key, value);
  }

  // 3a) **NEW**: Provide a setter for filteredArtists
  function updateFilteredArtists(arr) {
    setFilteredArtists(arr || []);
    console.log(" - Updated filteredArtists:", arr);
  }

  // 4) Game completion logic (increment scores, track best, etc.)
  function completeGame(finalScore) {
    setCurrentScore(finalScore);

    // Update total & best
    setTotalScore((old) => old + finalScore);
    setBestScore((old) => (finalScore > old ? finalScore : old));

    // Increment completedGames
    setCompletedGames((old) => old + 1);
  }

  // 5) Reset everything
  function resetAll() {
    setConfig({
      numSongs: null,
      timeLimit: null,
      levels: [],
      styles: {},
      artists: [],
    });
    setCurrentScore(0);
    setBestScore(0);
    setTotalScore(0);
    setCompletedGames(0);
    setFilteredArtists([]);
  }

  // Provide everything in the context value
  const value = {
    // existing fields
    config,
    updateConfig,
    currentScore,
    setCurrentScore,
    bestScore,
    totalScore,
    completedGames,
    completeGame,
    resetAll,

    // NEW fields & functions
    filteredArtists,
    updateFilteredArtists,
  };
console.log("GameProvider value:", value);
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

GameProvider.propTypes = {
  children: PropTypes.node.isRequired,
};