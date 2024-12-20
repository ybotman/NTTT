//--------------------------------------------------
//src/app/games/test/page.js
//--------------------------------------------------

"use client";
import React, { useState, useRef, useEffect } from "react";
import { Box, Typography, Button, Stack } from "@mui/material";
import WaveSurfer from "wavesurfer.js";

// Playback configuration
const PLAY_DURATION = 2; // seconds
const SEEK_TIME = 25; // seconds

const song = {
  audioUrl:
    "https://namethattangotune.blob.core.windows.net/djsongs/0c38db2d-4228-4b31-867f-95075a6a6a02.mp3",
};

export default function SongList() {
  const [pageState, setPageState] = useState("Stopped");
  const [isPlaying, setIsPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [duration, setDuration] = useState(0);

  const wavesurferRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const ws = WaveSurfer.create({
      container: document.createElement("div"),
      waveColor: "transparent",
      progressColor: "transparent",
      barWidth: 0,
      height: 0,
      backend: "MediaElement",
    });

    ws.on("ready", () => {
      setReady(true);
      setPageState("Ready");
      setDuration(ws.getDuration());
    });

    ws.on("error", (err) => console.error("Wavesurfer error:", err));

    ws.load(song.audioUrl);

    wavesurferRef.current = ws;

    return () => {
      ws.destroy();
    };
  }, []);

  const handleStartWavesurfer = () => {
    const ws = wavesurferRef.current;
    if (!ws) return;

    if (isPlaying) {
      // Stop playback
      ws.pause();
      ws.seekTo(0);
      setPageState("Stopped");
      setIsPlaying(false);
    } else {
      if (!ready || duration === 0) return;
      const seekPercent = SEEK_TIME / duration;
      ws.seekTo(Math.min(seekPercent, 1));
      ws.play();
      setPageState("Playing");
      setIsPlaying(true);

      setTimeout(() => {
        ws.pause();
        ws.seekTo(0);
        setPageState("Stopped");
        setIsPlaying(false);
      }, PLAY_DURATION * 1000);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Song Player
      </Typography>

      <Typography variant="body1" gutterBottom>
        Play Duration: {PLAY_DURATION}s, Seek Time: {SEEK_TIME}s
      </Typography>

      <Box sx={{ border: "1px solid #ccc", p: 2, borderRadius: 2 }}>
        <Typography variant="body2" sx={{ mb: 2 }}>
          URL: {song.audioUrl}
        </Typography>

        <Stack
          direction="row"
          spacing={4}
          alignItems="flex-start"
          flexWrap="wrap"
        >
          <Box>
            <Button
              variant="contained"
              color={isPlaying ? "error" : "primary"}
              onClick={handleStartWavesurfer}
              sx={{ mt: 1 }}
              disabled={!ready && !isPlaying}
            >
              {isPlaying ? "Stop" : ready ? "Start" : "Loading..."}
            </Button>
            <Typography variant="body2">State: {pageState}</Typography>
          </Box>
        </Stack>
      </Box>
    </Box>
  );
}
