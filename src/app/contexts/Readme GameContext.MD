**Game Context Structure – README**

This document outlines how to manage multiple games that share the **same types of fields** (e.g., `timeLimit`, `numSongs`, `styles`, `levels`) but each game requires **separate** values and **custom** logic.

---

## Overview

- **Goal**: Maintain a **single** game context (a single data structure) that stores **per-game** config values independently.
- **Why**: Avoid duplicating multiple contexts for each game while keeping data for each game separate.
- **How**: Use a **map/dictionary** keyed by game “slug” (e.g., `"artistLearn"`, `"artistQuiz"`), where each entry holds the relevant config for that specific game.

### Example

```js
// Pseudocode shape
const [configMap, setConfigMap] = useState({
  artistLearn: { timeLimit: 10, numSongs: 5, styles: {}, levels: [] },
  artistQuiz: { timeLimit: 30, numSongs: 4, styles: {}, levels: [] },
  styleLearn: { timeLimit: 15, numSongs: 8, styles: {}, levels: [] },
  // etc...
});
```

---

## Key Steps

1. **Create a Single `GameContext`**

   - Define one context (and provider) that holds a **`configMap`** object in state.
   - Each game references its config via `configMap[gameSlug]`.

2. **Update Config**

   - Provide an `updateConfig(gameSlug, newValues)` function that merges `newValues` into the correct map entry.
   - Example:
     ```js
     function updateConfig(gameSlug, newValues) {
       setConfigMap((prevMap) => ({
         ...prevMap,
         [gameSlug]: {
           ...prevMap[gameSlug],
           ...newValues,
         },
       }));
     }
     ```

3. **Per-Game Defaults & Logic**

   - On first load, if `configMap[gameSlug]` doesn’t exist, initialize it with that game’s defaults (e.g., 4 vs. 5 songs).
   - Each game can impose its own constraints before calling `updateConfig`.
   - E.g., `ArtistQuiz` might enforce `timeLimit = 30` automatically, while `ArtistLearn` could allow 10 to 15 seconds.

4. **Persist Locally or to Cloud**

   - To save each game’s config, you can serialize the **entire** `configMap` (one structure) to local storage or an API.
   - On load, read from local storage / API, then set your state accordingly.

5. **Consuming the Context**

   - In each game’s page or components (`ConfigTab`, `PlayTab`), call:

     ```js
     const { configMap, updateConfig } = useGameContext();
     const gameSlug = "artistLearn"; // or "artistQuiz" etc.

     const gameConfig = configMap[gameSlug] || {};
     // Now read or write as needed:
     updateConfig(gameSlug, { timeLimit: 20 });
     ```

   - This ensures each game only touches its own config subset.

---

## Visual Example

```
<AppContext>  (Auth, Score, etc.)
 └─ <GameContextProvider>
    └─ configMap state
       ├─ artistLearn:  {...}
       ├─ artistQuiz:   {...}
       └─ styleLearn:   {...}
    └─ /games/artist-learn
       ├─ page.js  -> uses configMap["artistLearn"]
       ├─ ConfigTab.js
       └─ PlayTab.js
    └─ /games/artist-quiz
       ├─ page.js  -> uses configMap["artistQuiz"]
       ├─ ConfigTab.js
       └─ PlayTab.js
```

Each game calls `updateConfig("artistLearn", { timeLimit: 12 })` or `updateConfig("artistQuiz", { numSongs: 6 })` to maintain its own data.

---

## Benefits

1. **One Data Structure**: No duplication of context logic.
2. **Clearly Separate Game Data**: `artistLearn` vs. `artistQuiz` each has its own entry.
3. **Easy Persistence**: You can save and restore the entire `configMap` in a single read/write to local storage or your API.
4. **Per-Game Constraints**: Each game can apply its own rules before calling `updateConfig`.

---

### Final Notes

- If your games differ significantly, you can still store any fields you share in `configMap`, and each game can store extra keys as needed (`decadeRange`, `specialRule`, etc.).
- Keep your “unique” logic (e.g., enforcing min or max values) in the game’s own code so the context remains generic.
