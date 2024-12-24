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
  const [selectedArtists, setSelectedArtists] = useState(config.artists || []);
  const [validationMessage, setValidationMessage] = useState("");
  const isMountedRef = useRef(false);
  const [configChanged, setConfigChanged] = useState(false);
  const levelsDisabled = selectedArtists.length > 0;
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

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
    const hasArtists = (config.artists || []).length > 0;
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

  useEffect(() => {
    isMountedRef.current = true;

    (async () => {
      try {
        const styleData = await fetch(
          `${basePath}/songData/StyleMaster.json`,
        ).then((res) => res.json());
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

    (async () => {
      try {
        const artistData = await fetch(
          `${basePath}/songData/ArtistMaster.json`,
        ).then((res) => res.json());
        console.log("ArtistMaster await path:", `${basePath}/songData/ArtistMaster.json`, "returns qty: ", artistData.length);
        
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
  }, [config.styles, updateConfig, validateInputs]);

  useEffect(() => {
    if (!configChanged) return;

    let mounted = true;
    const validationErr = validateInputs();
    if (validationErr) {
      setValidationMessage(validationErr);
      setConfigChanged(false);
      return;
    }
    setValidationMessage("");

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
  //}, []);
     }, [configChanged, validateInputs, config, selectedArtists, onSongsFetched]);

  return {
    config,
    isDisabled,
    primaryStyles,
    artistOptions,
    selectedArtists,
    validationMessage,
    levelsDisabled,
    handleNumSongsChange: (value) => {
      updateConfig("numSongs", value);
      setConfigChanged(true);
    },
    handleTimeLimitChange: (value) => {
      updateConfig("timeLimit", value);
      setConfigChanged(true);
    },
    handleLevelsChange: (newLevels) => {
      if (selectedArtists.length > 0 && newLevels.length > 0) {
        setValidationMessage(
          "Levels not available when artists are selected. Clear artists first.",
        );
        return;
      }
      updateConfig("levels", newLevels);
      setConfigChanged(true);
    },
    handleStylesChange: (updatedStylesObj) => {
      updateConfig("styles", updatedStylesObj);
      setConfigChanged(true);
    },
    handleArtistsChange: (newSelected) => {
      if (newSelected.length > 0 && (config.levels || []).length > 0) {
        updateConfig("levels", []);
        setValidationMessage("Clearing levels because artists are selected.");
      }
      setSelectedArtists(newSelected);
      updateConfig("artists", newSelected);
      setConfigChanged(true);
    },
  };
}
