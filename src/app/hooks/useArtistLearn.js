//-----------------------------------------------------------------------------
//src/app/hooks/useArtistLearn.js
//-----------------------------------------------------------------------------
//
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import useConfigTab from "@/hooks/useConfigTab";

export default function useArtistLearn() {
  const { config, updateConfig, isDisabled } = useConfigTab("artistLearn");

  // Data from the static JSON
  const [primaryStyles, setPrimaryStyles] = useState([]);
  const [artistOptions, setArtistOptions] = useState([]);
  const [selectedArtists, setSelectedArtists] = useState(config.artists || []);

  // Validation
  const [validationMessage, setValidationMessage] = useState("");

  // Toggling if Levels should be disabled when Artists are chosen
  const levelsDisabled = selectedArtists.length > 0;

  // This ref ensures we only fetch data ONCE even if dev mode double-mounts
  const hasFetchedDataRef = useRef(false);

  useEffect(() => {
    console.log(" - Current Config:", config);
  }, [config]);

  // 1) Validate user’s config
  const validateInputs = useCallback(
    (theConfig) => {
      const c = theConfig || config;
      const numSongs = c.numSongs ?? 10;
      if (numSongs < 3 || numSongs > 25) {
        return "Number of Songs must be between 3 and 25.";
      }

      const timeLimit = c.timeLimit ?? 15;
      if (timeLimit < 3 || timeLimit > 30) {
        return "Time Limit must be between 3 and 30 seconds.";
      }

      const stylesSelected = Object.keys(c.styles || {}).filter(
        (k) => c.styles[k],
      );
      if (stylesSelected.length === 0) {
        return "At least one style must be selected.";
      }

      const hasLevels = (c.levels || []).length > 0;
      const hasArtists = (c.artists || []).length > 0;

      if (!hasLevels && !hasArtists) {
        return "You must select at least one Artist or one Level.";
      }
      if (hasLevels && hasArtists) {
        return "Cannot select both Artists and Levels. Clear one of them.";
      }
      return "";
    },
    [config],
  );

  // 2) Single-time fetch of StyleMaster and ArtistMaster
  useEffect(() => {
    // if we already fetched, skip
    if (hasFetchedDataRef.current) return;

    // Mark that we've fetched so we don't do it again
    hasFetchedDataRef.current = true;

    // ----- Fetch Styles
    const fetchStyles = async () => {
      try {
        const styleData = await fetch(`/songData/StyleMaster.json`).then(
          (res) => res.json(),
        );
        setPrimaryStyles(styleData.primaryStyles || []);

        // If user’s config.styles is empty, set default "Tango"
        if (!config.styles || Object.keys(config.styles).length === 0) {
          updateConfig("styles", { Tango: true });
        }
      } catch (err) {
        console.error("Error fetching StyleMaster.json:", err);
      }
    };

    // ----- Fetch Artist Master
    const fetchArtists = async () => {
      try {
        const artistData = await fetch(`/songData/ArtistMaster.json`).then(
          (res) => res.json(),
        );
        const activeArtists = artistData
          .filter((artist) => artist.active === "true")
          .sort((a, b) => {
            const levelA = parseInt(a.level, 10);
            const levelB = parseInt(b.level, 10);
            return levelA !== levelB
              ? levelA - levelB
              : a.artist.localeCompare(b.artist);
          })
          .map((artist) => ({
            label: `${artist.artist} (Level ${artist.level})`,
            value: artist.artist,
          }));

        setArtistOptions(activeArtists);
      } catch (err) {
        console.error("Error fetching ArtistMaster.json:", err);
      }
    };

    // Kick off both fetches
    fetchStyles();
    fetchArtists();
  }, [config.styles, updateConfig]);

  // 3) Revalidate config on every change
  useEffect(() => {
    const error = validateInputs(config);
    setValidationMessage(error);
  }, [config, validateInputs]);

  // 4) Handlers to update config
  const handleNumSongsChange = (value) => {
    updateConfig("numSongs", value);
    updateConfig("numSongs", value);
  };

  const handleTimeLimitChange = (value) => {
    updateConfig("timeLimit", value);
    updateConfig("timeLimit", value);
  };

  const handleLevelsChange = (newLevels) => {
    if (selectedArtists.length > 0 && newLevels.length > 0) {
      setValidationMessage(
        "Levels not available when artists are selected. Clear artists first.",
      );
      return;
    }
    updateConfig("levels", newLevels);
  };

  const handleStylesChange = (updatedStylesObj) => {
    updateConfig("styles", updatedStylesObj);
  };

  const handleArtistsChange = (newSelected) => {
    if (newSelected.length > 0 && (config.levels || []).length > 0) {
      updateConfig("levels", []);
      setValidationMessage("Clearing levels because artists are selected.");
    }
    setSelectedArtists(newSelected);
    updateConfig("artists", newSelected);
  };

  return {
    config,
    isDisabled,
    primaryStyles,
    artistOptions,
    selectedArtists,
    validationMessage,
    setValidationMessage,
    validateInputs,
    levelsDisabled,

    // Expose handlers
    handleNumSongsChange,
    handleTimeLimitChange,
    handleLevelsChange,
    handleStylesChange,
    handleArtistsChange,
  };
}

useArtistLearn.propTypes = {
  // no external props needed
};
