//------------------------------------------------------------
// src/app/config/page.js (Configuration Screen with Tabs)
//------------------------------------------------------------
"use client";
import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "@/contexts/AuthContext";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Slider,
  FormControlLabel,
  Checkbox,
  Tabs,
  Tab,
} from "@mui/material";
import { db, doc, setDoc } from "@/utils/firebase";

// Default global config
// global: {expertiseLevel: 3}
// artistQuiz: {songs:10, seconds:15, levels:[1,2]}
function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  };
}

export default function ConfigurationScreen() {
  const { user } = useContext(AuthContext);

  const [tabIndex, setTabIndex] = useState(0);
  const [expertiseLevel, setExpertiseLevel] = useState(3);

  const [aqSongs, setAqSongs] = useState(10);
  const [aqSeconds, setAqSeconds] = useState(15);
  const [aqLevel1, setAqLevel1] = useState(true);
  const [aqLevel2, setAqLevel2] = useState(true);
  const [aqLevel3, setAqLevel3] = useState(false);
  const [aqLevel4, setAqLevel4] = useState(false);
  const [aqLevel5, setAqLevel5] = useState(false);

  useEffect(() => {
    // Load from localStorage
    if (typeof window !== "undefined") {
      const storedExpertise = localStorage.getItem("nttt_expertiseLevel");
      if (storedExpertise) setExpertiseLevel(Number(storedExpertise));

      const storedAqSongs = localStorage.getItem("nttt_aq_songs");
      if (storedAqSongs) setAqSongs(Number(storedAqSongs));

      const storedAqSeconds = localStorage.getItem("nttt_aq_seconds");
      if (storedAqSeconds) setAqSeconds(Number(storedAqSeconds));

      const storedLevels = localStorage.getItem("nttt_aq_levels");
      if (storedLevels) {
        const lvls = JSON.parse(storedLevels);
        setAqLevel1(lvls.includes(1));
        setAqLevel2(lvls.includes(2));
        setAqLevel3(lvls.includes(3));
        setAqLevel4(lvls.includes(4));
        setAqLevel5(lvls.includes(5));
      }
    }
  }, []);

  const saveLocalConfig = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("nttt_expertiseLevel", String(expertiseLevel));
      localStorage.setItem("nttt_aq_songs", String(aqSongs));
      localStorage.setItem("nttt_aq_seconds", String(aqSeconds));
      const selectedLevels = [];
      if (aqLevel1) selectedLevels.push(1);
      if (aqLevel2) selectedLevels.push(2);
      if (aqLevel3) selectedLevels.push(3);
      if (aqLevel4) selectedLevels.push(4);
      if (aqLevel5) selectedLevels.push(5);
      localStorage.setItem("nttt_aq_levels", JSON.stringify(selectedLevels));
      console.log("Config saved locally");
    }
  };

  const saveToFirebase = async () => {
    if (!user) return;
    const selectedLevels = [];
    if (aqLevel1) selectedLevels.push(1);
    if (aqLevel2) selectedLevels.push(2);
    if (aqLevel3) selectedLevels.push(3);
    if (aqLevel4) selectedLevels.push(4);
    if (aqLevel5) selectedLevels.push(5);

    const userRef = doc(db, "users", user.uid);
    await setDoc(
      userRef,
      {
        globalConfig: {
          expertiseLevel,
        },
        artistQuizConfig: {
          songs: aqSongs,
          seconds: aqSeconds,
          levels: selectedLevels,
        },
      },
      { merge: true },
    );
    console.log("Config saved to Firebase");
  };

  const handleChangeTab = (event, newValue) => {
    setTabIndex(newValue);
  };

  return (
    <Box sx={{ p: 3, maxWidth: 600, margin: "auto" }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Configuration
        </Typography>
        <Tabs
          value={tabIndex}
          onChange={handleChangeTab}
          aria-label="config tabs"
        >
          <Tab label="Global Config" {...a11yProps(0)} />
          <Tab label="Artist Quiz Config" {...a11yProps(1)} />
        </Tabs>
        {tabIndex === 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography gutterBottom>
              Expertise Level: {expertiseLevel}
            </Typography>
            <Slider
              value={expertiseLevel}
              min={1}
              max={5}
              step={1}
              onChange={(e, val) => setExpertiseLevel(val)}
            />
          </Box>
        )}
        {tabIndex === 1 && (
          <Box sx={{ mt: 3 }}>
            <TextField
              label="# of Songs"
              type="number"
              value={aqSongs}
              onChange={(e) => setAqSongs(Number(e.target.value))}
              fullWidth
              sx={{ mb: 2 }}
            />
            <TextField
              label="Seconds per Song"
              type="number"
              value={aqSeconds}
              onChange={(e) => setAqSeconds(Number(e.target.value))}
              fullWidth
              sx={{ mb: 2 }}
            />
            <Typography variant="body1" gutterBottom>
              Levels (Check all that apply):
            </Typography>
            <FormControlLabel
              control={
                <Checkbox
                  checked={aqLevel1}
                  onChange={(e) => setAqLevel1(e.target.checked)}
                />
              }
              label="Level 1"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={aqLevel2}
                  onChange={(e) => setAqLevel2(e.target.checked)}
                />
              }
              label="Level 2"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={aqLevel3}
                  onChange={(e) => setAqLevel3(e.target.checked)}
                />
              }
              label="Level 3"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={aqLevel4}
                  onChange={(e) => setAqLevel4(e.target.checked)}
                />
              }
              label="Level 4"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={aqLevel5}
                  onChange={(e) => setAqLevel5(e.target.checked)}
                />
              }
              label="Level 5"
            />
          </Box>
        )}
        <Box sx={{ mt: 3 }}>
          <Button variant="contained" onClick={saveLocalConfig}>
            Save Locally
          </Button>
          {user && (
            <Button variant="contained" sx={{ ml: 2 }} onClick={saveToFirebase}>
              Save to Firebase
            </Button>
          )}
        </Box>
      </Paper>
    </Box>
  );
}

ConfigurationScreen.propTypes = {};
