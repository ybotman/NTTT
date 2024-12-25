"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import useConfigTab from "@/hooks/useConfigTab";
import { fetchFilteredSongs } from "@/utils/dataFetching";
import PropTypes from "prop-types";

// This custom hook manages the specific logic for ArtistLearn:
//  * It fetches style + artist data once
//  * It provides validation logic for config
//  * It no longer auto-fetches final songs -- that’s done on "Play" click
export default function useArtistLearn() {
  const { config, updateConfig, isDisabled } = useConfigTab("artistLearn");

  // Basic data from static .json
  const [primaryStyles, setPrimaryStyles] = useState([]);
  const [artistOptions, setArtistOptions] = useState([]);
  const [selectedArtists, setSelectedArtists] = useState(config.artists || []);

  // Validation
  const [validationMessage, setValidationMessage] = useState("");

  // For toggling if Levels should be disabled when Artists are chosen
  const levelsDisabled = selectedArtists.length > 0;

  // Refs
  const isMountedRef = useRef(false);

  // 1) Validate user’s config
  const validateInputs = useCallback(
    (c) => {
      const theConfig = c || config;
      const numSongs = theConfig.numSongs ?? 10;
      if (numSongs < 3 || numSongs > 25) {
        return "Number of Songs must be between 3 and 25.";
      }

      const timeLimit = theConfig.timeLimit ?? 15;
      if (timeLimit < 3 || timeLimit > 30) {
        return "Time Limit must be between 3 and 30 seconds.";
      }

      const stylesSelected = Object.keys(theConfig.styles || {}).filter(
        (k) => theConfig.styles[k],
      );
      if (stylesSelected.length === 0) {
        return "At least one style must be selected.";
      }

      const hasLevels = (theConfig.levels || []).length > 0;
      const hasArtists = (theConfig.artists || []).length > 0;

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

  // 2) On first mount, fetch style + artist data from local .json
  useEffect(() => {
    isMountedRef.current = true;

    // ----- Fetch Styles
    (async () => {
      try {
        const styleData = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_PATH || ""}/songData/StyleMaster.json`,
        ).then((res) => res.json());

        if (isMountedRef.current) {
          setPrimaryStyles(styleData.primaryStyles || []);
          // If user’s config styles is empty, set default "Tango"
          if (!config.styles || Object.keys(config.styles).length === 0) {
            updateConfig("styles", { Tango: true });
          }
        }
      } catch (err) {
        console.error("Error fetching StyleMaster.json:", err);
      }
    })();

    // ----- Fetch Artist Master
    (async () => {
      try {
        const artistData = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_PATH || ""}/songData/ArtistMaster.json`,
        ).then((res) => res.json());

        console.log("ArtistMaster fetched, total length:", artistData.length);

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

        if (isMountedRef.current) {
          setArtistOptions(activeArtists);
        }
      } catch (err) {
        console.error("Error fetching ArtistMaster.json:", err);
      }
    })();

    return () => {
      isMountedRef.current = false;
    };
  }, [config.styles, updateConfig]);

  // 3) Watch config changes and re-validate
  useEffect(() => {
    const error = validateInputs(config);
    setValidationMessage(error);
  }, [config, validateInputs]);

  // 4) Handlers to update config state
  const handleNumSongsChange = (value) => {
    updateConfig("numSongs", value);
  };

  const handleTimeLimitChange = (value) => {
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
  // no props needed, it uses useConfigTab internally
};
