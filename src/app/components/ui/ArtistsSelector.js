// src/components/ui/ArtistsSelector.js

import React from "react";
import PropTypes from "prop-types";
import { Box, Typography, Autocomplete, TextField } from "@mui/material";

export default function ArtistsSelector({
  label,
  availableArtists,
  selectedArtists,
  onChange,
  disabled,
  placeholder,
}) {
  const handleChange = (event, newValue) => {
    if (onChange) onChange(newValue);
  };

  return (
    <Box sx={{ mb: 2 }}>
      {label && (
        <Typography variant="body1" sx={{ mb: 1 }}>
          {label}
        </Typography>
      )}
      <Autocomplete
        multiple
        options={availableArtists}
        value={selectedArtists}
        isOptionEqualToValue={(option, value) => option.value === value.value}
        onChange={handleChange}
        disabled={disabled}
        renderInput={(params) => (
          <TextField
            {...params}
            label={placeholder || "Select Artists"}
            placeholder={placeholder}
          />
        )}
      />
    </Box>
  );
}

ArtistsSelector.propTypes = {
  label: PropTypes.string,
  availableArtists: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired,
    }),
  ),
  selectedArtists: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
      value: PropTypes.string,
    }),
  ),
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  placeholder: PropTypes.string,
};

ArtistsSelector.defaultProps = {
  label: "Select Artists:",
  availableArtists: [],
  selectedArtists: [],
  disabled: false,
  placeholder: "Artists",
};
