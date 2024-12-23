// src/components/ui/LevelsSelector.js

import React from "react";
import PropTypes from "prop-types";
import { Box, Typography, FormControlLabel, Checkbox } from "@mui/material";

export default function LevelsSelector({
  label,
  availableLevels,
  selectedLevels,
  onChange,
  disabled,
}) {
  const handleCheck = (level, checked) => {
    if (!onChange) return;
    let newLevels = [...selectedLevels];
    if (checked && !newLevels.includes(level)) {
      newLevels.push(level);
    } else if (!checked) {
      newLevels = newLevels.filter((l) => l !== level);
    }
    onChange(newLevels);
  };

  return (
    <Box sx={{ mb: 2 }}>
      {label && (
        <Typography variant="body1" sx={{ mb: 1 }}>
          {label}
        </Typography>
      )}
      {availableLevels.map((level) => {
        const isChecked = selectedLevels.includes(level);
        return (
          <FormControlLabel
            key={level}
            control={
              <Checkbox
                checked={isChecked}
                onChange={(e) => handleCheck(level, e.target.checked)}
                disabled={disabled}
              />
            }
            label={`Level ${level}`}
          />
        );
      })}
    </Box>
  );
}

LevelsSelector.propTypes = {
  label: PropTypes.string,
  availableLevels: PropTypes.arrayOf(PropTypes.number),
  selectedLevels: PropTypes.arrayOf(PropTypes.number),
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

LevelsSelector.defaultProps = {
  label: "Select Levels:",
  availableLevels: [1, 2, 3, 4, 5],
  selectedLevels: [],
  disabled: false,
};
