// src/components/ui/GameScoreCurrent.jsx

"use client";

import React, { useState, useRef } from "react";
import PropTypes from "prop-types";
import {
  Box,
  IconButton,
  Popover,
  Typography,
  Button,
  Paper,
} from "@mui/material";
import AssessmentIcon from "@mui/icons-material/Assessment"; // Example "score" icon

/**
 * A small icon that, when clicked, shows a popover with game scores & a reset button.
 */
export default function GameScoreCurrent({
  bestScore,
  totalScore,
  completedGames,
  onReset,
}) {
  // Anchor for the popover
  const [anchorEl, setAnchorEl] = useState(null);

  // Handle open/close
  const handleOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  return (
    <>
      {/* Icon to toggle popover */}
      <IconButton
        onClick={handleOpen}
        sx={{
          color: "var(--accent)",
          // optional: position it absolutely in the corner, etc.
          // position: "absolute",
          // top: "1rem",
          // right: "1rem",
        }}
      >
        <AssessmentIcon />
      </IconButton>

      {/* The popover that shows the scores & reset */}
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
      >
        <Paper
          sx={{
            p: 2,
            backgroundColor: "var(--background)",
            color: "var(--foreground)",
            minWidth: "120px",
          }}
        >
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Best Score:</strong> {bestScore}
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Total Score:</strong> {totalScore}
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Games:</strong> {completedGames}
          </Typography>
          <Button
            variant="outlined"
            size="small"
            onClick={() => {
              handleClose();
              if (onReset) onReset();
            }}
            sx={{
              color: "var(--foreground)",
              borderColor: "var(--foreground)",
              fontSize: "0.75rem",
              padding: "2px 6px",
              minWidth: 0,
            }}
          >
            Reset
          </Button>
        </Paper>
      </Popover>
    </>
  );
}

GameScoreCurrent.propTypes = {
  bestScore: PropTypes.number.isRequired,
  totalScore: PropTypes.number.isRequired,
  completedGames: PropTypes.number.isRequired,
  onReset: PropTypes.func.isRequired,
};
