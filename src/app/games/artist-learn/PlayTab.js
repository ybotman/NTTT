//--------
//src/app/games/artist-learn/PlayTab.js
//--------

"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import PropTypes from "prop-types";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Stack,
  Button,
} from "@mui/material";
import WaveSurfer from "wavesurfer.js";

export default function PlayTab({ songs, config, onCancel }) {
  const wavesurferRef = useRef(null);
  const playTimeoutRef = useRef(null);
  const fadeIntervalRef = useRef(null);
  const listRef = useRef(null);

  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [ready, setReady] = useState(false);

  const PLAY_DURATION = Math.min(config.timeLimit ?? 15, 15);
  const FADE_DURATION = 0.75; // 0.75 seconds fade in/out

  const cleanupWaveSurfer = useCallback(() => {
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }
    if (wavesurferRef.current) {
      wavesurferRef.current.destroy();
      wavesurferRef.current = null;
    }
    if (playTimeoutRef.current) {
      clearTimeout(playTimeoutRef.current);
      playTimeoutRef.current = null;
    }
    setReady(false);
    setDuration(0);
  }, []);

  const fadeVolume = useCallback((fromVol, toVol, durationSec, callback) => {
    if (!wavesurferRef.current) return;
    const steps = 15; // number of steps in fade
    const stepTime = (durationSec * 1000) / steps;
    let currentStep = 0;
    const volumeStep = (toVol - fromVol) / steps;
    let currentVol = fromVol;

    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
    }

    fadeIntervalRef.current = setInterval(() => {
      currentStep++;
      currentVol += volumeStep;
      if (currentVol < 0) currentVol = 0;
      if (currentVol > 1) currentVol = 1;
      if (wavesurferRef.current) {
        wavesurferRef.current.setVolume(currentVol);
      }

      if (currentStep >= steps) {
        clearInterval(fadeIntervalRef.current);
        fadeIntervalRef.current = null;
        if (callback) callback();
      }
    }, stepTime);
  }, []);

  const handleNextSong = useCallback(() => {
    cleanupWaveSurfer();
    if (currentIndex + 1 < songs.length) {
      setCurrentIndex((prevIndex) => prevIndex + 1);
    } else {
      // End of playlist
      setIsPlaying(false);
      setCurrentIndex(-1);
    }
  }, [cleanupWaveSurfer, currentIndex, songs.length]);

  const startPlaybackWithFade = useCallback(() => {
    if (!wavesurferRef.current) return;

    // Fade in from 0 to 1
    wavesurferRef.current.setVolume(0);
    fadeVolume(0, 1, FADE_DURATION, () => {
      // Fade-in complete, schedule fade-out before the end
      // Set a timeout for fade-out start (PLAY_DURATION - FADE_DURATION)
      playTimeoutRef.current = setTimeout(() => {
        // Fade out in the last FADE_DURATION seconds
        fadeVolume(1, 0, FADE_DURATION, handleNextSong);
      }, (PLAY_DURATION - FADE_DURATION) * 1000);
    });
  }, [fadeVolume, FADE_DURATION, PLAY_DURATION, handleNextSong]);

  const loadCurrentSong = useCallback(() => {
    cleanupWaveSurfer();
    const currentSong = songs[currentIndex];
    if (!currentSong) {
      // No song
      setIsPlaying(false);
      setCurrentIndex(-1);
      return;
    }

    const ws = WaveSurfer.create({
      container: document.createElement("div"),
      waveColor: 'transparent',
      progressColor: 'transparent',
      barWidth: 0,
      height: 0,
      backend: 'WebAudio', // Using WebAudio for volume control
    });

    ws.on('ready', () => {
      setReady(true);
      const dur = ws.getDuration();
      setDuration(dur);

      const maxStart = dur * 0.75;
      const randomStart = Math.random() * maxStart;
      ws.seekTo(randomStart / dur);

      ws.play().then(() => {
        startPlaybackWithFade();
      }).catch((err) => {
        console.error("Error playing audio:", err);
        handleNextSong();
      });
    });

    ws.on('error', (err) => {
      console.error("Wavesurfer error:", err);
      handleNextSong();
    });

    ws.load(currentSong.AudioUrl);
    wavesurferRef.current = ws;
  }, [currentIndex, songs, startPlaybackWithFade, handleNextSong, cleanupWaveSurfer]);

  const playSongAtIndex = useCallback((idx) => {
    // User clicked a specific song
    setCurrentIndex(idx);
    setIsPlaying(true);
  }, []);

  useEffect(() => {
    if (isPlaying && currentIndex >= 0 && currentIndex < songs.length) {
      loadCurrentSong();
    }
    return () => {
      cleanupWaveSurfer();
    };
  }, [isPlaying, currentIndex, songs.length, loadCurrentSong, cleanupWaveSurfer]);

  // Remove the PLAY tab and autostart if songs available
  useEffect(() => {
    if (songs.length > 0 && !isPlaying && currentIndex === -1) {
      // Auto start the playlist
      setCurrentIndex(0);
      setIsPlaying(true);
    }
  }, [songs, isPlaying, currentIndex]);

  const handleStop = () => {
    cleanupWaveSurfer();
    setIsPlaying(false);
    setCurrentIndex(-1);
  };

  // Scroll the currently playing song into view
  useEffect(() => {
    if (listRef.current && currentIndex >= 0) {
      const listItem = listRef.current.querySelector(`[data-idx="${currentIndex}"]`);
      if (listItem) {
        listItem.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }, [currentIndex]);

  const renderMetadata = (song) => {
    const style = song.Style || "";
    const year = song.Year || "";
    const composer = song.Composer || "";
    const candombe = song.Candombe === "Y" ? "Candombe " : "";
    const cancion = song.Cancion === "Y" ? "Cancion " : "";
    const singer = song.Singer === "Y" ? "Singer " : "";

    const extras = [candombe, cancion, singer].join("").trim();
    const metaParts = [style, year, composer, extras].filter(Boolean);

    return metaParts.length > 0 ? metaParts.join(" | ") : "";
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" sx={{ mb: 2, textAlign: 'center', fontWeight: 'bold' }}>
        Now Playing
      </Typography>

      {songs.length === 0 && (
        <Typography>No songs. Adjust configuration and try again.</Typography>
      )}
      {songs.length > 0 && (
        <>
          <Box ref={listRef} sx={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #ccc', borderRadius: 1, mb: 3 }}>
            <List>
              {songs.map((song, idx) => {
                const title = song.Title || song.SongTitle || "Unknown Title";
                const artist = song.ArtistMaster || "Unknown Artist";
                const meta = renderMetadata(song);
                const isCurrent = idx === currentIndex;

                return (
                  <ListItem
                    key={song.SongID || idx}
                    data-idx={idx}
                    onClick={() => playSongAtIndex(idx)}
                    sx={{
                      cursor: "pointer",
                      border: isCurrent ? '2px solid blue' : 'none',
                      mb: 0.5,
                      '&:hover': { backgroundColor: '#f0f0f0' },
                    }}
                  >
                    <ListItemText
                      primary={title}
                      secondary={
                        <>
                          <Typography component="span" variant="body2">
                            {artist}
                          </Typography>
                          {meta && (
                            <Typography component="div" variant="caption" sx={{ fontSize: '0.75rem', color: '#666' }}>
                              {meta}
                            </Typography>
                          )}
                        </>
                      }
                    />
                  </ListItem>
                );
              })}
            </List>
          </Box>
          <Stack direction="row" spacing={2} sx={{ justifyContent: 'center' }}>
            {/* Removed the Start button as per requirement (auto start) */}
            {isPlaying && (
              <>
                <Button
                  variant="contained"
                  color="success"
                  onClick={handleNextSong}
                  disabled={!ready}
                >
                  Next
                </Button>
                <Button variant="contained" color="error" onClick={handleStop}>
                  Stop
                </Button>
              </>
            )}
            <Button variant="outlined" onClick={onCancel}>Cancel</Button>
          </Stack>
        </>
      )}
    </Box>
  );
}

PlayTab.propTypes = {
  songs: PropTypes.arrayOf(
    PropTypes.shape({
      SongID: PropTypes.string,
      Title: PropTypes.string,
      SongTitle: PropTypes.string,
      ArtistMaster: PropTypes.string,
      AudioUrl: PropTypes.string,
      Style: PropTypes.string,
      Year: PropTypes.string,
      Composer: PropTypes.string,
      Candombe: PropTypes.string,
      Cancion: PropTypes.string,
      Singer: PropTypes.string,
    })
  ).isRequired,
  config: PropTypes.shape({
    numSongs: PropTypes.number,
    timeLimit: PropTypes.number,
    levels: PropTypes.arrayOf(PropTypes.number),
    styles: PropTypes.objectOf(PropTypes.bool),
  }).isRequired,
  onCancel: PropTypes.func.isRequired,
};
