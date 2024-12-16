
//------------------------------------------------------------
// src/utils/dataFetching.js
//------------------------------------------------------------
export async function fetchSongsAndArtists() {
  const [djSongsData, artistData] = await Promise.all([
    fetch('/songData/djSongs.json').then((r) => r.json()),
    fetch('/songData/ArtistMaster.json').then((r) => r.json()),
  ]);

  const validArtists = artistData.filter(
    (a) => (a.level === '1' || a.level === '2') && a.active === 'true'
  );

  const validSongs = djSongsData.songs.filter((song) => {
    const artistName = (song.ArtistMaster || '').trim().toLowerCase();
    if (!artistName) return false;
    return validArtists.some((va) => va.artist.toLowerCase() === artistName);
  });

  for (const s of validSongs) {
    if (!s.audioUrl && s.id) {
      s.audioUrl = `https://namethattangotune.blob.core.windows.net/djsongs/${s.id}.mp3`;
    }
  }

  return { validSongs, validArtists };
}

export function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function getDistractors(correctArtist, allArtists) {
  const candidates = allArtists
    .filter((a) => a.artist.toLowerCase() !== correctArtist.toLowerCase())
    .map((a) => a.artist);
  const shuffled = shuffleArray(candidates);
  return shuffled.slice(0, 3);
}
