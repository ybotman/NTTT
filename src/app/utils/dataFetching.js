//------------------------------------------------------------
// src/utils/dataFetching.js
//------------------------------------------------------------

/**
 * Fetch songs and artists data and enrich with necessary fields.
 * - Songs are enriched with artist levels and audio URLs.
 */
export async function fetchSongsAndArtists() {
  try {
    // Fetch data for songs and artists concurrently
    const [djSongsData, artistData] = await Promise.all([
      fetch('/songData/djSongs.json').then((r) => r.json()),
      fetch('/songData/ArtistMaster.json').then((r) => r.json()),
    ]);

    console.log("Fetched raw songs:", djSongsData.songs);
    console.log("Fetched raw artists:", artistData);

    // Create a map of active artists with their levels
    const artistLevelMap = {};
    artistData.forEach((artist) => {
      if (artist.active === "true") {
        artistLevelMap[artist.artist.toLowerCase()] = artist.level;
      }
    });

    console.log("Artist Level Map:", artistLevelMap);

    // Enrich valid songs with artist levels and audio URLs
    const enrichedSongs = djSongsData.songs
      .map((song) => {
        const artistName = song.ArtistMaster?.trim().toLowerCase();

        // Skip invalid songs with missing ArtistMaster or unmatched artists
        if (!artistName || !artistLevelMap[artistName]) {
         // console.warn(`Song skipped: Missing/invalid artist - ID=${song.SongID}, ArtistMaster=${song.ArtistMaster}`);
          return null;
        }

        // Correct audio URL handling
        const validAudioUrl =
          song.AudioUrl || // Use the existing AudioUrl if available
          (song.SongID
            ? `https://namethattangotune.blob.core.windows.net/djsongs/${song.SongID}.mp3`
            : null); // Construct URL only if SongID exists

        if (!validAudioUrl) {
          console.warn(`Invalid audio URL for song ID=${song.SongID}`);
          return null;
        }

        return {
          ...song,
          level: artistLevelMap[artistName], // Attach artist level
          audioUrl: validAudioUrl, // Use validated audio URL
        };
      })
      .filter((song) => song); // Remove invalid songs (null entries)

    console.log("Valid enriched songs:", enrichedSongs);
    return { validSongs: enrichedSongs, validArtists: artistData };
  } catch (error) {
    console.error("Error fetching songs and artists:", error);
    return { validSongs: [], validArtists: [] };
  }
}

/**
 * Shuffle an array using Fisher-Yates algorithm.
 * @param {Array} array - The array to shuffle.
 * @returns {Array} Shuffled array.
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
 * @param {string} correctArtist - The name of the correct artist.
 * @param {Array} allArtists - The list of all valid artists.
 * @returns {Array} An array of 3 random distractors.
 */
export function getDistractors(correctArtist, allArtists) {
  if (!correctArtist || !allArtists || !Array.isArray(allArtists)) {
    console.warn("Invalid inputs for getDistractors:", { correctArtist, allArtists });
    return [];
  }

  const candidates = allArtists
    .filter((artist) => {
      const artistName = artist?.artist?.toLowerCase(); // Safe chaining
      return artistName && artistName !== correctArtist.toLowerCase();
    })
    .map((artist) => artist.artist);

  return shuffleArray(candidates).slice(0, 3); // Return 3 random distractors
}