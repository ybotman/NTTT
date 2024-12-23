//--------
//useConfig.js (Hook)
//--------

"use client";
import { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";

export default function useConfig(gameName) {
  // Remove or limit console logging to prevent spam:
  // console.log("hooks/useConfig", gameName);

  const defaultConfig = {
    numSongs: 10,
    timeLimit: 15,
    levels: [1, 2],
    styles: { Tango: true, Vals: false, Milonga: false },
  };

  const [config, setConfig] = useState(defaultConfig);
  const [isDisabled, setIsDisabled] = useState(false);

  const didLoadRef = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined" && !didLoadRef.current) {
      didLoadRef.current = true;
      const savedConfig = localStorage.getItem(`${gameName}_config`);
      if (savedConfig) {
        try {
          const parsed = JSON.parse(savedConfig) || {};
          // Merge styles to ensure no keys disappear
          const mergedStyles = {
            ...defaultConfig.styles,
            ...(parsed.styles || {}),
          };
          const mergedConfig = {
            ...defaultConfig,
            ...parsed,
            styles: mergedStyles,
          };
          setConfig(mergedConfig);
        } catch (err) {
          console.error("Error parsing config:", err);
          setConfig(defaultConfig);
        }
      } else {
        setConfig(defaultConfig);
      }
    }
  }, [gameName, defaultConfig]);

  const updateConfig = (key, value) => {
    // Consolidate updates in one function
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  // Optionally save config on unmount or on demand:
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined") {
        localStorage.setItem(`${gameName}_config`, JSON.stringify(config));
      }
    };
  }, [config, gameName]);

  return { config, updateConfig, isDisabled };
}

useConfig.propTypes = {
  gameName: PropTypes.string,
};
