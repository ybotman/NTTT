"use client";

import React, { useState } from "react";
import PropTypes from "prop-types";
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

const HubButton = ({ isPlaying, onNavigateToHub }) => {
  const [openDialog, setOpenDialog] = useState(false);

  const handleClick = () => {
    if (isPlaying) {
      setOpenDialog(true);
    } else {
      onNavigateToHub();
    }
  };

  const handleConfirm = () => {
    setOpenDialog(false);
    onNavigateToHub();
  };

  const handleClose = () => {
    setOpenDialog(false);
  };

  return (
    <>
      <IconButton color="primary" onClick={handleClick} aria-label="Go to Hub">
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
          <Button onClick={handleConfirm} color="secondary" autoFocus>
            That's OK
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

HubButton.propTypes = {
  isPlaying: PropTypes.bool.isRequired, // Determines if a game is in progress
  onNavigateToHub: PropTypes.func.isRequired, // Function to navigate to the hub
};

export default HubButton;
