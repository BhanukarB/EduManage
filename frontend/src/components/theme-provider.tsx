"use client";

import { createTheme, ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import type { ReactNode } from "react";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#3457d5" },
    background: { default: "#f6f7fb", paper: "#ffffff" },
  },
  shape: { borderRadius: 12 },
  typography: { fontFamily: "Arial, Helvetica, sans-serif" },
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  return <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>;
}
