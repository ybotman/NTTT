//------------------------------------------------------------
// src/utils/dataFetching.js
//------------------------------------------------------------

/**
 * Fetch the entire ArtistMaster.json array directly.
 * Returns an array of objects like:
 *   [{ artist: "Carlos Di Sarli", level: "1", active: "true", ... }, ...]
 *
 * @returns {Promise<Array>} - The full ArtistMaster array
 */
export async function fetchAllArtists() {
  try {
    const artistData = await fetch("/songData/ArtistMaster.json").then((r) =>
      r.json(),
    );
    // You can filter or transform if needed
    // Example: only return active artists
    // const activeOnly = artistData.filter((a) => a.active === "true");
    return artistData;
  } catch (error) {
    console.error("Error fetching ArtistMaster data:", error);
    return [];
  }
}

/**
 * Existing function - no changes needed.
 * Fetch songs and artists data, enrich with artist levels, and filter them
 */
export async function fetchFilteredSongs(
  artistMasters = [],
  artistLevels = [],
  composers = [],
  styles = [],
  candombe = "",
  alternative = "",
  cancion = "",
  qty = "",
) {
  try {
    const [djSongsData, artistData] = await Promise.all([
      fetch(`/songData/djSongsL2.json`).then((r) => r.json()),
      fetch(`/songData/ArtistMaster.json`).then((r) => r.json()),
    ]);

    // Build artistLevel map
    const artistLevelMap = {};
    artistData.forEach((artist) => {
      if (artist.active === "true") {
        artistLevelMap[artist.artist.toLowerCase()] = parseInt(
          artist.level,
          10,
        );
      }
    });

    // Enrich songs with level
    const enrichedSongs = djSongsData.songs.map((song) => {
      const artistName = song.ArtistMaster?.trim().toLowerCase();
      const songLevel =
        artistName && artistLevelMap[artistName]
          ? artistLevelMap[artistName]
          : null;
      return { ...song, level: songLevel };
    });

    // Filtering logic
    let filtered = enrichedSongs;

    // ArtistMaster filter
    const validArtistMasters = artistMasters.filter(
      (a) => a && a.trim() !== "",
    );
    if (validArtistMasters.length > 0) {
      const artistMastersLower = validArtistMasters.map((a) => a.toLowerCase());
      filtered = filtered.filter(
        (song) =>
          song.ArtistMaster &&
          artistMastersLower.includes(song.ArtistMaster.trim().toLowerCase()),
      );
    }

    // ArtistLevel filter
    const validArtistLevels = artistLevels.filter((l) => typeof l === "number");
    if (validArtistLevels.length > 0) {
      filtered = filtered.filter(
        (song) => song.level && validArtistLevels.includes(song.level),
      );
    }

    // Composer filter
    const validComposers = composers.filter((c) => c && c.trim() !== "");
    if (validComposers.length > 0) {
      const composersLower = validComposers.map((c) => c.toLowerCase());
      filtered = filtered.filter(
        (song) =>
          song.Composer &&
          composersLower.includes(song.Composer.trim().toLowerCase()),
      );
    }

    // Style filter
    const validStyles = styles.filter((s) => s && s.trim() !== "");
    if (validStyles.length > 0) {
      const stylesLower = validStyles.map((s) => s.toLowerCase());
      filtered = filtered.filter(
        (song) =>
          song.Style && stylesLower.includes(song.Style.trim().toLowerCase()),
      );
    }
    if (candombe) {
      filtered = filtered.filter((song) => song.Candombe === candombe);
    }
    if (alternative) {
      filtered = filtered.filter((song) => song.Alternative === alternative);
    }
    if (cancion) {
      filtered = filtered.filter((song) => song.Cancion === cancion);
    }

    const finalSongs = getRandomSongs(filtered, qty);
    const finalQty = finalSongs.length;
    console.log("Filtered songs:", finalSongs);
    console.log("Filtered songs count:", finalQty);

    console.log("from Filter Criteria", {
      artistMasters: validArtistMasters,
      artistLevels: validArtistLevels,
      composers: validComposers,
      styles: validStyles,
      candombe: candombe || "not applied",
      alternative: alternative || "not applied",
      cancion: cancion || "not applied",
      requestedQty: qty,
      finalQty,
    });

    return { songs: finalSongs, qty: finalQty };
  } catch (error) {
    console.error("Error in fetchFilteredSongs:", error);
    return { songs: [], qty: 0 };
  }
}

/**
 * Returns a randomly selected subset of the input array of songs.
 */
export function getRandomSongs(songs, qty = 10) {
  if (!Array.isArray(songs) || songs.length === 0) return [];
  const shuffled = shuffleArray(songs);
  return shuffled.slice(0, Math.min(qty, songs.length));
}

/**
 * Shuffle an array using Fisher-Yates algorithm.
 */
export function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Rebuild getDistractors to fetch the full artist list
 * and then use config (levels + selected artists).
 *
 * @param {string} correctArtist
 * @param {object} config        - e.g. { levels: [1,2], artists: ["Juan D'Arienzo"] }
 * @param {number} numDistractors
 * @returns {Promise<string[]>}  - array of distractor names
 */
