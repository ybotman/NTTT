//------------------------------------------------------------
// src/app/page.js (Main landing page)
//------------------------------------------------------------
"use client";
import React from "react";
import Link from "next/link";
import { Box, Button, Typography, Paper } from "@mui/material";

export default function HomePage() {
  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h3" gutterBottom>
          Name That Tango Tune
        </Typography>
        <Typography variant="body1" gutterBottom>
          Welcome to the ultimate tango music quiz suite!
        </Typography>
        <Box sx={{ mt: 2 }}>
          <Link href="/games/gamehub">
            <Button variant="contained">Enter Game Hub</Button>
          </Link>
        </Box>
        <Box sx={{ mt: 2 }}>
          <Link href="/config">
            <Button variant="outlined">Configuration</Button>
          </Link>
        </Box>
      </Paper>
    </Box>
  );
}
