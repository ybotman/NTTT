//--------
//src/app/games/artist-learn/ConfigTab.js
//--------

"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  TextField,
  FormControlLabel,
  Checkbox,
  Typography,
  Autocomplete,
  FormHelperText
} from "@mui/material";
import PropTypes from "prop-types";
import useConfig from "./useConfig";
import { fetchFilteredSongs } from "@/utils/dataFetching";
import styles from "../styles.module.css";

export default function ConfigTab({ onSongsFetched }) {
  const { config, updateConfig, isDisabled } = useConfig("artistQuiz");
  const [primaryStyles, setPrimaryStyles] = useState([]);
  const [artistOptions, setArtistOptions] = useState([]);
  const [selectedArtists, setSelectedArtists] = useState([]);
  const [configChanged, setConfigChanged] = useState(false);

  const [validationMessage, setValidationMessage] = useState("");

  const isMountedRef = useRef(false);

  // Added helper functions to check validity
  const validateInputs = () => {
    // Validate number of songs: 3-15
    const numSongs = config.numSongs ?? 10;
    if (numSongs < 3 || numSongs > 15) {
      return "Number of Songs must be between 3 and 15.";
    }

    // Validate time limit: 3-15
    const timeLimit = config.timeLimit ?? 15;
    if (timeLimit < 3 || timeLimit > 15) {
      return "Time Limit must be between 3 and 15 seconds.";
    }

    // Check if any style is checked
    const stylesSelected = Object.keys(config.styles || {}).filter((k) => config.styles[k]);
    if (stylesSelected.length === 0) {
      return "At least one style must be selected.";
    }

    // Check that either at least one artist is selected or at least one level is selected
    const levelsSelected = (config.levels || []).length > 0;
    const artistsSelected = selectedArtists.length > 0;
    if (!levelsSelected && !artistsSelected) {
      return "You must select either at least one Artist or at least one Level.";
    }

    // If artists are selected, levels must be empty
    if (artistsSelected && levelsSelected) {
      return "Cannot select both Artists and Levels. Clear one of them.";
    }

    return ""; // No issues
  };

  // Fetch styles and artist options once
  useEffect(() => {
    isMountedRef.current = true;
    (async () => {
      try {
        const styleData = await fetch("/songData/StyleMaster.json").then((res) => res.json());
        if (isMountedRef.current) {
          setPrimaryStyles(styleData.primaryStyles || []);
          // Default Tango on if no styles defined yet
          if (!config.styles || Object.keys(config.styles).length === 0) {
            updateConfig("styles", { Tango: true });
            setConfigChanged(true);
          }
        }
      } catch (error) {
        console.error("Error fetching StyleMaster.json:", error);
      }
    })();

    (async () => {
      try {
        const artistData = await fetch("/songData/ArtistMaster.json").then((res) => res.json());
        // Sort artists first by level then alphabetically
        const activeArtists = artistData
          .filter((artist) => artist.active === "true")
          .sort((a, b) => {
            const levelA = parseInt(a.level, 10);
            const levelB = parseInt(b.level, 10);
            if (levelA !== levelB) return levelA - levelB;
            return a.artist.localeCompare(b.artist);
          })
          .map((artist) => ({
            label: `${artist.artist} (Level ${artist.level})`,
            value: artist.artist,
          }));
        if (isMountedRef.current) setArtistOptions(activeArtists);
      } catch (error) {
        console.error("Error fetching ArtistMaster.json:", error);
      }
    })();

    return () => {
      isMountedRef.current = false;
    };
  }, [updateConfig, config.styles]);

  // Handler to mark config as changed
  const markConfigChanged = () => {
    setConfigChanged(true);
  };

  const handleLevelChange = (level, checked) => {
    // If artists selected, can't select levels
    if (selectedArtists.length > 0) {
      setValidationMessage("Levels not available when artists are selected. Clear artists first.");
      return;
    }

    let newLevels = [...(config.levels || [])];
    if (checked && !newLevels.includes(level)) {
      newLevels.push(level);
    } else if (!checked) {
      newLevels = newLevels.filter((l) => l !== level);
    }
    updateConfig("levels", newLevels);
    markConfigChanged();
  };

  const handleStyleChange = (styleName, checked) => {
    updateConfig("styles", {
      ...config.styles,
      [styleName]: checked,
    });
    markConfigChanged();
  };

  const handleNumSongsChange = (e) => {
    updateConfig("numSongs", Number(e.target.value));
    markConfigChanged();
  };

  const handleTimeLimitChange = (e) => {
    updateConfig("timeLimit", Number(e.target.value));
    markConfigChanged();
  };

  const handleArtistsChange = (event, values) => {
    // If artists selected, clear levels
    if (values.length > 0) {
      if ((config.levels || []).length > 0) {
        updateConfig("levels", []); 
        setValidationMessage("Clearing levels because artists are selected.");
      }
    }
    setSelectedArtists(values);
    markConfigChanged();
  };

  // Only fetch songs if configChanged is true
  useEffect(() => {
    if (!configChanged) return;
    let mounted = true;

    // Validate inputs before fetching
    const validationErr = validateInputs();
    if (validationErr) {
      setValidationMessage(validationErr);
      setConfigChanged(false);
      return;
    } else {
      setValidationMessage("");
    }

    const fetchSongsData = async () => {
      const numSongs = config.numSongs ?? 10;
      const artistLevels = config.levels || [];
      const activeStyles = Object.keys(config.styles || {}).filter((key) => config.styles[key]);

      try {
        const { songs } = await fetchFilteredSongs(
          selectedArtists.map((a) => a.value),
          artistLevels,
          [],
          activeStyles,
          "N",
          "N",
          "N",
          numSongs
        );
        if (mounted && onSongsFetched) {
          onSongsFetched(songs);
        }
      } catch (error) {
        console.error("Error fetching filtered songs:", error);
        if (mounted && onSongsFetched) {
          onSongsFetched([]);
        }
      } finally {
        // After fetch completes, reset configChanged
        if (mounted) setConfigChanged(false);
      }
    };

    fetchSongsData();

    return () => { mounted = false; };
  }, [configChanged, config, selectedArtists, onSongsFetched]);

  // If artists selected, disable levels checkboxes
  const levelsDisabled = selectedArtists.length > 0;

  return (
<Box className={styles.configurationContainer}>
  <Typography variant="h6" className={styles.title}>
    Configuration:
  </Typography>

  {/* Validation Message */}
  {validationMessage && (
    <FormHelperText className={styles.validationError}>
      {validationMessage}
    </FormHelperText>
  )}

  <Box className={styles.fieldsContainer}>
    <TextField
      label="Number of Songs"
      type="number"
      value={config.numSongs ?? 10}
      onChange={handleNumSongsChange}
      fullWidth
      margin="dense"
      disabled={isDisabled}
      className={styles.textField}
    />
    <TextField
      label="Time Limit (Seconds)"
      type="number"
      value={config.timeLimit ?? 15}
      onChange={handleTimeLimitChange}
      fullWidth
      margin="dense"
      disabled={isDisabled}
      className={styles.textField}
    />
  </Box>

  <Box className={styles.optionsContainer}>
    {/* Levels */}
    <Box>
      <Typography variant="body1" className={styles.optionLabel}>
        Levels:
      </Typography>
      {[1, 2, 3, 4, 5].map((level) => (
        <FormControlLabel
          key={level}
          control={
            <Checkbox
              checked={(config.levels || []).includes(level)}
              onChange={(e) => handleLevelChange(level, e.target.checked)}
              disabled={isDisabled || levelsDisabled}
              className={styles.checkbox}
            />
          }
          label={`Level ${level}`}
        />
      ))}
      {levelsDisabled && (
        <FormHelperText className={styles.helperText}>
          Levels disabled because Artists are selected.
        </FormHelperText>
      )}
    </Box>

    {/* Styles */}
    <Box>
      <Typography variant="body1" className={styles.optionLabel}>
        Styles:
      </Typography>
      {primaryStyles.map((styleObj) => {
        const styleName = styleObj.style;
        return (
          <FormControlLabel
            key={styleName}
            control={
              <Checkbox
                checked={config.styles?.[styleName] ?? false}
                onChange={(e) => handleStyleChange(styleName, e.target.checked)}
                disabled={isDisabled}
                className={styles.checkbox}
              />
            }
            label={styleName}
          />
        );
      })}
    </Box>
  </Box>

  {/* Artist Autocomplete */}
  <Autocomplete
    multiple
    options={artistOptions}
    value={selectedArtists}
    onChange={handleArtistsChange}
    isOptionEqualToValue={(option, value) => option.value === value.value}
    renderInput={(params) => (
      <TextField
        {...params}
        label="Select Artists"
        placeholder="Artists"
        margin="dense"
        disabled={isDisabled || (config.levels || []).length > 0}
        className={styles.textField}
      />
    )}
    className={styles.autocomplete}
  />

  {(config.levels || []).length > 0 && selectedArtists.length > 0 && (
    <FormHelperText className={styles.errorText}>
      Both artists and levels are selected. Please clear one.
    </FormHelperText>
  )}
</Box>

  );
}

ConfigTab.propTypes = {
  onSongsFetched: PropTypes.func,
};

ConfigTab.defaultProps = {
  onSongsFetched: null,
};
