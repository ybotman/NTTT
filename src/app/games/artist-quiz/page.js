"use client";

import React, { useState } from "react";
import { Box, Tabs, Tab } from "@mui/material";
import ConfigTab from "./ConfigTab";
import PlayTab from "./PlayTab";
import styles from "../styles.module.css";

export default function ArtistQuizPage() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <Box className={styles.container}>
      <Tabs
        value={activeTab}
        onChange={(_, newValue) => setActiveTab(newValue)}
        centered
      >
        <Tab label="Configuration" />
        <Tab label="Play Game" />
      </Tabs>
      {activeTab === 0 && <ConfigTab />}
      {activeTab === 1 && <PlayTab />}
    </Box>
  );
}
