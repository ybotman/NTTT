// src/components/ui/SingersSelector.js

import React from "react";
import PropTypes from "prop-types";
import { Box, Typography, FormControlLabel, Checkbox } from "@mui/material";

// Example: we consider "availableSingers" array, each item { label, value }
// "selectedSingers" is an array of singer value strings

export default function SingersSelector({
  label,
  availableSingers,
  selectedSingers,
  onChange,
  disabled,
}) {
  const handleCheck = (value, checked) => {
    if (!onChange) return;
    let newSelected = [...selectedSingers];
    if (checked && !newSelected.includes(value)) {
      newSelected.push(value);
    } else if (!checked) {
      newSelected = newSelected.filter((v) => v !== value);
    }
    onChange(newSelected);
  };

  return (
    <Box sx={{ mb: 2 }}>
      {label && (
        <Typography variant="body1" sx={{ mb: 1 }}>
          {label}
        </Typography>
      )}
      {availableSingers.map((singer) => {
        const isChecked = selectedSingers.includes(singer.value);
        return (
          <FormControlLabel
            key={singer.value}
            control={
              <Checkbox
                checked={isChecked}
                onChange={(e) => handleCheck(singer.value, e.target.checked)}
                disabled={disabled}
              />
            }
            label={singer.label}
          />
        );
      })}
    </Box>
  );
}

SingersSelector.propTypes = {
  label: PropTypes.string,
  availableSingers: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
      value: PropTypes.string,
    }),
  ),
  selectedSingers: PropTypes.arrayOf(PropTypes.string),
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

SingersSelector.defaultProps = {
  label: "Select Singers:",
  availableSingers: [],
  selectedSingers: [],
  disabled: false,
};
