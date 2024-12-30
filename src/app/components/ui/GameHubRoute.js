//------------------------------------------------------------
//src/app/components/ui/GameHubRoute.js
//------------------------------------------------------------
import React from "react";
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
import usePlay from "@/hooks/usePlay";

const HubButton = () => {
  const { isPlaying, handleNavigateToHub } = usePlay(); // Access the hook directly

  const [openDialog, setOpenDialog] = React.useState(false);

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
          <Button onClick={handleConfirm} color="secondary">
            That&apos;s OK
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default HubButton;
