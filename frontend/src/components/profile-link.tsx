"use client";

import { Avatar, IconButton, Tooltip } from "@mui/material";
import AccountCircleOutlined from "@mui/icons-material/AccountCircleOutlined";

export function ProfileLink({ email }: { email?: string }) {
  const initials = email?.trim().charAt(0).toUpperCase();

  return (
    <Tooltip title="Open profile">
      <IconButton
        href="/dashboard/profile"
        aria-label="Open profile"
        sx={{ p: 0.5, "&:hover": { opacity: 0.82, bgcolor: "action.hover" } }}
      >
        {initials ? <Avatar sx={{ width: 36, height: 36, fontSize: 15, bgcolor: "primary.main", color: "common.white" }}>{initials}</Avatar> : <AccountCircleOutlined />}
      </IconButton>
    </Tooltip>
  );
}
