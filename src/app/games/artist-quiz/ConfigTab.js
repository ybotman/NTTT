"use client";

import styles from "../styles.module.css";
import React, { useState, useEffect } from "react";
//import PropTypes from "prop-types";
import {
  Box,
  TextField,
  FormControlLabel,
  Checkbox,
  Button,
  Typography,
  Autocomplete,
  Checkbox as MUICheckbox,
} from "@mui/material";
import useConfig from "./useConfig";
import { fetchFilteredSongs } from "@/utils/dataFetching";

export default function ConfigTab() {
  const { config, updateConfig, saveConfig, isDisabled } =
    useConfig("artistQuiz");

  const [artists, setArtists] = useState([]);
  const [selectedArtists, setSelectedArtists] = useState([]);

  // Fetch artist data and prepare for dropdown
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const artistData = await fetch("/songData/ArtistMaster.json").then(
          (r) => r.json(),
        );
        const activeArtists = artistData
          .filter((a) => a.active === "true")
          .map((a) => ({
            name: a.artist,
            level: parseInt(a.level, 10),
          }));
        // sort by level ascending, then by name
        activeArtists.sort(
          (a, b) => a.level - b.level || a.name.localeCompare(b.name),
        );

        if (mounted) {
          setArtists(activeArtists);
        }
      } catch (err) {
        console.error("Error fetching artists:", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleLevelChange = (level, checked) => {
    let newLevels = [...(config.levels || [])];
    if (checked) {
      if (!newLevels.includes(level)) newLevels.push(level);
    } else {
      newLevels = newLevels.filter((l) => l !== level);
    }
    updateConfig("levels", newLevels);
  };

  const handleStyleChange = (styleKey, checked) => {
    updateConfig("styles", {
      ...config.styles,
      [styleKey]: checked,
    });
  };

  const handleArtistChange = (event, values) => {
    setSelectedArtists(values);
  };

  const handleSubmit = async () => {
    const numSongs = config.numSongs ?? 10;
    const timeLimit = config.timeLimit ?? 15;
    const artistLevels = config.levels || [];

    const activeStyles = Object.keys(config.styles || {}).filter(
      (key) => config.styles[key],
    );
    const artistMasters = selectedArtists.map((a) => a.name);

    const { songs, qty } = await fetchFilteredSongs(
      artistMasters, // artistMasters
      artistLevels, // artistLevels
      [], // composers (empty)
      activeStyles, // styles
      "N", // candombe
      "N", // alternative
      "N", // cancion
      numSongs, // qty parameter added here
    );

    // console.log(`Fetched ${qty} songs with criteria:`);
    // console.log(songs);
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6">Game Configuration</Typography>

      {/* Qty and Time limit on one line */}
      <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
        <TextField
          label="Number of Songs"
          type="number"
          value={config.numSongs ?? 10}
          onChange={(e) => updateConfig("numSongs", Number(e.target.value))}
          fullWidth
          disabled={isDisabled}
        />
        <TextField
          label="Time Limit (Seconds)"
          type="number"
          value={config.timeLimit ?? 15}
          onChange={(e) => updateConfig("timeLimit", Number(e.target.value))}
          fullWidth
          disabled={isDisabled}
        />
      </Box>

      <Box sx={{ display: "flex", gap: 4, mt: 2 }}>
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
          {["Tango", "Vals", "Milonga"].map((styleName) => (
            <FormControlLabel
              key={styleName}
              control={
                <Checkbox
                  checked={config.styles?.[styleName] ?? false}
                  onChange={(e) =>
                    handleStyleChange(styleName, e.target.checked)
                  }
                />
              }
              label={`Include ${styleName}`}
            />
          ))}
        </Box>
      </Box>

      <Box sx={{ mt: 2 }}>
        <Typography variant="body1" gutterBottom>
          Artists (Check list):
        </Typography>
        <Autocomplete
          multiple
          options={artists}
          getOptionLabel={(option) => `${option.name} (Level ${option.level})`}
          renderOption={(props, option, { selected }) => {
            const { key, ...restProps } = props; // Destructure key out of props
            return (
              <li key={option.name} {...restProps}>
                <MUICheckbox style={{ marginRight: 8 }} checked={selected} />
                {`${option.name} (Level ${option.level})`}
              </li>
            );
          }}
          onChange={handleArtistChange}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Select Artists"
              placeholder="Artists"
            />
          )}
        />
      </Box>

      <Button variant="contained" onClick={saveConfig} sx={{ mt: 2, mr: 2 }}>
        Save Configuration
      </Button>

      <Button
        variant="contained"
        color="secondary"
        onClick={handleSubmit}
        sx={{ mt: 2 }}
      >
        Submit & Test Fetch
      </Button>
    </Box>
  );
}

ConfigTab.propTypes = {
  // no props directly passed
};
