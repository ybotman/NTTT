//-------------------------
// src/hooks/useArtistLearn.js
//-------------------------
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import useConfigTab from "@/hooks/useConfigTab";
import { fetchFilteredSongs } from "@/utils/dataFetching";

export default function useArtistLearn(onSongsFetched) {
  const { config, updateConfig, isDisabled } = useConfigTab("artistLearn");
  const [primaryStyles, setPrimaryStyles] = useState([]);
  const [artistOptions, setArtistOptions] = useState([]);
  // local mirror or optional
  const [selectedArtists, setSelectedArtists] = useState(config.artists || []);
  const [validationMessage, setValidationMessage] = useState("");

  const isMountedRef = useRef(false);
  const [configChanged, setConfigChanged] = useState(false);

  // If user selects artists, we might want to disable levels
  const levelsDisabled = selectedArtists.length > 0;

  // Validate
  const validateInputs = useCallback(() => {
    const numSongs = config.numSongs ?? 10;
    if (numSongs < 3 || numSongs > 25)
      return "Number of Songs must be between 3 and 25.";

    const timeLimit = config.timeLimit ?? 15;
    if (timeLimit < 3 || timeLimit > 30)
      return "Time Limit must be between 3 and 30 seconds.";

    const stylesSelected = Object.keys(config.styles || {}).filter(
      (k) => config.styles[k],
    );
    if (stylesSelected.length === 0)
      return "At least one style must be selected.";

    const hasLevels = (config.levels || []).length > 0;
    const hasArtists = (config.artists || []).length > 0; // or selectedArtists
    if (!hasLevels && !hasArtists) {
      return "You must select at least one Artist or at least one Level.";
    }
    if (hasLevels && hasArtists) {
      return "Cannot select both Artists and Levels. Clear one of them.";
    }
    return "";
  }, [
    config.numSongs,
    config.timeLimit,
    config.levels,
    config.styles,
    config.artists,
  ]);

  // 4) Fetch data once on mount (StyleMaster & ArtistMaster)
  useEffect(() => {
    isMountedRef.current = true;

    // fetch style data
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
      } catch (err) {
        console.error("Error fetching StyleMaster.json:", err);
      }
    })();

    // fetch artist data
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
      } catch (err) {
        console.error("Error fetching ArtistMaster.json:", err);
      }
    })();

    return () => {
      isMountedRef.current = false;
    };
  }, []); //[config.styles, updateConfig, validateInputs]);
  // or do an empty array and disable the ESLint rule

  // 5) Mark config changed => triggers re-fetch if valid
  const markConfigChanged = () => {
    setConfigChanged(true);
    console.log("Config changed:", config);
  };

  // 6) Handlers for the UI to call
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
  const handleLevelsChange = (newLevels) => {
    // same logic as in your code
    if (selectedArtists.length > 0 && newLevels.length > 0) {
      setValidationMessage(
        "Levels not available when artists are selected. Clear artists first.",
      );
      return;
    }
    updateConfig("levels", newLevels);
    console.log("-->levels changed to", newLevels);
    markConfigChanged();
  };
  const handleStylesChange = (updatedStylesObj) => {
    updateConfig("styles", updatedStylesObj);
    console.log("-->styles changed to", updatedStylesObj);
    markConfigChanged();
  };
  const handleArtistsChange = (newSelected) => {
    // Clear levels if artists are selected
    if (newSelected.length > 0 && (config.levels || []).length > 0) {
      updateConfig("levels", []);
      setValidationMessage("Clearing levels because artists are selected.");
    }
    setSelectedArtists(newSelected);

    // Also store in config for consistency
    updateConfig("artists", newSelected);

    markConfigChanged();
  };

  // 7) Re-fetch songs if config changed & validated
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
      } catch (err) {
        console.error("Error fetching filtered songs:", err);
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

  // 8) Return everything your UI needs
  return {
    // from useConfigTab
    config,
    isDisabled,

    // local states
    primaryStyles,
    artistOptions,
    selectedArtists,
    validationMessage,
    levelsDisabled,

    // handlers
    handleNumSongsChange,
    handleTimeLimitChange,
    handleLevelsChange,
    handleStylesChange,
    handleArtistsChange,
  };
}
