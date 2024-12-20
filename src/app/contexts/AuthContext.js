//------------------------------------------------------------
// src/contexts/AuthContext.js
//------------------------------------------------------------
"use client";
import React, { createContext, useState, useEffect } from "react";
import PropTypes from "prop-types";
import { auth, onAuthStateChanged } from "@/utils/firebase";

export const AuthContext = createContext({
  user: null,
  loadingUser: true,
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoadingUser(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loadingUser }}>
      {children}
    </AuthContext.Provider>
  );
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
