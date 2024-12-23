//--------------------
//src/app/games/artist-learn/useConfig.js
//---------------------

/*
import { useState, useEffect } from "react";

export default function useConfig(gameName) {
  const defaultConfig = {
    numSongs: 10,
    timeLimit: 15,
    levels: [1, 2],
    styles: { Tango: true, Vals: false, Milonga: false },
  };

  const [config, setConfig] = useState(defaultConfig);
  const [isDisabled, setIsDisabled] = useState(false);
console.log("artist-learn/useConfig. - gameName:", gameName); 
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedConfig = localStorage.getItem(`${gameName}_config`);
      if (savedConfig) {
        try {
          const parsed = JSON.parse(savedConfig) || {};
          // Deep merge styles to ensure no keys disappear
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
  }, [gameName]);

  const updateConfig = (key, value) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const saveConfig = () => {
    localStorage.setItem(`${gameName}_config`, JSON.stringify(config));
  };

  return { config, updateConfig, saveConfig, isDisabled };
}
*/
