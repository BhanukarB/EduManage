"use client";

import { useState } from "react";
import { Button, IconButton, Tooltip } from "@mui/material";
import LogoutOutlined from "@mui/icons-material/LogoutOutlined";

export function SignOutButton({ fullWidth = false, compact = false }: { fullWidth?: boolean; compact?: boolean }) {
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.assign("/");
    }
  }

  if (compact) return <Tooltip title="Log out"><IconButton aria-label="Log out" onClick={signOut} disabled={busy} color="error"><LogoutOutlined /></IconButton></Tooltip>;
  return <Button onClick={signOut} disabled={busy} variant="text" color="error" startIcon={<LogoutOutlined />} fullWidth={fullWidth} sx={fullWidth ? { justifyContent: "flex-start" } : undefined}>{busy ? "Logging out…" : "Log out"}</Button>;
}
