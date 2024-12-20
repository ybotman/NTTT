Architect Role (Jax)

Below is a proposed architecture and conceptual breakdown for the ArtistQuiz configuration and integration into a larger multi-game system. This focuses on how configuration, states, and functions are organized, keeping in mind that similar patterns will apply to future games.

Core Concepts 1. Shared Contexts:
• AuthContext:
Holds user authentication state (e.g. userID, login status). This might influence which configurations can be saved or loaded per user.
• ScoreContext:
Manages global scoring data across sessions or multiple games. For ArtistQuiz, it holds the current session’s accumulated score and provides methods to update it after each round. 2. Hooks:
• useConfig(gameName):
Manages configuration per game. For ArtistQuiz, it loads, stores, and updates configuration values like:
• numSongs (number of songs per session)
• timeLimit (seconds per snippet)
• levels (which artist levels are included)
• styles (which dance/music styles are included)
Exports functions like updateConfig(key, value) and saveConfig() for persistent storage (e.g., localStorage or user profile in backend).
• useArtistQuiz():
Manages the entire gameplay state and flow for the ArtistQuiz:
• Holds references to currentSong, answers, score, roundState, timeElapsed, quizComplete, and so forth.
• Provides functions to start the game, start a round, fetch and filter songs, generate distractors, handle answer selection, finalize rounds, and finalize the quiz.
• Interacts with ScoreContext to update cumulative scores and uses useConfig('artistQuiz') to tailor gameplay parameters. 3. Pages/Components:
• ConfigTab.js (for ArtistQuiz):
A user interface component that:
• Reads the ArtistQuiz configuration from useConfig('artistQuiz').
• Allows the user to change settings like numSongs, timeLimit, and to select which levels and styles are active.
• On save, calls saveConfig() to persist these settings.
• No direct game logic, just configuration editing.
• PlayTab.js (for ArtistQuiz):
The main gameplay component:
• Uses useArtistQuiz() to get the current round’s state, including currentSong, answers, roundState, and score.
• Depending on roundState, shows appropriate UI (e.g., “Start Game” button when ready, answer buttons during play, feedback at round end).
• Uses events like startGame(), startRound(), and handleAnswerSelect(answer) to control the flow.
• Displays the current session score from ScoreContext.
• Shows feedback messages and handles audio snippet playback and stopping. 4. Utility Functions and Data Management:
• Data Fetching & Filtering (utils/dataFetching.js):
Exports functions like:
• fetchSongsAndArtists(): Retrieves all valid songs and artists.
• filterSongs(songs, config): Takes the full song list and the current configuration (e.g., levels, styles) and returns a filtered list of songs suitable for the current game session.
• getDistractors(correctArtist, artistList): Given a correct artist, returns a set of distinct, random “distractor” artists for the multiple-choice answers.
• Scoring Logic (utils/scoring.js):
Contains functions like:
• calculateMaxScore(timeLimit): Determines the maximum points possible given the chosen time limit.
• calculateDecrementPerInterval(maxScore, timeLimit): Determines how quickly the score should drop as time passes.
These are used by useArtistQuiz() to dynamically adjust the score during the round.
• Audio Management (utils/audio.js):
Handles low-level audio operations:
• getRandomStartTime(duration): Returns a random start time within the first 90 seconds.
• playAudio(audioRef, startTime): Starts playback at a chosen point.
• stopAudio(audioRef): Stops playback.
This keeps audio logic separate and reusable. 5. States and Storage:
• Local Storage / Persistent Config:
useConfig() reads/writes configuration to localStorage keyed by game name (artistQuiz_config). This lets users return to their previous settings.
• In-Memory State:
useArtistQuiz() maintains transient state for each round (currentSong, score, roundState) and resets it as new rounds start. Once a session is completed, it can store the final results in ScoreContext or prompt the user to start again. 6. Parameters and Data Flow Example:
• Configuration Parameters (From ConfigTab via useConfig()):
• numSongs: integer, how many rounds total.
• timeLimit: integer, how many seconds per round.
• levels: array of integers, which artist levels are allowed.
• styles: object with boolean flags, indicating which styles are included.
• Runtime Game Play (From PlayTab via useArtistQuiz()):
• startGame(): Called when user clicks “Start”.
Uses config to filter the master song list, pick the first song, set initial states.
• startRound(): Called when user clicks “Ready to Play”.
Begins timers, starts audio, calculates decrement intervals.
• handleAnswerSelect(answer): Checks if correct.
If correct, stop the timer and audio, update the score and sessionScore.
If wrong, apply penalties.
• nextSong() and finalizeQuiz() handle moving to the next round or ending the session respectively. 7. Preparing for Other Games:
• The architecture scales by:
• Reusing useConfig(gameName) for different games (e.g., useConfig('styleQuiz')).
• Creating separate hooks like useStyleQuiz() with similar logic but different data filters and scoring rules.
• Storing shared logic in utils/ directories so that each new game can leverage existing code (audio control, scoring formulas, data fetching, etc.).
• Each new quiz or game type would have its own PlayTab and possibly its own ConfigTab but share underlying contexts and hooks for consistency.

Summary

This layout decouples configuration, state management, data handling, and UI rendering. For ArtistQuiz:
• ConfigTab: Edits and saves game configuration.
• PlayTab: Runs the game rounds using useArtistQuiz() and shows the current state and score.
• useArtistQuiz: Controls gameplay logic (round states, scoring updates, fetching new songs).
• useConfig: Loads and saves configuration for ArtistQuiz and other games.
• ScoreContext: Tracks cumulative scores.
• AuthContext: Manages user sessions and potentially user-specific configurations.

This structure ensures clarity, maintainability, and extensibility as more games and features are added in the future.
