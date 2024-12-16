
//------------------------------------------------------------
// src/app/layout.js
//------------------------------------------------------------

import React from 'react';
import PropTypes from 'prop-types';
import { ScoreProvider } from '@/contexts/ScoreContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { CssBaseline } from '@mui/material';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        <CssBaseline />
        <AuthProvider>
          <ScoreProvider>
            {children}
          </ScoreProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

RootLayout.propTypes = {
  children: PropTypes.node.isRequired,
};
