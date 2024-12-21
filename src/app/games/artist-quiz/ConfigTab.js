//--------
//src/app/games/artist-quiz/ConfigTab.js
//--------

"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  FormControlLabel,
  Checkbox,
  TextField,
  Typography,
  Autocomplete,
  FormHelperText,
  Slider,
} from "@mui/material";
import PropTypes from "prop-types";
import useConfig from "@/hooks/useConfig";
import { fetchFilteredSongs } from "@/utils/dataFetching";
import styles from "./styles.module.css";

export default function ConfigTab({ onSongsFetched }) {
  const { config, updateConfig, isDisabled } = useConfig("artistQuiz");
  const [primaryStyles, setPrimaryStyles] = useState([]);
  const [artistOptions, setArtistOptions] = useState([]);
  const [selectedArtists, setSelectedArtists] = useState([]);
  const [configChanged, setConfigChanged] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");

  const isMountedRef = useRef(false);

  /**
   * Validate inputs for:
   * 1) 3 <= numSongs <= 15
   * 2) 3 <= timeLimit <= 15
   * 3) At least 1 style selected
   * 4) EITHER (levels.length > 0) OR (selectedArtists.length >= 3)
   */
  const validateInputs = () => {
    const numSongs = config.numSongs ?? 10;
    if (numSongs < 3 || numSongs > 15) {
      return "Number of Songs must be between 3 and 15.";
    }

    const timeLimit = config.timeLimit ?? 15;
    if (timeLimit < 3 || timeLimit > 15) {
      return "Time Limit must be between 3 and 15 seconds.";
    }

    // 1 style needed
    const stylesSelected = Object.keys(config.styles || {}).filter(
      (k) => config.styles[k],
    );
    if (stylesSelected.length === 0) {
      return "At least one style must be selected.";
    }

    // New requirement:
    // Must have EITHER some levels selected OR >= 3 artists
    const levelsCount = (config.levels || []).length;
    const artistsCount = selectedArtists.length;
    if (levelsCount === 0 && artistsCount < 3) {
      return "Select either a level or at least 3 artists.";
    }

    // If they have BOTH (≥ 1 level) AND (≥ 3 artists),
    // we can either forbid that or allow it.
    // If you want to disallow both at once, uncomment next lines:
    /*
    if (levelsCount > 0 && artistsCount >= 3) {
      return "Cannot select both levels and ≥3 artists. Clear one or adjust your selection.";
    }
    */

    return "";
  };

  useEffect(() => {
    isMountedRef.current = true;
    // Fetch style data
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

    // Fetch artist data
    (async () => {
      try {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markConfigChanged = () => {
    setConfigChanged(true);
  };

  const handleLevelChange = (level, checked) => {
    // If we want to disallow mixing levels with any artists,
    // (not required by new rule, but previously it was)
    // keep or remove next lines:
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
    updateConfig("numSongs", value);
    markConfigChanged();
  };

  const handleTimeLimitChange = (event, value) => {
    updateConfig("timeLimit", value);
    markConfigChanged();
  };

  const handleArtistsChange = (event, values) => {
    // If we want to disallow mixing levels with any artists,
    // keep next lines, else remove them:
    if (values.length > 0 && (config.levels || []).length > 0) {
      updateConfig("levels", []);
      setValidationMessage("Clearing levels because artists are selected.");
    }
    setSelectedArtists(values);
    markConfigChanged();
  };

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
  }, [configChanged, config, selectedArtists, onSongsFetched, validateInputs]);

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
          <Slider
            value={config.numSongs ?? 10}
            onChange={handleNumSongsChange}
            step={1}
            min={3}
            max={15}
            disabled={isDisabled}
            valueLabelDisplay="auto"
            sx={{ color: "var(--foreground)" }}
          />
        </Box>

        <Box sx={{ flex: 1 }}>
          <Typography
            variant="body1"
            sx={{ color: "var(--foreground)", mb: 1, textAlign: "right" }}
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
            sx={{ color: "var(--foreground)" }}
          />
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

      {/* If user tries to pick both levels + many artists, optionally block or not */}
      {(config.levels || []).length > 0 && selectedArtists.length >= 3 && (
        <FormHelperText className={styles.errorText}>
          Levels are selected and you have 3 or more artists. Please clear one
          group if not allowed.
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
