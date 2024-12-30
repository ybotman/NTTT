// ------------------------------------------------------------
// src/app/components/ui/PeriodsSelector.js
// ------------------------------------------------------------
"use client";

import React, { useEffect, useState } from "react";
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

export default function PeriodsSelector({
  label,
  selectedPeriods,
  onChange,
  disabled,
}) {
  const [periods, setPeriods] = useState([]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const response = await fetch("/songData/TangoPeriods.json");
        const data = await response.json();
        if (isMounted) {
          setPeriods(data); // or filter for active if desired
        }
      } catch (error) {
        console.error("Error fetching TangoPeriods.json:", error);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // When user selects or deselects items
  const handleChange = (event) => {
    if (!onChange) return;
    // event.target.value is an array for multi-select
    onChange(event.target.value);
  };

  // The displayed text inside the collapsed select field
  const renderSelected = (selectedArr) => selectedArr.join(", ");

  return (
    <Box sx={{ mb: 2 }}>
      {label && (
        <Typography variant="body1" sx={{ mb: 1 }}>
          {label}
        </Typography>
      )}

      <FormControl fullWidth variant="outlined" disabled={disabled}>
        <InputLabel id="periods-select-label">{label}</InputLabel>
        <Select
          labelId="periods-select-label"
          multiple
          value={selectedPeriods}
          onChange={handleChange}
          label={label}
          renderValue={renderSelected}
        >
          {periods.map((p) => {
            // Use p.period as the "value" and display it
            // If you only want active items selectable, disable if !p.active
            const isDisabled = disabled || !p.active;
            const isChecked = selectedPeriods.includes(p.period);

            return (
              <MenuItem key={p.period} value={p.period} disabled={isDisabled}>
                <Checkbox checked={isChecked} />
                <ListItemText primary={p.period} />
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>
    </Box>
  );
}

PeriodsSelector.propTypes = {
  label: PropTypes.string,
  selectedPeriods: PropTypes.arrayOf(PropTypes.string),
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

PeriodsSelector.defaultProps = {
  label: "Select Periods:",
  selectedPeriods: [],
  disabled: false,
};