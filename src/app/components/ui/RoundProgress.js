//src/app/components/ui/RoundProgress.js

"use client";

import React from "react";
import PropTypes from "prop-types";
import { Box } from "@mui/material";

/**
 * Displays a row of dashes representing total rounds, with colors indicating progress:
 * - Completed rounds ( < currentRound ) : green
 * - Current round ( === currentRound )  : blue with optional shimmer
 * - Remaining rounds ( > currentRound ) : grey
 *
 * @param {number} totalRounds - total number of rounds (e.g. 10)
 * @param {number} currentRound - which round index we are on (0-based)
 * @param {number} dashWidth - optional dash width (px)
 * @param {number} dashHeight - optional dash height (px)
 */
export default function RoundProgress({
  totalRounds,
  currentRound,
  dashWidth = 4,
  dashHeight = 24,
}) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: 1,
        // Example of breakpoints for responsive dash sizing
        // You can further refine dashWidth/dashHeight based on breakpoints.
      }}
    >
      {Array.from({ length: totalRounds }, (_, index) => {
        const isCompleted = index < currentRound;
        const isCurrent = index === currentRound;

        let dashColor = "grey";
        if (isCompleted) dashColor = "green";
        if (isCurrent) dashColor = "blue";

        return (
          <Box
            key={index}
            sx={{
              width: dashWidth,
              height: dashHeight,
              backgroundColor: dashColor,
              borderRadius: 1,
              // Optional shimmer animation for current round
              animation: isCurrent
                ? "shimmer 1.5s ease-in-out infinite"
                : "none",
              "@keyframes shimmer": {
                "0%": { opacity: 0.6 },
                "50%": { opacity: 1 },
                "100%": { opacity: 0.6 },
              },
            }}
          />
        );
      })}
    </Box>
  );
}

RoundProgress.propTypes = {
  totalRounds: PropTypes.number.isRequired,
  currentRound: PropTypes.number.isRequired,
  dashWidth: PropTypes.number,
  dashHeight: PropTypes.number,
};
