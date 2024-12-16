Sub-APP - "Artist Quiz"

Players listen to a snippet of a tango song and guess the correct artist from four multiple-choice options. Scoring is dynamic, based on the configured time limit (3-15 seconds) and penalties for incorrect answers. Faster responses yield higher scores. The session includes a configurable number of songs, and cumulative scores are tracked.

Core Features
	1.	Song Playback and Quiz Flow
	•	The app selects a random song from a pre-filtered library of valid songs.
	•	Songs must have a non-blank artist name (ArtistMaster) and the artist must be active and of level 1 or 2.
	•	The user listens to a short snippet of the song starting at a random point (between 0-90 seconds) and must identify the correct artist from 4 options (1 correct + 3 distractors).
	2.	Dynamic Configuration
	•	Before starting, users can configure:
	•	Time Limit: Ranges from 3 to 15 seconds per song.
	•	Number of Songs: Sets the total number of rounds in a session.
	•	These parameters directly influence gameplay and scoring mechanics.
	3.	Scoring and Timer
	•	Maximum Score:
	•	For the shortest time limit (3 seconds), the maximum score per song is 500 points.
	•	For the longest time limit (15 seconds), the maximum score per song is 50 points.
	•	Score Decrement:
	•	The score decreases in 0.1-second intervals during the round.
	•	The decrement per interval is calculated dynamically based on the time limit and maximum score.
	•	Example: For 5 seconds, the max score is 426, and the score decrement is ~8.52 points per 0.1 second.
	4.	Wrong Answer Penalty
	•	Selecting an incorrect answer reduces the current score by 5%.
	•	Multiple wrong answers can push the score into negative values.
	5.	Session Tracking
	•	Each correct answer adds the remaining score to the session score.
	•	The session score accumulates across multiple rounds, up to the configured number of songs.
	6.	Feedback
	•	Immediate feedback is displayed after each selection:
	•	Correct Answer: Ends the round and adds the remaining score to the session total.
	•	Wrong Answer: Deducts 5% of the current score, allowing continued play until time runs out or the correct answer is selected.
	•	At the end of the round, users see a performance message based on their score:
	•	“Excellent job!” (80%+ of max score)
	•	“Great work!” (50%-80%)
	•	“Not bad!” (20%-50%)
	•	“Better luck next time.” (<20%)
	7.	Audio Playback
	•	Song playback starts at a randomly selected time point and stops when:
	•	The round ends (correct answer or time runs out).
	•	The user manually pauses playback.
	•	Playback ensures proper metadata loading before starting.

Gameplay Flow
	1.	Game Configuration:
	•	Users configure the time limit (3-15 seconds) and number of songs.
	•	The configuration affects the scoring system and session length.
	2.	Song Selection:
	•	A random song is chosen, ensuring it meets validity checks (artist level and activity).
	3.	Listening and Answering:
	•	Users listen to a snippet of the song and choose the artist from 4 options.
	•	The score decreases dynamically over time, encouraging quicker responses.
	4.	End of Round:
	•	The round ends when:
	•	The user selects the correct answer.
	•	Time runs out.
	5.	Session End:
	•	After the configured number of rounds, the session ends, displaying the total session score and a performance summary.

Dynamic Scoring System
	1.	Maximum Score Formula:
	•	Based on the selected time limit:
	•	Max Score = 500 - ((timeLimit - 3) / 12) * 450
	•	Example Mapping:
	•	3 seconds: 500 points
	•	5 seconds: 426 points
	•	10 seconds: 238 points
	•	15 seconds: 50 points
	2.	Decrement Formula:
	•	The score decrement per 0.1 second is:
	•	Decrement = Max Score / (timeLimit * 10)
	•	Example for 5 seconds:
	•	Max Score = 426, Time = 50 intervals → Decrement = ~8.52 points per interval.
	3.	Wrong Answer Penalty:
	•	Each wrong answer reduces the current score by 5%.
	•	Example:
	•	Score = 400 → Wrong Answer Penalty = 20 points → New Score = 380.
	4.	Negative Scoring:
	•	If the user accumulates multiple wrong answers or time runs out, the score can drop below zero.

Tech and Utility Functions
	1.	Data Fetching and Filtering
	•	Valid songs are fetched from djSongs.json.
	•	Valid artists are fetched from ArtistMaster.json and filtered based on activity and level.
	2.	Distractor Generation
	•	Incorrect artist options are randomly selected from the valid artist pool, ensuring uniqueness and relevance.
	3.	Audio Management
	•	Playback begins at a random starting point.
	•	Ensures smooth playback after metadata is fully loaded.
	4.	Timer and Score Logic
	•	Both time and score decrement dynamically every 0.1 second, tied to the configured time limit.

Performance Highlights
	•	Customizable Gameplay: Allows users to control session length and difficulty.
	•	Dynamic Scoring: Encourages quick and accurate answers while penalizing wrong guesses.
	•	Real-Time Feedback: Ensures an engaging experience with immediate responses to user actions.
	•	Session Summary: Tracks performance across multiple rounds, providing a cumulative score.

This app effectively combines interactive gameplay with dynamic scoring and encourages fast-paced decision-making, making it both challenging and fun! Let me know if you’d like further refinements or additions.