//------------------------------------------------------------
// src/contexts/ScoreContext.js
//------------------------------------------------------------
"use client";
import React, { createContext, useState } from "react";
import PropTypes from "prop-types";

export const ScoreContext = createContext({
  sessionScore: 0,
  setSessionScore: () => {},
});

export function ScoreProvider({ children }) {
  const [sessionScore, setSessionScore] = useState(0);
  return (
    <ScoreContext.Provider value={{ sessionScore, setSessionScore }}>
      {children}
    </ScoreContext.Provider>
  );
}

ScoreProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
