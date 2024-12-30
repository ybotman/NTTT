// ------------------------------------------------------------
// src/app/components/ui/PeriodsSelector.js
// ------------------------------------------------------------
"use client";

import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Box, Typography, FormControlLabel, Checkbox } from "@mui/material";

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
        // Filter only active if you want, or keep them all. Adjust as needed.
        const allPeriods = data; // or data.filter((p) => p.active);
        if (isMounted) setPeriods(allPeriods);
      } catch (error) {
        console.error("Error fetching TangoPeriods.json:", error);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Handle checkbox toggle
  const handleCheck = (periodName, checked) => {
    if (!onChange) return;
    let updated = [...selectedPeriods];
    if (checked) {
      // Add if not already present
      if (!updated.includes(periodName)) {
        updated.push(periodName);
      }
    } else {
      // Remove if present
      updated = updated.filter((item) => item !== periodName);
    }
    onChange(updated);
  };

  return (
    <Box sx={{ mb: 2 }}>
      {label && (
        <Typography variant="body1" sx={{ mb: 1 }}>
          {label}
        </Typography>
      )}
      {periods.map((periodObj) => {
        const { period, active } = periodObj;
        const isChecked = selectedPeriods.includes(period);
        return (
          <FormControlLabel
            key={period}
            control={
              <Checkbox
                checked={isChecked}
                onChange={(e) => handleCheck(period, e.target.checked)}
                disabled={disabled || !active}
              />
            }
            label={period}
            sx={{ display: "block" }}
          />
        );
      })}
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
