//-----------------------------------------------------------------------------
// src/app/hooks/usePlay.js
//-----------------------------------------------------------------------------
"use client";

import { useRef, useCallback, useState } from "react";
import WaveSurfer from "wavesurfer.js";

/**
 * A custom hook to handle shared waveSurfer logic:
 *  - waveSurfer creation
 *  - fadeVolume
 *  - cleanup/destroy
 *  - loading new audio & starting playback
 */
export default function usePlay() {
  // Internal references
  const waveSurferRef = useRef(null);
  const fadeIntervalRef = useRef(null);
  const [isWaveReady, setIsWaveReady] = useState(false);

  // ------------------------------------------------------------
  // 1) CLEANUP
  // ------------------------------------------------------------
  const cleanupWaveSurfer = useCallback(() => {
    if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
    fadeIntervalRef.current = null;

    if (waveSurferRef.current) {
      // Destroys waveSurfer, aborts ongoing loads
      waveSurferRef.current.destroy();
      waveSurferRef.current = null;
    }

    setIsWaveReady(false);
  }, []);

  // ------------------------------------------------------------
  // 2) FADE VOLUME
  // ------------------------------------------------------------
  const fadeVolume = useCallback((fromVol, toVol, durationSec, callback) => {
    if (!waveSurferRef.current) return;
    const steps = 15;
    const stepTime = (durationSec * 1000) / steps;
    const volumeStep = (toVol - fromVol) / steps;

    let currentStep = 0;
    let currentVol = fromVol;

    fadeIntervalRef.current = setInterval(() => {
      currentStep++;
      currentVol += volumeStep;
      waveSurferRef.current?.setVolume(Math.min(Math.max(currentVol, 0), 1));
      if (currentStep >= steps) {
        clearInterval(fadeIntervalRef.current);
        fadeIntervalRef.current = null;
        if (callback) callback();
      }
    }, stepTime);
  }, []);

  // ------------------------------------------------------------
  // 3) LOAD & PLAY
  // ------------------------------------------------------------
  const loadAndPlay = useCallback(
    (audioUrl, onSuccess, onError, randomStartSeconds = 0, fadeTime = 1.0) => {
      cleanupWaveSurfer(); // ensure old wavesurfer is gone
      if (!audioUrl) {
        onError?.(new Error("No audioUrl provided"));
        return;
      }

      // Create waveSurfer
      const ws = WaveSurfer.create({
        container: document.createElement("div"),
        waveColor: "transparent",
        progressColor: "transparent",
        barWidth: 0,
        height: 0,
        backend: "WebAudio",
        volume: 0, // start silent
      });

      waveSurferRef.current = ws;

      ws.on("ready", () => {
        setIsWaveReady(true);

        const dur = ws.getDuration();
        const safeStart = Math.min(randomStartSeconds, Math.max(dur - 1, 0));
        ws.seekTo(safeStart / dur);

        ws.play()
          .then(() => {
            // fade in
            fadeVolume(0, 1.0, fadeTime, () => {
              onSuccess?.(ws);
            });
          })
          .catch((err) => {
            console.error("WaveSurfer play() error:", err);
            onError?.(err);
          });
      });

      ws.on("error", (err) => {
        console.error("WaveSurfer error:", err);
        onError?.(err);
      });

      ws.load(audioUrl);
    },
    [cleanupWaveSurfer, fadeVolume],
  );

  // ------------------------------------------------------------
  // 4) STOP
  // ------------------------------------------------------------
  const stopAudio = useCallback(() => {
    if (waveSurferRef.current) {
      waveSurferRef.current.stop();
    }
  }, []);

  // ------------------------------------------------------------
  // Return the shared methods & refs
  // ------------------------------------------------------------
  return {
    waveSurferRef,
    isWaveReady,

    // Main methods
    cleanupWaveSurfer,
    fadeVolume,
    loadAndPlay,
    stopAudio,
  };
}
