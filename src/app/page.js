import Link from "next/link";
import { Button } from "@mui/material";

export default function SomeComponent() {
  return (
    <Button
      variant="contained"
      component={Link}
      href="/games/gamehub"
      sx={{
        borderColor: "var(--foreground)",
        color: "var(--foreground)",
        "&:hover": {
          background: "var(--foreground)",
          color: "var(--background)",
        },
      }}
    >
      Go to GameHub
    </Button>
  );
}
