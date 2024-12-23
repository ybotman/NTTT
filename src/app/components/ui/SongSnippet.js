import React from "react";
import PropTypes from "prop-types";
import { Box, Typography, Slider } from "@mui/material";

export default function SongSnippet({ label, duration, lower, upper }) {
  // Avoid divide-by-zero if duration is 0 or negative
  const ratio = duration > 0 ? lower / duration : 0;

  return (
    <Box sx={{ position: "relative", width: "100%", mb: 2 }}>
      {label && (
        <Typography variant="body1" sx={{ mb: 1 }}>
          {label}
        </Typography>
      )}

      <Slider
        min={0}
        max={duration}
        value={[lower, upper]}
        disabled
        track="normal"
        valueLabelDisplay="off"
        sx={
          {
            // optional: override or style track, rail, etc.
            // "& .MuiSlider-track": { color: "blue" },
            // "& .MuiSlider-rail": { color: "lightgray" },
          }
        }
      />

      {/* 
        Absolutely-positioned text for the "Start: XXs" label.
        This places it horizontally at ratio% of the width 
        (the left edge of the snippet highlight).
      */}
      <Typography
        variant="caption"
        sx={{
          position: "absolute",
          top: "50%", // near middle of the slider's height
          transform: "translateY(-50%)", // vertically center the text
          left: `calc(${ratio * 100}% )`,
          // ^ ratio-based offset minus ~20px to shift label slightly left
          pointerEvents: "none", // so it doesn’t interfere with user clicks
        }}
      >
        {Math.round(lower)}s
      </Typography>
    </Box>
  );
}

SongSnippet.propTypes = {
  label: PropTypes.string,
  duration: PropTypes.number.isRequired, // total track length
  lower: PropTypes.number.isRequired, // snippet start
  upper: PropTypes.number.isRequired, // snippet end
};

SongSnippet.defaultProps = {
  label: "Song Snippet",
};
