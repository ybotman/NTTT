"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Box, Typography, Button, Stack } from '@mui/material';
import WaveSurfer from 'wavesurfer.js';

// Playback configuration
const PLAY_DURATION = 10; // seconds
const SEEK_TIME = 15 // seconds

const song = {
  //audioUrl: "https://namethattangotune.blob.core.windows.net/djsongs/06078921-51be-406d-8800-34c1c4e5d2c7.mp3",
  //audioUrl: "https://namethattangotune.blob.core.windows.net/djsongs/0c38db2d-4228-4b31-867f-95075a6a6a02.mp3",
  audioUrl: "https://namethattangotune.blob.core.windows.net/djsongs/002c2530-9c81-46a0-9eb1-400a00710e3d.mp3",
  //audioUrl: "",
};

export default function SongList() {
  const [pageState, setPageState] = useState('Stopped');
  const [isPlaying, setIsPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  const wavesurferRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !isInitialized) return;

    const ws = WaveSurfer.create({
      container: document.createElement('div'),
      waveColor: 'transparent',
      progressColor: 'transparent',
      barWidth: 0,
      height: 0,
      backend: 'MediaElement',
    });

    ws.on('ready', () => {
      setReady(true);
      setPageState('Ready');
      setDuration(ws.getDuration());
    });

    ws.on('error', (err) => console.error("Wavesurfer error:", err));

    ws.load(song.audioUrl);

    wavesurferRef.current = ws;

    return () => {
      ws.destroy();
    };
  }, [isInitialized]);

  const handleStartWavesurfer = () => {
    if (!wavesurferRef.current) return;
    const ws = wavesurferRef.current;

    if (isPlaying) {
      // Stop playback
      ws.pause();
      ws.seekTo(0);
      setPageState('Stopped');
      setIsPlaying(false);
    } else {
      if (!ready || duration === 0) return;
      const seekPercent = SEEK_TIME / duration;
      ws.seekTo(Math.min(seekPercent, 1));
      ws.play();
      setPageState('Playing');
      setIsPlaying(true);

      setTimeout(() => {
        ws.pause();
        ws.seekTo(0);
        setPageState('Stopped');
        setIsPlaying(false);
      }, PLAY_DURATION * 1000);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>Song Player</Typography>
      
      {!isInitialized && (
        <Button
          variant="contained"
          onClick={() => setIsInitialized(true)}
          sx={{ mb: 2 }}
        >
          Initialize Player
        </Button>
      )}

      <Typography variant="body1" gutterBottom>
        Play Duration: {PLAY_DURATION}s, Seek Time: {SEEK_TIME}s
      </Typography>

      <Box sx={{ border: '1px solid #ccc', p: 2, borderRadius: 2 }}>
        <Typography variant="body2" sx={{ mb: 2 }}>URL: {song.audioUrl}</Typography>

        <Stack direction="row" spacing={4} alignItems="flex-start" flexWrap="wrap">
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
/*

  {
    audioUrl: "http://127.0.0.1:8080/0ab22eaa-911b-5a24-83c2-f1cf64de8294.mp3 ",
    Style: "Milonga",
  },
  {
    audioUrl: "https://namethattangotune.blob.core.windows.net/djsongs/068f24b4-4fbe-4886-9d9d-dfd9196ef9aa.mp3",
    Style: "Vals",
  },
  {
    audioUrl: "https://namethattangotune.blob.core.windows.net/djsongs/0c38db2d-4228-4b31-867f-95075a6a6a02.mp3",
    Style: "Milonga",
  },
  {
    audioUrl: "https://namethattangotune.blob.core.windows.net/djsongs/06078921-51be-406d-8800-34c1c4e5d2c7.mp3",
    Style: "Tango Nuevo",
  },
  {
    audioUrl: "http://127.0.0.1:8080/0ab22eaa-911b-5a24-83c2-f1cf64de8294.mp3 ",
    Style: "Milonga",
  },
  {
    audioUrl: "http://10.0.0.54:8080/0ac04549-6fcd-55ad-9f4d-cec62bc1ceff.mp3",
    Style: "Milonga",
  },
  {
    audioUrl: "http://10.0.0.54:8080/0b1bfe20-11cd-5066-ad1c-b9e378f169b1.mp3",
    Style: "Milonga",
  },
  {
    audioUrl: "http://10.0.0.54:8080/0b9ec3cd-00b5-5be3-8c6f-96a96b969a47.mp3",
    Style: "Milonga",
  },
  {
    audioUrl: "http://10.0.0.54:8080/0b865fc9-e1e4-5f1c-a6d1-436738953caf.mp3",
    Style: "Milonga",
  },
  {
    audioUrl: "http://10.0.0.54:8080/0b8800a5-8c13-5311-b065-1e3baf2ed1c0.mp3",
    Style: "Milonga",
  },
  {
    audioUrl: "http://10.0.0.54:8080/0bad59cf-a4d3-5b6e-af8b-34653a0f6277.mp3",
    Style: "Milonga",
  },
   {
    audioUrl: "http://127.0.0.1:8080/0ab22eaa-911b-5a24-83c2-f1cf64de8294.mp3 ",
    Style: "Milonga",
  },
      {
    audioUrl: "http://10.0.0.54:8080/0ac04549-6fcd-55ad-9f4d-cec62bc1ceff.mp3",
    Style: "Milonga",
  },
        {
    audioUrl: "http://10.0.0.54:8080/0b1bfe20-11cd-5066-ad1c-b9e378f169b1.mp3",
    Style: "Milonga",
  },
          {
    audioUrl: "http://10.0.0.54:8080/0b9ec3cd-00b5-5be3-8c6f-96a96b969a47.mp3",
    Style: "Milonga",
  },
            {
    audioUrl: "http://10.0.0.54:8080/0b865fc9-e1e4-5f1c-a6d1-436738953caf.mp3",
    Style: "Milonga",
  },
              {
    audioUrl: "http://10.0.0.54:8080/0b8800a5-8c13-5311-b065-1e3baf2ed1c0.mp3",
    Style: "Milonga",
  },
                {
    audioUrl: "http://10.0.0.54:8080/0bad59cf-a4d3-5b6e-af8b-34653a0f6277.mp3",
    Style: "Milonga",
  },

  */