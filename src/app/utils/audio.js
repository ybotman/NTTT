//-------------
//src/app/utils/audio.js
//-------------

export function getRandomStartTime(songDuration) {
  const maxStart = songDuration * 0.65;
  return Math.floor(Math.random() * maxStart);
}

export function playAudio(audioElement, startTime) {
  if (!audioElement || !audioElement.src) {
    console.error("Audio element or source is missing.");
    return;
  }

  console.log("Attempting to play audio from:", audioElement.src);

  audioElement.currentTime = startTime || 0;

  audioElement
    .play()
    .then(() => {
      console.log("Audio playback started successfully.");
    })
    .catch((error) => {
      console.error("Error playing audio:", error.message);
    });
}

export function stopAudio(audioElement) {
  if (!audioElement) return;
  audioElement.pause();
  console.log("Audio stopped.");
}
