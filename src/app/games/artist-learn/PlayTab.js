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

  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [ready, setReady] = useState(false);

  const PLAY_DURATION = Math.min(config.timeLimit ?? 15, 15);

  const cleanupWaveSurfer = useCallback(() => {
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
      backend: 'MediaElement',
    });

    ws.on('ready', () => {
      setReady(true);
      const dur = ws.getDuration();
      setDuration(dur);

      const maxStart = dur * 0.75;
      const randomStart = Math.random() * maxStart;
      ws.seekTo(randomStart / dur);

      ws.play().then(() => {
        // After PLAY_DURATION seconds, go to next
        playTimeoutRef.current = setTimeout(() => {
          handleNextSong();
        }, PLAY_DURATION * 1000);
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
  }, [currentIndex, songs, PLAY_DURATION, handleNextSong, cleanupWaveSurfer]);

  useEffect(() => {
    if (isPlaying && currentIndex >= 0 && currentIndex < songs.length) {
      loadCurrentSong();
    }
    return () => {
      cleanupWaveSurfer();
    };
  }, [isPlaying, currentIndex, songs.length, loadCurrentSong, cleanupWaveSurfer]);

  const startPlaylist = () => {
    if (songs.length === 0) {
      console.warn("No songs to play.");
      return;
    }
    setCurrentIndex(0);
    setIsPlaying(true);
  };

  const handleStop = () => {
    cleanupWaveSurfer();
    setIsPlaying(false);
    setCurrentIndex(-1);
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
          <List>
            {songs.map((song, idx) => {
              const title = song.Title || song.SongTitle || "Unknown Title";
              const artist = song.ArtistMaster || "Unknown Artist";
              const isCurrent = idx === currentIndex;
              return (
                <ListItem key={song.SongID || idx} selected={isCurrent}>
                  <ListItemText primary={title} secondary={artist} />
                </ListItem>
              );
            })}
          </List>

          <Stack direction="row" spacing={2} sx={{ mt: 3, justifyContent: 'center' }}>
            {!isPlaying && (
              <Button variant="contained" color="primary" onClick={startPlaylist}>
                Start
              </Button>
            )}
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
