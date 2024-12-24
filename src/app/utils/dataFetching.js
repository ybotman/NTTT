//------------------------------------------------------------
// src/utils/dataFetching.js
//------------------------------------------------------------

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

/**
 * Fetch songs and artists data, enrich with artist levels, and then filter them
 * based on provided criteria.
 *
 * @param {string[]} artistMasters - Array of ArtistMaster names to filter by
 * @param {number[]} artistLevels - Array of artist levels (1-5)
 * @param {string[]} composers - Array of composers
 * @param {string[]} styles - Array of styles
 * @param {string} candombe - 'N' or 'Y' or ''
 * @param {string} alternative - 'N' or 'Y' or ''
 * @param {string} cancion - 'N' or 'Y' or ''
 * @param {number} qty - How many songs to randomly select (default: 10)
 * @returns {Promise<{ songs: Array, qty: number }>}
 */
export async function fetchFilteredSongs(
  artistMasters = [],
  artistLevels = [],
  composers = [],
  styles = [],
  candombe = "",
  alternative = "",
  cancion = "",
  qty = 10,
) {
  try {
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
    const [djSongsData, artistData] = await Promise.all([
      fetch(`${basePath}/songData/djSongs.json`).then((r) => r.json()),
      fetch(`${basePath}/songData/ArtistMaster.json`).then((r) => r.json()),
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

    // Candombe, Alternative, Cancion
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

    console.log({
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
 * Fetch songs and artists data and enrich with necessary fields.
 */
export async function fetchSongsAndArtistsXXX() {
  try {
    const [djSongsData, artistData] = await Promise.all([
      fetch(`${basePath}/songData/djSongs.json`).then((r) => r.json()),
      fetch(`${basePath}/songData/ArtistMaster.json`).then((r) => r.json()),
    ]);

    console.log("Fetched raw songs:", djSongsData.songs.length);
    console.log("Fetched raw artists:", artistData.length);

    const artistLevelMap = {};
    artistData.forEach((artist) => {
      if (artist.active === "true") {
        artistLevelMap[artist.artist.toLowerCase()] = parseInt(
          artist.level,
          10,
        );
      }
    });

    // Enrich with level
    const enrichedSongs = djSongsData.songs
      .map((song) => {
        const artistName = song.ArtistMaster?.trim().toLowerCase();
        if (!artistName || !artistLevelMap[artistName]) return null;
        return { ...song, level: artistLevelMap[artistName] };
      })
      .filter(Boolean);

    console.log(`Valid and leveled songs: ${enrichedSongs.length}`);
    return { validSongs: enrichedSongs, validArtists: artistData };
  } catch (error) {
    console.error("Error fetching songs and artists:", error);
    return { validSongs: [], validArtists: [] };
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
 * Get 3 random distractor artists (names) excluding the correct artist.
 */
export function getDistractors(correctArtist, allArtists) {
  if (!correctArtist || !allArtists || !Array.isArray(allArtists)) {
    console.warn("Invalid inputs for getDistractors:", {
      correctArtist,
      allArtists,
    });
    return [];
  }

  const candidates = allArtists
    .filter((artist) => {
      const artistName = artist?.artist?.toLowerCase();
      return artistName && artistName !== correctArtist.toLowerCase();
    })
    .map((artist) => artist.artist);

  return shuffleArray(candidates).slice(0, 3);
}
