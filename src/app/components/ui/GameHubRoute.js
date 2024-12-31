"use client";

import React from "react";
import PropTypes from "prop-types";
import { useRouter } from "next/navigation";
import {
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
} from "@mui/material";
import HubIcon from "@mui/icons-material/Hub";

function GameHubRoute() {
  const router = useRouter();

  // local state to track if the game is in progress
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [openDialog, setOpenDialog] = React.useState(false);

  const handleNavigateToHub = () => {
    if (isPlaying) {
      // Logic for resetting game or cleaning up scores
      console.log("Game canceled. Scores reset.");
      setIsPlaying(false); // Reset the game state
    }
    router.push("/games/gamehub/"); // Navigate to the hub
  };

  const handleClick = () => {
    if (isPlaying) {
      setOpenDialog(true); // Open confirmation dialog if the game is playing
    } else {
      handleNavigateToHub();
    }
  };

  const handleConfirm = () => {
    setOpenDialog(false);
    handleNavigateToHub();
  };

  const handleClose = () => {
    setOpenDialog(false);
  };

  return (
    <>
      <IconButton
        color="primary"
        onClick={handleClick}
        aria-label="Go to Hub"
      >
        <HubIcon fontSize="small" />
      </IconButton>
      <Dialog open={openDialog} onClose={handleClose}>
        <DialogTitle>Are you sure?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Canceling will result in losing your current scores. Are you sure
            you want to continue?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Stay
          </Button>
          <Button onClick={handleConfirm} color="secondary">
            That&apos;s OK
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

GameHubRoute.propTypes = {
  // Define any props your component needs
};

export default GameHubRoute;
