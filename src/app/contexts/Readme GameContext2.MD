## **Game Context: Usage & Pattern**

This document explains how our **GameContext** is consumed by a typical three-tab pattern for each game (1-page “wrapper,” plus `ConfigTab` and `PlayTab`).

---

### **Overall Flow**

1. **Main Game Page (Wrapper)**  
   - Renders the “Play” button, which reads config from `GameContext` to fetch data (songs, questions, etc.).  
   - Updates the score or session data when the user finishes a round.  
   - Shows/hides `PlayTab` or `ConfigTab`.

2. **ConfigTab**  
   - Renders sliders, dropdowns, etc.  
   - Calls `updateConfig(key, value)` from `GameContext` to store filter/limit values (e.g., `timeLimit`, `numSongs`).  

3. **PlayTab**  
   - Uses the final config from `GameContext` to run the actual game.  
   - When the game ends or user’s turn completes, it updates `currentScore` via `setCurrentScore()` or calls `resetGame()` if needed.

---

### **1) Main Game Page**

- **Consumes**: 
  - `config` (to confirm the user’s chosen settings before playing)
  - `currentScore` (to display or reset)
- **Actions**: 
  - On “Play” click, does the official GET request using `config` values to fetch data (e.g., songs).
  - Shows/hides `PlayTab`.
  - Updates `currentScore` if a user completes a session with a new score.

**Example**:
```jsx
const { config, currentScore, setCurrentScore } = useGameContext();

function handlePlayClick() {
  // 1) Use config.numSongs, config.timeLimit, etc. for your fetch
  const songs = await fetchSongs(config);

  // 2) Display PlayTab with these songs
  setShowPlayTab(true);
}

function handleGameComplete(newScore) {
  setCurrentScore(newScore);
  setShowPlayTab(false);
}
```

---

### **2) ConfigTab**

- **Consumes**:  
  - `config` to display current sliders/checkbox states.  
  - `updateConfig(key, value)` to change them.
- **Actions**:  
  - Users move a slider or toggle a checkbox -> `updateConfig("numSongs", 12)`.
  - The updated config is reflected instantly anywhere else consuming `GameContext`.

**Example**:
```jsx
const { config, updateConfig } = useGameContext();

<SongsSlider
  min={3}
  max={25}
  value={config.numSongs}
  onChange={(val) => updateConfig("numSongs", val)}
/>;
```

---

### **3) PlayTab**

- **Consumes**: 
  - `config` (time limit, number of questions)  
  - `currentScore` (if you want to show the user’s ongoing points)  
  - `setCurrentScore` for updating points or final score
- **Actions**:  
  - Uses `config` to play the actual session.  
  - Calls `setCurrentScore()` or `resetGame()` when session ends.  
  - Could also read `currentQuestionIndex` or `setCurrentQuestionIndex()` if needed.

**Example**:
```jsx
const { config, currentScore, setCurrentScore, resetGame } = useGameContext();

function startPlaying() {
  // Use config.timeLimit to set up a timer, etc.
}

function finishGame() {
  // e.g. add 10 points:
  setCurrentScore(currentScore + 10);
  resetGame();
}
```

---

## **Key Takeaways**

- **One GameContext** holds shared fields (`config`, `currentScore`, etc.).  
- **Main Page** orchestrates the flow: fetch data on “Play,” toggle tabs, record final score.  
- **ConfigTab** just sets `config` fields.  
- **PlayTab** uses those `config` fields to run the game, then updates or resets session.  

This pattern ensures each piece (Page, ConfigTab, PlayTab) stays focused on its role while sharing a single source of truth in `GameContext`.