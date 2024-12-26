//------------------------------------------------------------
// src/app/contexts/GameContext.js
//------------------------------------------------------------
"use client";

import React, { createContext, useContext, useState } from "react";
import PropTypes from "prop-types";

const GameContext = createContext(null);

export function useGameContext() {
  return useContext(GameContext);
}

export function GameProvider({ children }) {
  // Example: A game’s config settings, plus “in-progress” session details
  const [config, setConfig] = useState({
    // Example defaults
    numSongs: 10,
    timeLimit: 15,
    levels: [],
    styles: {},
  });

  // Example: Track the user’s current score or question index
  const [currentScore, setCurrentScore] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1);

  // Example: Simple update function for config
  const updateConfig = (key, value) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  // Example: Reset the game
  const resetGame = () => {
    setCurrentScore(0);
    setCurrentQuestionIndex(-1);
    // Possibly reset config to defaults or do partial resets
  };

  // Provide everything game components need
  const value = {
    config,
    updateConfig,
    currentScore,
    setCurrentScore,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    resetGame,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

GameProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
