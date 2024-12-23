// src/components/ui/SongsSlider.js

import React from "react";
import PropTypes from "prop-types";
import { Slider, Box, Typography } from "@mui/material";

export default function SongsSlider({
  label,
  min,
  max,
  step,
  value,
  onChange,
  disabled,
}) {
  const handleSliderChange = (event, newValue) => {
    if (onChange) onChange(newValue);
  };

  return (
    <Box sx={{ mb: 2 }}>
      {label && (
        <Typography variant="body1" sx={{ mb: 1 }}>
          {label} ({value})
        </Typography>
      )}
      <Slider
        value={value}
        min={min}
        max={max}
        step={step}
        onChangeCommitted={handleSliderChange}
        disabled={disabled}
        valueLabelDisplay="auto"
      />
    </Box>
  );
}

SongsSlider.propTypes = {
  label: PropTypes.string,
  min: PropTypes.number,
  max: PropTypes.number,
  step: PropTypes.number,
  value: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

SongsSlider.defaultProps = {
  label: "# of Songs",
  min: 3,
  max: 25,
  step: 1,
  disabled: false,
};
