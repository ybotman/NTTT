//------------------------------------------------------------
// src/contexts/ScoreContext.js
//------------------------------------------------------------
"use client";

import React, { createContext, useState, useContext } from "react";
import PropTypes from "prop-types";

// Create the actual context
const ScoreContext = createContext({
  sessionScore: 0,
  setSessionScore: () => {},
  bestScore: 0,
  setBestScore: () => {},
  totalScore: 0,
  setTotalScore: () => {},
  completedGames: 0,
  setCompletedGames: () => {},
  resetAll: () => {},
});

// Custom hook to consume this context
export function useScoreContext() {
  return useContext(ScoreContext);
}

export function ScoreProvider({ children }) {
  // Example states:
  const [sessionScore, setSessionScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [completedGames, setCompletedGames] = useState(0);

  // Example reset function
  const resetAll = () => {
    setSessionScore(0);
    setBestScore(0);
    setTotalScore(0);
    setCompletedGames(0);
  };

  return (
    <ScoreContext.Provider
      value={{
        sessionScore,
        setSessionScore,
        bestScore,
        setBestScore,
        totalScore,
        setTotalScore,
        completedGames,
        setCompletedGames,
        resetAll,
      }}
    >
      {children}
    </ScoreContext.Provider>
  );
}

ScoreProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
