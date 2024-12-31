//-----------------------------------------------------------------------------
// src/app/hooks/useWaveSurfer.js
//-----------------------------------------------------------------------------
"use client";

import { useRef, useCallback } from "react";
import WaveSurfer from "wavesurfer.js";

export default function useWaveSurfer({ onSongEnd }) {
  const waveSurferRef = useRef(null);
  const fadeIntervalRef = useRef(null);

  /**
   * 1) Initialize WaveSurfer instance (only once).
   *    If waveSurferRef.current is already set, do nothing.
   */
  const initWaveSurfer = useCallback(() => {
    if (waveSurferRef.current) {
      // Already initialized => skip re-create
      console.warn("WaveSurfer is already initialized.");
      return;
    }

    waveSurferRef.current = WaveSurfer.create({
      container: document.createElement("div"), // Invisible container
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
      // If it's an AbortError, we ignore the spam
      if (err?.name === "AbortError") {
        console.info("WaveSurfer fetch aborted - ignoring...");
        return;
      }
      console.error("WaveSurfer error:", err);
      if (onSongEnd) onSongEnd();
    });
  }, [onSongEnd]);

  /**
   * 2) Cleanup (destroy) WaveSurfer instance.
   *    Wrap in try/catch to avoid AbortError spam.
   */
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

  /**
   * 3) Load a new song (URL).
   *    Only if waveSurferRef.current is non-null.
   */
  const loadSong = useCallback((songUrl, onReady) => {
    if (!waveSurferRef.current) {
      console.error("WaveSurfer is not initialized. Call initWaveSurfer() first.");
      return;
    }

    waveSurferRef.current.once("ready", () => {
      if (onReady) onReady();
    });

    waveSurferRef.current.load(songUrl);
  }, []);

  /**
   * 4) Fade Volume
   */
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

  /**
   * 5) Optional togglePlay
   */
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
  };
}