"use client";

import { createTheme, ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import type { ReactNode } from "react";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#4F46E5", light: "#818CF8", dark: "#3730A3", contrastText: "#fff" },
    secondary: { main: "#6B7280" },
    success: { main: "#16A34A", light: "#DCFCE7", dark: "#15803D" },
    warning: { main: "#F59E0B", light: "#FEF3C7", dark: "#B45309" },
    error: { main: "#DC2626", light: "#FEE2E2", dark: "#B91C1C" },
    info: { main: "#2563EB", light: "#DBEAFE", dark: "#1D4ED8" },
    background: { default: "#F8FAFC", paper: "#FFFFFF" },
    divider: "rgba(15, 23, 42, 0.08)",
    text: { primary: "#1E293B", secondary: "#64748B" },
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h4: { fontSize: "1.75rem", fontWeight: 700, lineHeight: 1.3, letterSpacing: "-0.01em" },
    h5: { fontSize: "1.35rem", fontWeight: 700, lineHeight: 1.4 },
    h6: { fontSize: "1.1rem", fontWeight: 600, lineHeight: 1.5 },
    subtitle1: { fontSize: "1rem", fontWeight: 600 },
    subtitle2: { fontSize: "0.875rem", fontWeight: 600 },
    body1: { fontSize: "0.9375rem", lineHeight: 1.6 },
    body2: { fontSize: "0.8125rem", lineHeight: 1.5 },
    caption: { fontSize: "0.75rem", fontWeight: 500, letterSpacing: "0.04em" },
    overline: { fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.08em" },
    button: { textTransform: "none", fontWeight: 600 },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 8, padding: "8px 20px", fontSize: "0.875rem" },
        outlined: { borderColor: "rgba(15, 23, 42, 0.14)" },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { backgroundImage: "none" },
        outlined: { borderColor: "rgba(15, 23, 42, 0.08)" },
      },
    },
    MuiTextField: {
      defaultProps: { variant: "outlined", size: "medium" },
      styleOverrides: { root: { "& .MuiOutlinedInput-root": { borderRadius: 8 } } },
    },
    MuiDialog: { styleOverrides: { paper: { borderRadius: 16 } } },
    MuiDialogTitle: { styleOverrides: { root: { paddingBottom: 8 } } },
    MuiDialogContent: { styleOverrides: { dividers: { paddingTop: 24, paddingBottom: 24 } } },
    MuiDialogActions: { styleOverrides: { root: { padding: "16px 24px", gap: 8 } } },
    MuiTab: {
      styleOverrides: { root: { textTransform: "none", fontWeight: 600, fontSize: "0.875rem", minHeight: 44 } },
    },
    MuiListItemButton: {
      styleOverrides: { root: { borderRadius: 8, "&.Mui-selected": { backgroundColor: "rgba(79, 70, 229, 0.06)" } } },
    },
    MuiAlert: { styleOverrides: { root: { borderRadius: 8 } } },
    MuiDivider: { styleOverrides: { root: { borderColor: "rgba(15, 23, 42, 0.06)" } } },
    MuiChip: { styleOverrides: { root: { fontWeight: 600, fontSize: "0.75rem" } } },
  },
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  return <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>;
}
