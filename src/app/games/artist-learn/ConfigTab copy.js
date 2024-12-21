//---------------------
// ConfigTab.js (Snippet)
//---------------------
"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  Box,
  FormControlLabel,
  TextField,
  Checkbox,
  Typography,
  Autocomplete,
  FormHelperText,
  Slider,
} from "@mui/material";
import PropTypes from "prop-types";
import useConfig from "@/hooks/useConfig";
import { fetchFilteredSongs } from "@/utils/dataFetching";
import styles from "../styles.module.css";

function ConfigTab({ onSongsFetched }) {
  const { config, updateConfig, isDisabled } = useConfig("artistQuiz");

  // Local states
  const [primaryStyles, setPrimaryStyles] = useState([]);
  const [artistOptions, setArtistOptions] = useState([]);
  const [selectedArtists, setSelectedArtists] = useState([]);
  const [configChanged, setConfigChanged] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");

  const isMountedRef = useRef(false);

  // 1) Validate form inputs
  const validateInputs = useCallback(() => {
    const numSongs = config.numSongs ?? 10;
    if (numSongs < 3 || numSongs > 15) {
      return "Number of Songs must be between 3 and 15.";
    }

    const timeLimit = config.timeLimit ?? 15;
    if (timeLimit < 3 || timeLimit > 15) {
      return "Time Limit must be between 3 and 15 seconds.";
    }

    const stylesSelected = Object.keys(config.styles || {}).filter(
      (k) => config.styles[k],
    );
    if (stylesSelected.length === 0) {
      return "At least one style must be selected.";
    }

    const levelsSelected = (config.levels || []).length > 0;
    const artistsSelected = selectedArtists.length > 0;
    if (!levelsSelected && !artistsSelected) {
      return "You must select either at least one Artist or at least one Level.";
    }

    if (artistsSelected && levelsSelected) {
      return "Cannot select both Artists and Levels. Clear one of them.";
    }

    return "";
  }, [config, selectedArtists]);

  // 2) Fetch style & artist data only once
  useEffect(() => {
    isMountedRef.current = true;
    (async () => {
      try {
        // Fetch style data once
        const styleData = await fetch("/songData/StyleMaster.json").then(
          (res) => res.json(),
        );
        if (isMountedRef.current) {
          setPrimaryStyles(styleData.primaryStyles || []);
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
        // Fetch artist data once
        const artistData = await fetch("/songData/ArtistMaster.json").then(
          (res) => res.json(),
        );
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
        if (isMountedRef.current) {
          setArtistOptions(activeArtists);
          // Validate once after data loaded
          const initialValidation = validateInputs();
          if (initialValidation) {
            setValidationMessage(initialValidation);
          }
        }
      } catch (error) {
        console.error("Error fetching ArtistMaster.json:", error);
      }
    })();

    return () => {
      isMountedRef.current = false;
    };
  }, [validateInputs, config.styles, updateConfig]);

  // Mark config changed
  const markConfigChanged = () => setConfigChanged(true);

  // 3) Handlers
  const handleLevelChange = (level, checked) => {
    if (selectedArtists.length > 0) {
      setValidationMessage(
        "Levels not available when artists are selected. Clear artists first.",
      );
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

  const handleNumSongsChange = (event, value) => {
    // Debounce or direct set
    updateConfig("numSongs", value);
    markConfigChanged();
  };

  const handleTimeLimitChange = (event, value) => {
    updateConfig("timeLimit", value);
    markConfigChanged();
  };

  const handleArtistsChange = (event, values) => {
    if (values.length > 0 && (config.levels || []).length > 0) {
      updateConfig("levels", []);
      setValidationMessage("Clearing levels because artists are selected.");
    }
    setSelectedArtists(values);
    markConfigChanged();
  };

  // 4) On config change, validate and fetch songs
  useEffect(() => {
    if (!configChanged) return;
    let mounted = true;

    const validationErr = validateInputs();
    if (validationErr) {
      setValidationMessage(validationErr);
      setConfigChanged(false);
      return;
    } else {
      setValidationMessage("");
    }

    (async () => {
      try {
        const numSongs = config.numSongs ?? 10;
        const artistLevels = config.levels || [];
        const activeStyles = Object.keys(config.styles || {}).filter(
          (key) => config.styles[key],
        );
        const { songs } = await fetchFilteredSongs(
          selectedArtists.map((a) => a.value),
          artistLevels,
          [],
          activeStyles,
          "N",
          "N",
          "N",
          numSongs,
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
        if (mounted) setConfigChanged(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [configChanged, config, selectedArtists, onSongsFetched, validateInputs]);

  // Render
  const levelsDisabled = selectedArtists.length > 0;

  return (
    <Box className={styles.configurationContainer}>
      {validationMessage && (
        <FormHelperText className={styles.validationError}>
          {validationMessage}
        </FormHelperText>
      )}
      <Typography variant="h6" className={styles.title} sx={{ mb: 2 }}>
        Configuration:
      </Typography>

      {/* Sliders */}
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
          <Typography variant="body1" sx={{ mb: 1 }}>
            Number of Songs
          </Typography>
          <Slider
            value={config.numSongs ?? 10}
            onChange={handleNumSongsChange}
            step={1}
            min={3}
            max={15}
            disabled={isDisabled}
            valueLabelDisplay="auto"
          />
        </Box>

        <Box sx={{ flex: 1 }}>
          <Typography
            variant="body1"
            sx={{ mb: 1, textAlign: "right" }}
          >
            Time Limit (Seconds)
          </Typography>
          <Slider
            value={config.timeLimit ?? 15}
            onChange={handleTimeLimitChange}
            step={1}
            min={3}
            max={15}
            disabled={isDisabled}
            valueLabelDisplay="auto"
          />
        </Box>
      </Box>

      {/* Levels and Styles */}
      <Box sx={{ display: "flex", gap: 4, mb: 3 }}>
        <Box>
          <Typography variant="body1">Levels:</Typography>
          {[1, 2, 3, 4, 5].map((level) => (
            <FormControlLabel
              key={level}
              control={
                <Checkbox
                  checked={(config.levels || []).includes(level)}
                  onChange={(e) => handleLevelChange(level, e.target.checked)}
                  disabled={isDisabled || levelsDisabled}
                />
              }
              label={`Level ${level}`}
            />
          ))}
          {levelsDisabled && (
            <FormHelperText>
              Levels disabled because Artists are selected.
            </FormHelperText>
          )}
        </Box>

        <Box>
          <Typography variant="body1">Styles:</Typography>
          {primaryStyles.map((styleObj) => {
            const styleName = styleObj.style;
            return (
              <FormControlLabel
                key={styleName}
                control={
                  <Checkbox
                    checked={config.styles?.[styleName] ?? false}
                    onChange={(e) =>
                      handleStyleChange(styleName, e.target.checked)
                    }
                    disabled={isDisabled}
                  />
                }
                label={styleName}
              />
            );
          })}
        </Box>
      </Box>

      {/* Artist Selection */}
      <Typography variant="body1" sx={{ mb: 1 }}>
        Select Artists (Optional):
      </Typography>
      <Autocomplete
        multiple
        options={artistOptions}
        value={selectedArtists}
        onChange={handleArtistsChange}
        isOptionEqualToValue={(option, value) => option.value === value.value}
        renderInput={(params) => (
          <TextField {...params} label="Select Artists" placeholder="Artists" />
        )}
        sx={{ mb: 2 }}
      />

      {(config.levels || []).length > 0 && selectedArtists.length > 0 && (
        <FormHelperText>
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

export default ConfigTab;
