import React from "react";
import { Box, Typography, Container, Paper } from "@mui/material";

export default function FairUsePage() {
  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ padding: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Fair Use Disclaimer
        </Typography>
        <Typography variant="body1" paragraph>
          This application uses audio snippets for the purpose of analysis,
          comparison, education, and research. These snippets are used in
          accordance with Section 107 of the Copyright Act, which allows for
          “Fair Use” of copyrighted material for purposes such as criticism,
          comment, teaching, scholarship, and research.
        </Typography>
        <Typography variant="body1" paragraph>
          Specifically, the audio snippets are:
        </Typography>
        <Box component="ul" sx={{ pl: 2 }}>
          <li>
            <Typography variant="body1">
              Limited to short durations (10 seconds or less).
            </Typography>
          </li>
          <li>
            <Typography variant="body1">
              Used solely for educational and analytical purposes.
            </Typography>
          </li>
          <li>
            <Typography variant="body1">
              Not provided for entertainment or commercial replacement of the
              original works.
            </Typography>
          </li>
        </Box>
        <Typography variant="body1" paragraph>
          All rights to the original works remain with the respective copyright
          holders. If you believe any content infringes upon your rights, please{" "}
          <a href="mailto:support@example.com">contact us</a> for prompt
          resolution.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
          This disclaimer is provided in good faith to demonstrate compliance
          with Fair Use principles.
        </Typography>
      </Paper>
    </Container>
  );
}
