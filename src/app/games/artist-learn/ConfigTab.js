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
} from "@mui/material";
import PropTypes from "prop-types";
import useConfig from "./useConfig";
import { fetchFilteredSongs } from "@/utils/dataFetching";

export default function ConfigTab({ onSongsFetched }) {
  const { config, updateConfig, isDisabled } = useConfig("artistQuiz");
  const [primaryStyles, setPrimaryStyles] = useState([]);
  const [artistOptions, setArtistOptions] = useState([]);
  const [selectedArtists, setSelectedArtists] = useState([]);
  const [configChanged, setConfigChanged] = useState(false);

  const isMountedRef = useRef(false);

  // Fetch styles and artist options once
  useEffect(() => {
    isMountedRef.current = true;
    (async () => {
      try {
        const styleData = await fetch("/songData/StyleMaster.json").then((res) => res.json());
        if (isMountedRef.current) setPrimaryStyles(styleData.primaryStyles || []);
      } catch (error) {
        console.error("Error fetching StyleMaster.json:", error);
      }
    })();

    (async () => {
      try {
        const artistData = await fetch("/songData/ArtistMaster.json").then((res) => res.json());
        const activeArtists = artistData
          .filter((artist) => artist.active === "true")
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
  }, []);

  // Handler to mark config as changed
  const markConfigChanged = () => {
    setConfigChanged(true);
  };

  const handleLevelChange = (level, checked) => {
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
    setSelectedArtists(values);
    markConfigChanged();
  };

  // Only fetch songs if configChanged is true
  useEffect(() => {
    if (!configChanged) return;
    let mounted = true;

    const fetchSongs = async () => {
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

    fetchSongs();

    return () => { mounted = false; };
  }, [configChanged, config, selectedArtists, onSongsFetched]);

  return (
    <Box
      sx={{
        p: 3,
        borderRadius: 2,
        backgroundColor: "#f5f5f5",
        mb: 4,
        boxShadow: "0 0 10px 3px rgba(0, 153, 255, 0.5)",
      }}
    >
      <Typography variant="h6" sx={{ mb: 2 }}>
        Configuration:
      </Typography>

      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        <TextField
          label="Number of Songs"
          type="number"
          value={config.numSongs ?? 10}
          onChange={handleNumSongsChange}
          fullWidth
          margin="dense"
          disabled={isDisabled}
        />
        <TextField
          label="Time Limit (Seconds)"
          type="number"
          value={config.timeLimit ?? 15}
          onChange={handleTimeLimitChange}
          fullWidth
          margin="dense"
          disabled={isDisabled}
        />
      </Box>

      <Box sx={{ display: "flex", gap: 4, mb: 3 }}>
        <Box>
          <Typography variant="body1" gutterBottom>
            Levels:
          </Typography>
          {[1, 2, 3, 4, 5].map((level) => (
            <FormControlLabel
              key={level}
              control={
                <Checkbox
                  checked={(config.levels || []).includes(level)}
                  onChange={(e) => handleLevelChange(level, e.target.checked)}
                />
              }
              label={`Level ${level}`}
            />
          ))}
        </Box>

        <Box>
          <Typography variant="body1" gutterBottom>
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
                  />
                }
                label={styleName}
              />
            );
          })}
        </Box>
      </Box>

      <Autocomplete
        multiple
        options={artistOptions}
        value={selectedArtists}
        onChange={handleArtistsChange}
        isOptionEqualToValue={(option, value) => option.value === value.value}
        renderInput={(params) => (
          <TextField {...params} label="Select Artists" placeholder="Artists" margin="dense" />
        )}
        sx={{ mb: 2 }}
      />
    </Box>
  );
}

ConfigTab.propTypes = {
  onSongsFetched: PropTypes.func,
};

ConfigTab.defaultProps = {
  onSongsFetched: null,
};
