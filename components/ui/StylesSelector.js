// src/components/ui/StylesSelector.js

import React from "react";
import PropTypes from "prop-types";
import { Box, Typography, FormControlLabel, Checkbox } from "@mui/material";

export default function StylesSelector({
  label,
  availableStyles,
  selectedStyles,
  onChange,
  disabled,
}) {
  const handleCheck = (style, checked) => {
    if (!onChange) return;
    onChange({
      ...selectedStyles,
      [style]: checked,
    });
  };

  return (
    <Box sx={{ mb: 2 }}>
      {label && (
        <Typography variant="body1" sx={{ mb: 1 }}>
          {label}
        </Typography>
      )}
      {availableStyles.map((styleObj) => {
        const styleName = styleObj.style;
        const isChecked = !!selectedStyles?.[styleName];
        return (
          <FormControlLabel
            key={styleName}
            control={
              <Checkbox
                checked={isChecked}
                onChange={(e) => handleCheck(styleName, e.target.checked)}
                disabled={disabled}
              />
            }
            label={styleName}
          />
        );
      })}
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
  selectedStyles: PropTypes.object,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

StylesSelector.defaultProps = {
  label: "Select Styles:",
  availableStyles: [],
  selectedStyles: {},
  disabled: false,
};
