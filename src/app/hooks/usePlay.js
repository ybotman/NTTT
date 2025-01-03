// -------------------------------------------
// src/app/hooks/usePlay.js
// -------------------------------------------
"use client";

import { useState, useCallback } from "react";

// We'll assume you have a JSON file at /public/songData/PlayPhrases.json
// that looks like: { "phrases": ["Game on!", "Make it happen!", "Let's roll!", ... ] }

export default function usePlay() {
  const [phrases, setPhrases] = useState([]);

  // Fetch or re-use phrases, then return one random phrase.
  const getGoPhrase = useCallback(async () => {
    try {
      if (phrases.length > 0) {
        const idx = Math.floor(Math.random() * phrases.length);
        return phrases[idx];
      }
      // Else fetch from /songData/PlayPhrases.json
      const resp = await fetch("/songData/PlayPhrases.json");
      const data = await resp.json();
      if (!data?.phrases || data.phrases.length === 0) {
        console.warn("No phrases in PlayPhrases.json!");
        return "Start!";
      }
      setPhrases(data.phrases);
      const idx = Math.floor(Math.random() * data.phrases.length);
      return data.phrases[idx];
    } catch (err) {
      console.error("Error in getGoPhrase:", err);
      return "Go!"; // fallback
    }
  }, [phrases]);

  return {
    getGoPhrase,
  };
}
