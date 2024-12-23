//--------
//src/app/games/artist-learn/ConfigTab.js
//--------
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
import SongsSlider from "@/components/ui/SongsSlider";
//import SecondsSlider from "@/components/ui/SecondsSlider";
//import LevelsSelector from "@/components/ui/LevelsSelector";
//import StylesSelector from "@/components/ui/StylesSelector";
//import ArtistsSelector from "@/components/ui/ArtistsSelector";

export default function ConfigTab({ onSongsFetched }) {
  const { config, updateConfig, isDisabled } = useConfig("artistLearn"); // Updated to "artistLearn"
  const [primaryStyles, setPrimaryStyles] = useState([]);
  const [artistOptions, setArtistOptions] = useState([]);
  const [selectedArtists, setSelectedArtists] = useState([]);
  const [configChanged, setConfigChanged] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");
  const isMountedRef = useRef(false);
  const levelsDisabled = selectedArtists.length > 0;

  const validateInputs = useCallback(() => {
    const numSongs = config.numSongs ?? 10;
    if (numSongs < 3 || numSongs > 25) {
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
  }, [
    config.numSongs,
    config.timeLimit,
    config.levels,
    config.styles,
    selectedArtists,
  ]);

  // ---- Generate dynamic marks for Sliders ----
  const numSongsMarks = Array.from({ length: 13 }, (_, i) => {
    const val = i + 3; // 3..15
    return { value: val, label: String(val) };
  });

  const timeLimitMarks = Array.from({ length: 13 }, (_, i) => {
    const val = i + 3; // 3..15
    return { value: val, label: String(val) };
  });

  // ---- Fetch data only once on mount ----
  useEffect(() => {
    isMountedRef.current = true;

    (async () => {
      try {
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
        const artistData = await fetch("/songData/ArtistMaster.json").then(
          (res) => res.json(),
        );
        const activeArtists = artistData
          .filter((artist) => artist.active === "true")
          .sort((a, b) => {
            // Convert level to a number
            const levelA = parseInt(a.level, 10);
            const levelB = parseInt(b.level, 10);

            // Sort by level first
            if (levelA !== levelB) {
              return levelA - levelB;
            }

            // If levels are equal, sort alphabetically by artist name
            return a.artist.localeCompare(b.artist);
          })
          .map((artist) => ({
            label: `${artist.artist} (Level ${artist.level})`,
            value: artist.artist,
          }));

        if (isMountedRef.current) {
          setArtistOptions(activeArtists);
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
  }, []);

  const markConfigChanged = () => {
    setConfigChanged(true);
    console.log("Config changed", config);
  };

  const handleNumSongsChange = (value) => {
    updateConfig("numSongs", value);
    console.log("-->numSongs changed to", value);
    markConfigChanged();
  };

  const handleTimeLimitChange = (value) => {
    updateConfig("timeLimit", value);
    console.log("-->timeLimit changed to", value);
    markConfigChanged();
  };

  // Use onChangeCommitted so we don’t spam requests on every thumb move
  // (If you *must* use onChange, you’d likely add a debounce.)
  const renderNumSongsSlider = () => (
    <Slider
      value={config.numSongs ?? 10}
      min={3}
      max={15}
      step={1}
      onChangeCommitted={(event, value) => handleNumSongsChange(value)}
      disabled={isDisabled}
      marks={numSongsMarks}
      valueLabelDisplay="on"
      sx={{ color: "var(--foreground)" }}
    />
  );

  const renderTimeLimitSlider = () => (
    <Slider
      value={config.timeLimit ?? 15}
      min={3}
      max={15}
      step={1}
      onChangeCommitted={(event, value) => handleTimeLimitChange(value)}
      disabled={isDisabled}
      marks={timeLimitMarks}
      valueLabelDisplay="on"
      sx={{ color: "var(--foreground)" }}
    />
  );

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
    console.log("-->levels changed to", newLevels);
    markConfigChanged();
  };

  const handleStyleChange = (styleName, checked) => {
    updateConfig("styles", {
      ...config.styles,
      [styleName]: checked,
    });
    console.log("-->styles changed to", config.styles);
    markConfigChanged();
  };

  const handleArtistsChange = (event, values) => {
    if (values.length > 0 && (config.levels || []).length > 0) {
      updateConfig("levels", []);
      setValidationMessage("Clearing levels because artists are selected.");
    }
    console.log("-->artists changed to", values);
    setSelectedArtists(values);
    markConfigChanged();
  };

  // ---- Only fetch songs if config changed & validated ----
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

    const fetchSongsData = async () => {
      const numSongs = config.numSongs ?? 10;
      const artistLevels = config.levels || [];
      const activeStyles = Object.keys(config.styles || {}).filter(
        (key) => config.styles[key],
      );

      try {
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
    };

    fetchSongsData();

    return () => {
      mounted = false;
    };
  }, [configChanged, validateInputs, config, selectedArtists, onSongsFetched]);

  return (
    <Box className={styles.configurationContainer}>
      {validationMessage && (
        <FormHelperText className={styles.validationError}>
          {validationMessage}
        </FormHelperText>
      )}
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
          <Typography
            variant="body1"
            sx={{ color: "var(--foreground)", mb: 1 }}
          >
            Number of Songs
          </Typography>
          {renderNumSongsSlider()}
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="body1"
            sx={{ color: "var(--foreground)", mb: 1, textAlign: "right" }}
          >
            Time Limit (Seconds)
          </Typography>
          {renderTimeLimitSlider()}
        </Box>
      </Box>
      <Box
        className={styles.optionsContainer}
        sx={{ display: "flex", gap: 4, mb: 3 }}
      >
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
                    onChange={(e) =>
                      handleStyleChange(styleName, e.target.checked)
                    }
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
      <Typography variant="body1" sx={{ color: "var(--foreground)", mb: 1 }}>
        Select Artists (Optional):
      </Typography>
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
            sx={{
              backgroundColor: "var(--input-bg)",
              color: "var(--input-text)",
              "& .MuiFormLabel-root": { color: "var(--foreground)" },
              "& .MuiInputBase-root": { color: "var(--input-text)" },
            }}
          />
        )}
        sx={{
          "& .MuiAutocomplete-listbox": {
            backgroundColor: "var(--dropdown-bg)",
            color: "var(--input-text)",
          },
          mb: 2,
        }}
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
