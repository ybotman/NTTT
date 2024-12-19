"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  TextField,
  FormControlLabel,
  Checkbox,
  Typography,
  Autocomplete,
} from "@mui/material";
import useConfig from "./useConfig";
import { fetchFilteredSongs } from "@/utils/dataFetching";

export default function ConfigTab() {
  const { config, updateConfig, isDisabled } = useConfig("artistQuiz");
  const [primaryStyles, setPrimaryStyles] = useState([]);
  const [artistOptions, setArtistOptions] = useState([]);
  const [selectedArtists, setSelectedArtists] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch StyleMaster.json to load styles
    (async () => {
      try {
        const styleData = await fetch("/songData/StyleMaster.json").then((res) => res.json());
        setPrimaryStyles(styleData.primaryStyles || []);
      } catch (error) {
        console.error("Error fetching StyleMaster.json:", error);
      }
    })();

    // Fetch ArtistMaster.json for artists
    (async () => {
      try {
        const artistData = await fetch("/songData/ArtistMaster.json").then((res) => res.json());
        const activeArtists = artistData
          .filter((artist) => artist.active === "true")
          .map((artist) => ({
            label: `${artist.artist} (Level ${artist.level})`,
            value: artist.artist,
          }));
        setArtistOptions(activeArtists);
      } catch (error) {
        console.error("Error fetching ArtistMaster.json:", error);
      }
    })();
  }, []);

  const handlePlayClick = async () => {
    setLoading(true);
    const numSongs = config.numSongs ?? 10;
    const artistLevels = config.levels || [];
    const activeStyles = Object.keys(config.styles || {}).filter((key) => config.styles[key]);

    try {
      const { songs, qty } = await fetchFilteredSongs(
        selectedArtists.map((a) => a.value),
        artistLevels,
        [],
        activeStyles,
        "N",
        "N",
        "N",
        numSongs
      );
      console.log(`Fetched ${qty} songs for the game:`, songs);
    } catch (error) {
      console.error("Error fetching filtered songs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLevelChange = (level, checked) => {
    let newLevels = [...(config.levels || [])];
    if (checked && !newLevels.includes(level)) {
      newLevels.push(level);
    } else if (!checked) {
      newLevels = newLevels.filter((l) => l !== level);
    }
    updateConfig("levels", newLevels);
  };

  const handleStyleChange = (styleName, checked) => {
    updateConfig("styles", {
      ...config.styles,
      [styleName]: checked,
    });
  };

  return (
    <Box
      sx={{
        p: 3,
        borderRadius: 2,
        backgroundColor: "#f5f5f5",
        mb: 4,
        boxShadow: "0 0 10px 3px rgba(0, 153, 255, 0.5)", // Gradient shadow
      }}
    >
      <Typography variant="h6" sx={{ mb: 2 }}>
        Configuration:
      </Typography>

      {/* Qty and Duration */}
      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        <TextField
          label="Number of Songs"
          type="number"
          value={config.numSongs ?? 10}
          onChange={(e) => updateConfig("numSongs", Number(e.target.value))}
          fullWidth
          margin="dense"
          disabled={isDisabled}
        />
        <TextField
          label="Time Limit (Seconds)"
          type="number"
          value={config.timeLimit ?? 15}
          onChange={(e) => updateConfig("timeLimit", Number(e.target.value))}
          fullWidth
          margin="dense"
          disabled={isDisabled}
        />
      </Box>

      {/* Levels and Styles */}
      <Box sx={{ display: "flex", gap: 4, mb: 3 }}>
        {/* Levels */}
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

        {/* Styles */}
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

      {/* Artist Dropdown */}
      <Autocomplete
        multiple
        options={artistOptions}
        value={selectedArtists}
        onChange={(e, newValue) => setSelectedArtists(newValue)}
        isOptionEqualToValue={(option, value) => option.value === value.value}
        renderInput={(params) => (
          <TextField {...params} label="Select Artists" placeholder="Artists" margin="dense" />
        )}
        sx={{ mb: 2 }}
      />
    </Box>
  );
}
