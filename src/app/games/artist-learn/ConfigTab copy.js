// ------------------------------------------------------------
// src/app/games/artist-learn/ConfigTab.js (OLD)
// ------------------------------------------------------------
"use client";

import React from "react";
import { Box, FormHelperText } from "@mui/material";

import styles from "../styles.module.css";

import SongsSlider from "@/components/ui/SongsSlider";
import SecondsSlider from "@/components/ui/SecondsSlider";
import LevelsSelector from "@/components/ui/LevelsSelector";
import StylesSelector from "@/components/ui/StylesSelector";
import ArtistsSelector from "@/components/ui/ArtistsSelector";
import useArtistLearn from "@/hooks/useArtistLearn";

export default function ConfigTab() {
  // 1) Use the custom hook instead of onSongsFetched
  const {
    config,
    isDisabled,
    primaryStyles,
    artistOptions,
    selectedArtists,
    validationMessage,
    levelsDisabled,

    // handlers
    handleNumSongsChange,
    handleTimeLimitChange,
    handleLevelsChange,
    handleStylesChange,
    handleArtistsChange,
  } = useArtistLearn(); // no callback

  return (
    <Box className={styles.configurationContainer}>
      {/* Show validation errors if any */}
      {validationMessage && (
        <FormHelperText className={styles.validationError}>
          {validationMessage}
        </FormHelperText>
      )}

      {/* Row with # of Songs slider & Time Limit slider */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          width: "100%",
          mb: 3,
        }}
      >
        <Box sx={{ flex: 1 }}>
          <SongsSlider
            label="Number of Songs"
            min={3}
            max={25}
            step={1}
            value={config.numSongs ?? 10}
            onChange={handleNumSongsChange}
            disabled={isDisabled}
          />
        </Box>
        <Box sx={{ flex: 1 }}>
          <SecondsSlider
            label="Time Limit (Seconds)"
            min={3}
            max={29}
            step={1}
            value={config.timeLimit ?? 15}
            onChange={handleTimeLimitChange}
            disabled={isDisabled}
          />
        </Box>
      </Box>

      {/* Levels & Styles */}
      <Box sx={{ display: "flex", gap: 4, mb: 3 }}>
        <Box sx={{ flex: 1 }}>
          <LevelsSelector
            label="Levels:"
            availableLevels={[1, 2, 3, 4, 5]}
            selectedLevels={config.levels || []}
            onChange={handleLevelsChange}
            disabled={isDisabled || levelsDisabled}
          />
        </Box>
        <Box sx={{ flex: 1 }}>
          <StylesSelector
            label="Styles:"
            availableStyles={primaryStyles}
            selectedStyles={config.styles || {}}
            onChange={handleStylesChange}
            disabled={isDisabled}
          />
        </Box>
      </Box>

      {/* Artists (Optional) */}
      <ArtistsSelector
        label="Select Artists (Optional)"
        availableArtists={artistOptions}
        selectedArtists={selectedArtists}
        onChange={handleArtistsChange}
        disabled={isDisabled || (config.levels || []).length > 0}
        placeholder="Artists"
      />

      {/* If both levels & artists are selected => error */}
      {(config.levels || []).length > 0 && selectedArtists.length > 0 && (
        <FormHelperText className={styles.errorText}>
          Both artists and levels are selected. Please clear one.
        </FormHelperText>
      )}
    </Box>
  );
}

ConfigTab.propTypes = {
  // No more onSongsFetched prop
};

ConfigTab.defaultProps = {};
