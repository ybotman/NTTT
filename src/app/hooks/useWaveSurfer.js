//-----------------------------------------------------------------------------
// src/app/hooks/useWaveSurfer.js
//-----------------------------------------------------------------------------
"use client";

import { useRef, useCallback } from "react";
import WaveSurfer from "wavesurfer.js";

export default function useWaveSurfer({ onSongEnd }) {
  const waveSurferRef = useRef(null);
  const fadeIntervalRef = useRef(null);

  // 1) Init
  const initWaveSurfer = useCallback(() => {
    if (waveSurferRef.current) {
      console.warn("WaveSurfer is already initialized.");
      return;
    }
    waveSurferRef.current = WaveSurfer.create({
      container: document.createElement("div"),
      waveColor: "transparent",
      progressColor: "transparent",
      barWidth: 0,
      height: 0,
      backend: "WebAudio",
    });
    waveSurferRef.current.on("finish", () => {
      if (onSongEnd) onSongEnd();
    });
    waveSurferRef.current.on("error", (err) => {
      if (err?.name === "AbortError") {
        console.info("WaveSurfer fetch aborted - ignoring...");
        return;
      }
      console.error("WaveSurfer error:", err);
      if (onSongEnd) onSongEnd();
    });
  }, [onSongEnd]);

  // 2) Cleanup
  const cleanupWaveSurfer = useCallback(() => {
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }
    if (waveSurferRef.current) {
      try {
        waveSurferRef.current.destroy();
      } catch (err) {
        console.warn("WaveSurfer destroy error (ignored):", err);
      }
      waveSurferRef.current = null;
    }
  }, []);

  // 3) Load
  const loadSong = useCallback((songUrl, onReady) => {
    if (!waveSurferRef.current) {
      console.error("WaveSurfer is not initialized.");
      return;
    }
    waveSurferRef.current.once("ready", () => {
      if (onReady) onReady();
    });
    waveSurferRef.current.load(songUrl);
  }, []);

  // 4) Fade
  const fadeVolume = useCallback((fromVol, toVol, durationSec, callback) => {
    if (!waveSurferRef.current) {
      console.error("WaveSurfer is not initialized.");
      return;
    }
    const steps = 15;
    const stepTime = (durationSec * 1000) / steps;
    let currentStep = 0;
    const volumeStep = (toVol - fromVol) / steps;
    let currentVol = fromVol;

    fadeIntervalRef.current = setInterval(() => {
      currentStep++;
      currentVol += volumeStep;
      waveSurferRef.current.setVolume(Math.max(0, Math.min(currentVol, 1)));
      if (currentStep >= steps) {
        clearInterval(fadeIntervalRef.current);
        fadeIntervalRef.current = null;
        if (callback) callback();
      }
    }, stepTime);
  }, []);

  // 5) Play snippet => random start + fade in
  const playSnippet = useCallback(
    (
      songUrl,
      {
        snippetMaxStart = 90,
        fadeDurationSec = 1.0,
        onPlaySuccess,
        onPlayError,
      },
    ) => {
      if (!waveSurferRef.current) {
        console.error("WaveSurfer is not initialized. Call initWaveSurfer().");
        return;
      }
      loadSong(songUrl, () => {
        const ws = waveSurferRef.current;
        if (!ws) return;

        // random snippet
        const dur = ws.getDuration();
        const randomStart = Math.floor(Math.random() * snippetMaxStart);
        ws.seekTo(Math.min(randomStart, dur - 1) / dur);

        // play => fade in
        ws.play()
          .then(() => {
            ws.setVolume(0);
            fadeVolume(0, 1, fadeDurationSec, () => {
              if (onPlaySuccess) onPlaySuccess();
            });
          })
          .catch((err) => {
            console.error("WaveSurfer play error:", err);
            if (onPlayError) onPlayError(err);
          });
      });
    },
    [loadSong, fadeVolume],
  );

  // 6) Toggle (optional)
  const togglePlay = useCallback(() => {
    if (!waveSurferRef.current) {
      console.error("WaveSurfer is not initialized.");
      return;
    }
    if (waveSurferRef.current.isPlaying()) {
      waveSurferRef.current.pause();
    } else {
      waveSurferRef.current.play();
    }
  }, []);

  return {
    waveSurferRef,
    initWaveSurfer,
    cleanupWaveSurfer,
    loadSong,
    fadeVolume,
    togglePlay,
    playSnippet, // new snippet logic
  };
}
