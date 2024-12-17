//------------------------------------------------------------
// src/app/games/artistquiz/page.js
//------------------------------------------------------------
"use client";

import React, { useState, useRef, useEffect, useCallback, useContext } from "react";
import PropTypes from "prop-types";
import {
  Box,
  Button,
  Typography,
  Stack,
  Checkbox,
  FormGroup,
  FormControlLabel,
  TextField,
  Snackbar,
  Alert,
} from "@mui/material";
import Image from "next/image";
import { ScoreContext } from "@/contexts/ScoreContext";
import { fetchSongsAndArtists, getDistractors, shuffleArray } from "@/utils/dataFetching";
import { calculateMaxScore, calculateDecrementPerInterval } from "@/utils/scoring";
import { playAudio, stopAudio, getRandomStartTime } from "@/utils/audio";

export default function ArtistQuizPage() {
  const { sessionScore, setSessionScore } = useContext(ScoreContext);

  const [artists, setArtists] = useState([]);
  const [songs, setSongs] = useState([]);
  const [filteredSongs, setFilteredSongs] = useState([]);
  const [playedSongs, setPlayedSongs] = useState(new Set());
  const [currentSong, setCurrentSong] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState("");

  const [timeElapsed, setTimeElapsed] = useState(0);
  const [timeLimit, setTimeLimit] = useState(15);
  const [score, setScore] = useState(0);
  const [quizOver, setQuizOver] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const [disabledAnswers, setDisabledAnswers] = useState(new Set());
  const [config, setConfig] = useState({
    numSongs: 10,
    timeLimit: 15,
    levels: [1, 2],
    styles: { Tango: true, Milonga: true, Vals: true },
    includeCandombe: false,
    includeAlternative: false,
  });

  const audioRef = useRef(null);

  // Load songs and filter them based on configuration
  useEffect(() => {
    fetchSongsAndArtists().then(({ validSongs, validArtists }) => {
      setSongs(validSongs);
      setArtists(validArtists); 
      filterSongs(validSongs);
    });
  }, [config]);



  const filterSongs = (songsToFilter) => {
    const filtered = songsToFilter.filter((song) => {
      const { levels, styles, includeCandombe, includeAlternative } = config;
      return (
        levels.includes(Number(song.level)) &&
        styles[song.Style] &&
        (includeCandombe || song.Candombe === "N") &&
        (includeAlternative || song.Alternative === "N")
      );
    });
    setFilteredSongs(filtered);
  };

  const loadNewSong = useCallback(() => {
    if (playedSongs.size >= config.numSongs || filteredSongs.length === 0) {
      finalizeQuiz();
      return;
    }

    let randomSong;
    do {
      const randomIndex = Math.floor(Math.random() * filteredSongs.length);
      randomSong = filteredSongs[randomIndex];
    } while (playedSongs.has(randomSong.SongID));

    setPlayedSongs((prev) => new Set(prev).add(randomSong.SongID));
    setCurrentSong(randomSong);
    setCorrectAnswer(randomSong.ArtistMaster);

   const distractors = getDistractors(randomSong.ArtistMaster, artists); 
    setAnswers(shuffleArray([randomSong.ArtistMaster, ...distractors]));

    setScore(calculateMaxScore(config.timeLimit));
    setTimeElapsed(0);
    setSelectedAnswer(null);
    setDisabledAnswers(new Set());
    setQuizOver(false);
  }, [filteredSongs, playedSongs, config]);

  const handleStartGame = () => {
    setSessionScore(0);
    setPlayedSongs(new Set());
    setGameStarted(true);
    loadNewSong();
  };

  const startAudio = () => {
    if (currentSong && audioRef.current) {
      const startTime = getRandomStartTime(90);
      audioRef.current.currentTime = startTime;
      playAudio(audioRef.current, startTime);
      setIsPlaying(true);
    }
  };

  const handleAnswerSelect = (answer) => {
    if (quizOver || disabledAnswers.has(answer)) return;

    if (answer === correctAnswer) {
      setFeedbackMessage("Correct!");
      setSessionScore((prev) => prev + Math.round(score));
      setQuizOver(true);
    } else {
      setScore((prev) => prev * 0.95); // 5% penalty
      setFeedbackMessage("Wrong!");
      setDisabledAnswers((prev) => new Set(prev).add(answer));
    }
  };

  const finalizeQuiz = () => {
    setGameStarted(false);
    console.log("Quiz Complete. Total Score:", sessionScore);
  };

  const handleConfigChange = (field, value) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const handleStyleChange = (style) => {
    setConfig((prev) => ({
      ...prev,
      styles: { ...prev.styles, [style]: !prev.styles[style] },
    }));
  };

  return (
    <Box sx={{ p: 2, maxWidth: 600, margin: "auto", textAlign: "center" }}>
      {/* Banner */}
      <Image src="/NTTTBanner.jpg" alt="NTTT Banner" width={600} height={100} />

      <Typography variant="h6">Session Score: {Math.round(sessionScore)}</Typography>

      {!gameStarted && (
        <>
          {/* Configuration Section */}
          <Box sx={{ my: 2, textAlign: "left" }}>
            <Typography variant="h6">Configuration</Typography>
            <TextField
              label="Number of Songs"
              type="number"
              value={config.numSongs}
              onChange={(e) => handleConfigChange("numSongs", Number(e.target.value))}
              fullWidth
              sx={{ mb: 2 }}
            />
            <TextField
              label="Time Limit (seconds)"
              type="number"
              value={config.timeLimit}
              onChange={(e) => handleConfigChange("timeLimit", Number(e.target.value))}
              fullWidth
              sx={{ mb: 2 }}
            />
            <FormGroup>
              <Typography>Levels</Typography>
              {[1, 2, 3, 4, 5].map((level) => (
                <FormControlLabel
                  key={level}
                  control={
                    <Checkbox
                      checked={config.levels.includes(level)}
                      onChange={(e) => {
                        const newLevels = e.target.checked
                          ? [...config.levels, level]
                          : config.levels.filter((l) => l !== level);
                        handleConfigChange("levels", newLevels);
                      }}
                    />
                  }
                  label={`Level ${level}`}
                />
              ))}
            </FormGroup>
            <FormGroup>
              <Typography>Styles</Typography>
              {["Tango", "Milonga", "Vals"].map((style) => (
                <FormControlLabel
                  key={style}
                  control={
                    <Checkbox
                      checked={config.styles[style]}
                      onChange={() => handleStyleChange(style)}
                    />
                  }
                  label={style}
                />
              ))}
            </FormGroup>
          </Box>

          <Button variant="contained" onClick={handleStartGame}>
            Start Artist Quiz
          </Button>
        </>
      )}

      {gameStarted && currentSong && (
        <>
          <audio ref={audioRef} src={currentSong.audioUrl} />
          <Button variant="contained" onClick={startAudio}>
            Play Song
          </Button>
          <Typography variant="h6">Who is the Artist?</Typography>

          <Stack spacing={2}>
            {answers.map((ans) => (
              <Button
                key={ans}
                variant="outlined"
                disabled={disabledAnswers.has(ans)}
                onClick={() => handleAnswerSelect(ans)}
              >
                {ans}
              </Button>
            ))}
          </Stack>

          {feedbackMessage && (
            <Typography variant="body1" sx={{ mt: 2 }}>
              {feedbackMessage}
            </Typography>
          )}
        </>
      )}
    </Box>
  );
}

ArtistQuizPage.propTypes = {};