export async function getDistractors(
  correctArtist,
  config,
  numDistractors = 3,
) {
  // 1) Fetch all artists from ArtistMaster
  const allArtists = await fetchAllArtists(); // from dataFetching.js

  if (!correctArtist || !Array.isArray(allArtists)) {
    console.warn("Invalid inputs for getDistractors:", {
      correctArtist,
      config,
      allArtists,
    });
    return [];
  }

  // 2) Build a map of { artistNameLower: numericLevel }
  const artistLevelMap = {};
  allArtists.forEach((a) => {
    const nameLower = a.artist?.trim().toLowerCase();
    const numericLevel = parseInt(a.level, 10);
    if (nameLower && !isNaN(numericLevel) && a.active === "true") {
      artistLevelMap[nameLower] = numericLevel;
    }
  });

  // 3) Gather the final set of levels (from config.levels + config.artists)
  const finalLevels = new Set();
  // Add explicit levels from config
  (config.levels || []).forEach((lvl) => {
    finalLevels.add(Number(lvl));
  });
  // Add levels from any selected artist
  (config.artists || []).forEach((artistName) => {
    const lower = artistName.trim().toLowerCase();
    const lvl = artistLevelMap[lower];
    if (lvl) finalLevels.add(lvl);
  });

  // 4) Now build the candidate pool
  //    - Only artists who are active
  //    - Whose level is in finalLevels
  //    OR are in config.artists explicitly (some might not have level set)
  const candidatePool = allArtists.filter((a) => {
    const nameLower = a.artist?.trim().toLowerCase();
    const numericLevel = parseInt(a.level, 10);

    const isInLevel = finalLevels.has(numericLevel);
    const isInArtist = (config.artists || [])
      .map((n) => n.trim().toLowerCase())
      .includes(nameLower);

    return a.active === "true" && (isInLevel || isInArtist);
  });

  // 5) Exclude the correct artist
  const correctLower = correctArtist.trim().toLowerCase();
  const filtered = candidatePool.filter(
    (a) => a.artist.trim().toLowerCase() !== correctLower,
  );

  // 6) Shuffle + slice
  shuffleArray(filtered);
  const finalList = filtered.slice(0, numDistractors).map((a) => a.artist);

  console.log(`getDistractors => returning:`, finalList);
  return finalList;
}

/**
 * Get distractors by referencing config-selected artists & levels.
 * Steps:
 *   1) For each artist in config.artists => record its level.
 *   2) Merge that level set with config.levels.
 *   3) Collect all artists in those final levels.
 *   4) Exclude the correct artist.
 *   5) Shuffle & slice the desired distractor count (default=3).
 *
 * @param {string}         correctArtist - The correct artist's name
 * @param {Array}          allArtists    - Array of all artists from ArtistMaster
 * @param {Object}         config        - Contains { artists:[], levels:[] }
 * @param {number}         numDistractors - How many distractors to return (default=3)
 * @returns {string[]}     array of distractor artist names
 */
export function getDistractorsByConfig(
  correctArtist,
  allArtists,
  config,
  numDistractors = 3,
) {
  console.log(
    "getDistractorsByConfig Start => correctArtist:",
    correctArtist,
    "config:",
    config,
    "numDistractors:",
    numDistractors,
  );

  if (!correctArtist || !Array.isArray(allArtists)) {
    console.warn("Invalid inputs for getDistractorsByConfig:", {
      correctArtist,
      allArtists,
      config,
    });
    return [];
  }

  // 1) Build a quick map: { artistNameLower: numericLevel }
  const artistLevelMap = {};
  allArtists.forEach((a) => {
    const nameLower = a.artist?.toLowerCase();
    const numericLevel = parseInt(a.level, 10);
    console.log(
      `Artist: "${a.artist}", raw level: "${a.level}" => numericLevel =`,
      numericLevel,
    );

    if (nameLower && !isNaN(numericLevel)) {
      artistLevelMap[nameLower] = numericLevel;
    }
  });

  // 2) Collect levels from config.artists
  const selectedArtistLevels = new Set();
  (config.artists || []).forEach((artistName) => {
    const lower = artistName.trim().toLowerCase();
    const lvl = artistLevelMap[lower];
    if (lvl) {
      selectedArtistLevels.add(lvl);
    }
    console.log("selectedArtistLevels => added:", lvl, selectedArtistLevels);
  });

  // 3) Merge with config.levels
  (config.levels || []).forEach((lvl) => {
    selectedArtistLevels.add(Number(lvl));
  });

  console.log("Final selectedArtistLevels:", [...selectedArtistLevels]);

  // 4) Gather all artists in the final set of levels
  const candidateArtists = allArtists
    .filter((a) => {
      const lvl = parseInt(a.level, 10);
      return selectedArtistLevels.has(lvl);
    })
    .map((a) => a.artist);

  console.log("candidateArtists:", candidateArtists);

  // 5) Exclude the correctArtist
  const correctLower = correctArtist.trim().toLowerCase();
  const filtered = candidateArtists.filter(
    (name) => name.trim().toLowerCase() !== correctLower,
  );

  // 6) Shuffle & pick up to numDistractors
  shuffleArray(filtered);
  console.log(`Final distractors (before slicing): ${filtered}`);
  return filtered.slice(0, numDistractors);
}
