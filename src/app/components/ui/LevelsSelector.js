// ------------------------------------------------------------
// src/components/ui/LevelsSelector.js
// ------------------------------------------------------------
"use client";

import React from "react";
import PropTypes from "prop-types";
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
} from "@mui/material";

export default function LevelsSelector({
  label,
  availableLevels,
  selectedLevels,
  onChange,
  disabled,
}) {
  const handleChange = (event) => {
    // event.target.value will be an array (for multiple Select)
    if (!onChange) return;
    onChange(event.target.value);
  };

  return (
    <Box sx={{ mb: 2 }}>
      {label && (
        <Typography variant="body1" sx={{ mb: 1 }}>
          {label}
        </Typography>
      )}

      <FormControl fullWidth variant="outlined" disabled={disabled}>
        <InputLabel id="levels-label">{label}</InputLabel>
        <Select
          labelId="levels-label"
          multiple
          value={selectedLevels}
          onChange={handleChange}
          label={label}
          renderValue={(selected) =>
            selected.map((lvl) => `Level ${lvl}`).join(", ")
          }
        >
          {availableLevels.map((level) => (
            <MenuItem key={level} value={level}>
              <Checkbox checked={selectedLevels.includes(level)} />
              <ListItemText primary={`Level ${level}`} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>
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
