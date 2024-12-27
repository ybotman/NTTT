//--------------------------------------------
//src/app/games/artist-learn/ConfigTab.js
//--------------------------------------------

"use client";

import React from "react";
import { Box, FormHelperText } from "@mui/material";
import styles from "../styles.module.css";

import SongsSlider from "@/components/ui/SongsSlider";
import SecondsSlider from "@/components/ui/SecondsSlider";
import LevelsSelector from "@/components/ui/LevelsSelector";
import StylesSelector from "@/components/ui/StylesSelector";
import ArtistsSelector from "@/components/ui/ArtistsSelector";

// 1) We'll still fetch style data from useArtistLearn (like old version)
import useArtistLearn from "@/hooks/useArtistLearn";

// 2) We'll store config in GameContext
import { useGameContext } from "@/contexts/GameContext";

export default function ConfigTab() {
  // A) fetch metadata (primaryStyles, artistOptions, etc.)
  const {
    primaryStyles,
    artistOptions,
    validationMessage,
    selectedArtists,
    // any other old states from useArtistLearn
  } = useArtistLearn();

  // B) store final config in game context
  const { config, updateConfig } = useGameContext();

  // If you also want isDisabled or levelsDisabled from the old approach, you can do that:
  // e.g. const { isDisabled, levelsDisabled } = useArtistLearn();

  // Handlers
  const handleNumSongsChange = (value) => {
    updateConfig("numSongs", value);
  };

  const handleTimeLimitChange = (value) => {
    updateConfig("timeLimit", value);
  };

  const handleLevelsChange = (newLevels) => {
    updateConfig("levels", newLevels);
  };

  const handleStylesChange = (updatedStylesObj) => {
    updateConfig("styles", updatedStylesObj);
  };

  const handleArtistsChange = (newSelected) => {
    updateConfig("artists", newSelected);
  };

  return (
    <Box className={styles.configurationContainer}>
      {validationMessage && (
        <FormHelperText className={styles.validationError}>
          {validationMessage}
        </FormHelperText>
      )}

      {/* Sliders */}
      <Box sx={{ display: "flex", gap: 4, mb: 3 }}>
        <SongsSlider
          label="Number of Songs"
          min={3}
          max={25}
          step={1}
          value={config.numSongs ?? 10}
          onChange={handleNumSongsChange}
        />

        <SecondsSlider
          label="Time Limit (Seconds)"
          min={3}
          max={29}
          step={1}
          value={config.timeLimit ?? 15}
          onChange={handleTimeLimitChange}
        />
      </Box>

      {/* Levels & Styles */}
      <Box sx={{ display: "flex", gap: 4, mb: 3 }}>
        <LevelsSelector
          label="Levels:"
          availableLevels={[1, 2, 3, 4, 5]}
          selectedLevels={config.levels || []}
          onChange={handleLevelsChange}
        />

        <StylesSelector
          label="Styles:"
          // We'll pass an array of objects, as old code expects, so each item has { style: "Tango" }
          availableStyles={primaryStyles}
          selectedStyles={config.styles || {}}
          onChange={handleStylesChange}
        />
      </Box>

      {/* Artists */}
      <ArtistsSelector
        label="Select Artists (Optional)"
        availableArtists={artistOptions}
        selectedArtists={config.artists || []}
        onChange={handleArtistsChange}
      />
    </Box>
  );
}
