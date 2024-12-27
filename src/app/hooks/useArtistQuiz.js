//----------------------------------------------------------------------------- 
//src/app/hooks/useArtistQuiz.jss
//-----------------------------------------------------------------------------
import { useState, useEffect } from "react";

export default function useConfig(gameName) {
  const [config, setConfig] = useState({
    numSongs: 10,
    timeLimit: 15,
    levels: [1, 2],
    styles: { Tango: true, Vals: false, Milonga: false },
  });

  //  const [isDisabled, setIsDisabled] = useState(false);

  useEffect(() => {
    const savedConfig = localStorage.getItem(`${gameName}_config`);
    if (savedConfig) setConfig(JSON.parse(savedConfig));
  }, [gameName]);

  const updateConfig = (key, value) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const saveConfig = () => {
    localStorage.setItem(`${gameName}_config`, JSON.stringify(config));
  };

  return { config, updateConfig, saveConfig }; // isDisabled };
}
