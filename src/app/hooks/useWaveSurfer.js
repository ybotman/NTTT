//-----------------------------------------------------------------------------
//src/app/hooks/useWaveSurfer.js
//-----------------------------------------------------------------------------

"use client";

import { useRef, useCallback } from "react";
import WaveSurfer from "wavesurfer.js";

export default function useWaveSurfer({ onSongEnd }) {
  const waveSurferRef = useRef(null);
  const fadeIntervalRef = useRef(null);

  // ------------------------------------------------------
  // Initialize WaveSurfer instance
  // ------------------------------------------------------
  const initWaveSurfer = useCallback(() => {
    if (waveSurferRef.current) {
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
      console.error("WaveSurfer error:", err);
      if (onSongEnd) onSongEnd();
    });
  }, [onSongEnd]);

  // ------------------------------------------------------
  // Cleanup WaveSurfer instance
  // ------------------------------------------------------
  const cleanupWaveSurfer = useCallback(() => {
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }

    if (waveSurferRef.current) {
      waveSurferRef.current.destroy();
      waveSurferRef.current = null;
    }
  }, []);

  // ------------------------------------------------------
  // Load a new song
  // ------------------------------------------------------
  const loadSong = useCallback((songUrl, onReady) => {
    if (!waveSurferRef.current) {
      console.error("WaveSurfer is not initialized.");
      return;
    }

    waveSurferRef.current.on("ready", () => {
      if (onReady) onReady();
    });

    waveSurferRef.current.load(songUrl);
  }, []);

  // ------------------------------------------------------
  // Fade Volume
  // ------------------------------------------------------
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

  // ------------------------------------------------------
  // Play or Pause
  // ------------------------------------------------------
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
