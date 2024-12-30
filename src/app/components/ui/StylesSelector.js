// ------------------------------------------------------------
// src/components/ui/StylesSelector.js
// ------------------------------------------------------------
"use client";

import React, { useMemo } from "react";
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

export default function StylesSelector({
  label,
  availableStyles,
  selectedStyles, // e.g. { Tango: true, Vals: false }
  onChange,
  disabled,
}) {
  // 1) Convert object => array of style names
  const selectedArray = useMemo(() => {
    return Object.keys(selectedStyles || {}).filter(
      (styleName) => selectedStyles[styleName],
    );
  }, [selectedStyles]);

  // 2) Handler for multi-select
  const handleChange = (event) => {
    if (!onChange) return;
    // event.target.value is an array of style strings
    const newSelectedArray = event.target.value;

    // Convert array => object
    const newSelectedObj = {};
    (availableStyles || []).forEach(({ style }) => {
      newSelectedObj[style] = newSelectedArray.includes(style);
    });

    onChange(newSelectedObj);
  };

  // Renders selected items as comma‐separated
  const renderValue = (arr) => arr.join(", ");

  return (
    <Box sx={{ mb: 2 }}>
      {label && (
        <Typography variant="body1" sx={{ mb: 1 }}>
          {label}
        </Typography>
      )}

      <FormControl fullWidth variant="outlined" disabled={disabled}>
        <InputLabel id="styles-label">{label}</InputLabel>
        <Select
          labelId="styles-label"
          multiple
          value={selectedArray}
          onChange={handleChange}
          label={label}
          renderValue={renderValue}
        >
          {(availableStyles || []).map((styleObj) => {
            const styleName = styleObj.style; // e.g. "Tango"
            const checked = selectedArray.includes(styleName);

            return (
              <MenuItem key={styleName} value={styleName}>
                <Checkbox checked={checked} />
                <ListItemText primary={styleName} />
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>
    </Box>
  );
}

StylesSelector.propTypes = {
  label: PropTypes.string,
  availableStyles: PropTypes.arrayOf(
    PropTypes.shape({
      style: PropTypes.string.isRequired,
    }),
  ),
  selectedStyles: PropTypes.object, // e.g. { Tango: true, Milonga: false }
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

StylesSelector.defaultProps = {
  label: "Select Styles:",
  availableStyles: [],
  selectedStyles: {},
  disabled: false,
};
