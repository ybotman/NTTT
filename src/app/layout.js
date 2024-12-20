
//------------------------------------------------------------
// src/app/layout.js
//------------------------------------------------------------
'use client';

import React, { useEffect, useState } from 'react';
import './globals.css';  

import PropTypes from 'prop-types';
import { ScoreProvider } from '@/contexts/ScoreContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { CssBaseline } from '@mui/material';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }) {
  const [theme, setTheme] = useState('light');

  // Check system preference and update theme on mount
  useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(prefersDark ? 'dark' : 'light');
  }, []);

  // Dynamically apply the theme to the HTML element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <html lang="en" className={inter.className}>
      <body>
        <CssBaseline />
        <AuthProvider>
          <ScoreProvider>
            {/* Add a theme toggle button for demo */}
            <button
              type="button"
              onClick={toggleTheme}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                padding: '0.5rem 1rem',
                background: 'var(--foreground)',
                color: 'var(--background)',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Toggle Theme
            </button>
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
