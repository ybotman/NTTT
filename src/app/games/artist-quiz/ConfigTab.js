//-------------------
//src/app/games/artist-quiz/ConfigTab.js
//-------------------
"use client";

import React from "react";
import PropTypes from "prop-types";
import { Box, TextField, FormControlLabel, Checkbox, Button, Typography } from "@mui/material";
import useConfig from "@/hooks/useConfig";

export default function ConfigTab() {
  const { config, updateConfig, saveConfig, isDisabled } = useConfig("artistQuiz");

  const handleLevelChange = (level, checked) => {
    let newLevels = [...(config.levels || [])];
    if (checked) {
      if (!newLevels.includes(level)) newLevels.push(level);
    } else {
      newLevels = newLevels.filter((l) => l !== level);
    }
    updateConfig("levels", newLevels);
  };

  console.log("Styles config:", config.styles); 
  console.log("Styles Tango:", config.styles?.Tango);

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6">Game Configuration</Typography>
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

      <Typography variant="body1" gutterBottom sx={{ mt: 2 }}>Levels (Check all that apply):</Typography>
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

      <Typography variant="body1" gutterBottom sx={{ mt: 2 }}>Styles:</Typography>
      <FormControlLabel
        control={
          <Checkbox
            checked={config.styles?.Tango ?? false}
            onChange={(e) =>
              updateConfig("styles", { 
                ...config.styles, 
                Tango: e.target.checked ?? false,
                Vals: config.styles?.Vals ?? false,
                Milonga: config.styles?.Milonga ?? false 
              })
            }
          />
        }
        label="Include Tango"
      />
      <FormControlLabel
        control={
          <Checkbox
            checked={config.styles?.Vals ?? false}
            onChange={(e) =>
              updateConfig("styles", { 
                ...config.styles, 
                Tango: config.styles?.Tango ?? false,
                Vals: e.target.checked ?? false,
                Milonga: config.styles?.Milonga ?? false 
              })
            }
          />
        }
        label="Include Vals"
      />
      <FormControlLabel
        control={
          <Checkbox
            checked={config.styles?.Milonga ?? false}
            onChange={(e) =>
              updateConfig("styles", { 
                ...config.styles, 
                Tango: config.styles?.Tango ?? false,
                Vals: config.styles?.Vals ?? false,
                Milonga: e.target.checked ?? false 
              })
            }
          />
        }
        label="Include Milonga"
      />

      <Button variant="contained" onClick={saveConfig} sx={{ mt: 2 }}>
        Save Configuration
      </Button>
    </Box>
  );
}

ConfigTab.propTypes = {
  // no props directly passed
};