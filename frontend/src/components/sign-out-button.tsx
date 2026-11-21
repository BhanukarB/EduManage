"use client";

import { useState } from "react";
import { Button } from "@mui/material";

export function SignOutButton() {
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.assign("/");
    }
  }

  return <Button onClick={signOut} disabled={busy}>{busy ? "Logging out…" : "Log out"}</Button>;
}
