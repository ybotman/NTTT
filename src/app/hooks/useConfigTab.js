"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import PropTypes from "prop-types";

export default function useConfigTab(gameName) {
  console.log("@/hooks/useConfigTab gameName", gameName);

  // 1) Wrap defaultConfig in useMemo to avoid re-creation each render
  const defaultConfig = useMemo(
    () => ({
      numSongs: 10,
      timeLimit: 15,
      levels: [1, 2],
      styles: { Tango: true, Vals: false, Milonga: false },
    }),
    [],
  );

  const [config, setConfig] = useState(defaultConfig);

  // 2) If 'isDisabled' isn’t used anywhere, remove or comment out:
  //    If you do intend to use it, keep it but handle it somewhere.
  // const [isDisabled, setIsDisabled] = useState(false);
  const isDisabled = false; // or remove entirely

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

useConfigTab.propTypes = {
  gameName: PropTypes.string,
};
