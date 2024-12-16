

//------------------------------------------------------------
// src/app/games/gamehub/page.js (Game Hub)
//------------------------------------------------------------
"use client";
import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Box, Button, Typography, List, ListItem, Paper, Stack } from '@mui/material';
import Link from 'next/link';
import { AuthContext } from '@/contexts/AuthContext';
import { auth, signInAnonymously, signOut } from '@/utils/firebase';

export default function GameHubPage() {
  const { user, loadingUser } = useContext(AuthContext);

  const handleLogin = async () => {
    await signInAnonymously(auth);
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const subgames = [
    { name: 'Artist Quiz', path: '/games/artistquiz', active: true },
    { name: 'Artist Train', path: '#', active: false },
    { name: 'Decade Quiz', path: '#', active: false },
    { name: 'Decade Train', path: '#', active: false },
    { name: 'Style Quiz', path: '#', active: false },
    { name: 'Singer Quiz', path: '#', active: false },
    { name: 'Singer Train', path: '#', active: false },
    { name: 'Tango Bingo', path: '#', active: false },
    { name: 'Song Quiz', path: '#', active: false },
    { name: 'Song Train', path: '#', active: false }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3, mb: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h4" gutterBottom>Game Hub</Typography>
          {!loadingUser && (
            user ? (
              <Button variant="outlined" onClick={handleLogout}>Logout</Button>
            ) : (
              <Button variant="contained" onClick={handleLogin}>Login</Button>
            )
          )}
        </Stack>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Select a subgame to start playing. (Others coming soon!)
        </Typography>
        <List>
          {subgames.map((g) => (
            <ListItem button="true" key={g.name}>
              {g.active ? (
                <Link href={g.path}>
                  <Button variant="contained">{g.name}</Button>
                </Link>
              ) : (
                <Button variant="outlined" disabled>{g.name}</Button>
              )}
            </ListItem>
          ))}
        </List>
      </Paper>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>Configure Settings</Typography>
        <Link href="/config">
          <Button variant="outlined">Go to Configuration</Button>
        </Link>
      </Paper>
    </Box>
  );
}

GameHubPage.propTypes = {};