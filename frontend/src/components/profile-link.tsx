import { Avatar, IconButton, Tooltip } from "@mui/material";
import AccountCircleOutlined from "@mui/icons-material/AccountCircleOutlined";

export function ProfileLink({ email }: { email?: string }) {
  const initials = email?.trim().charAt(0).toUpperCase();

  return (
    <Tooltip title="Open profile">
      <IconButton
        href="/dashboard/profile"
        aria-label="Open profile"
        sx={{ border: "1px solid", borderColor: "divider" }}
      >
        {initials ? <Avatar sx={{ width: 30, height: 30, fontSize: 14 }}>{initials}</Avatar> : <AccountCircleOutlined />}
      </IconButton>
    </Tooltip>
  );
}
