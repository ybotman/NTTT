"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const usePlay = () => {
  const [isPlaying, setIsPlaying] = useState(false); // Tracks whether the game is currently being played
  const router = useRouter();

  const handleNavigateToHub = () => {
    if (isPlaying) {
      // Logic for resetting game or cleaning up scores
      console.log("Game canceled. Scores reset.");
      setIsPlaying(false); // Reset the game state
    }
    router.push("/games/gamehub/page.js"); // Navigate to the hub
  };

  return {
    isPlaying,
    setIsPlaying,
    handleNavigateToHub,
  };
};

export default usePlay;
