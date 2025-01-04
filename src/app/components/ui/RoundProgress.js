"use client";

import React from "react";
import PropTypes from "prop-types";
import { Box, Stepper, Step, StepLabel } from "@mui/material";

/**
 * A stepped progress component, showing the total number of rounds (songs)
 * and highlighting the current round.
 *
 * @param {number} totalRounds - total number of rounds (e.g. 10 songs)
 * @param {number} currentRound - which round index we are on (0-based)
 */
export default function RoundProgress({ totalRounds, currentRound }) {
  return (
    <Box sx={{ maxWidth: 400, margin: "auto", mb: 2 }}>
      <Stepper activeStep={currentRound} alternativeLabel>
        {Array.from({ length: totalRounds }, (_, index) => (
          <Step key={index}>
            <StepLabel>{`Round ${index + 1}`}</StepLabel>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
}

RoundProgress.propTypes = {
  totalRounds: PropTypes.number.isRequired,
  currentRound: PropTypes.number.isRequired,
};
