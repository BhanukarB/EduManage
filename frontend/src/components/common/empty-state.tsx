import type { ReactNode } from "react";
import { Box, Button, Typography } from "@mui/material";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <Box sx={{ textAlign: "center", py: 7, px: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "center", color: "text.disabled", mb: 1.5, "& .MuiSvgIcon-root": { fontSize: 44 } }}>{icon}</Box>
      <Typography variant="h6">{title}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: actionLabel && onAction ? 2.5 : 0 }}>{description}</Typography>
      {actionLabel && onAction && <Button variant="contained" onClick={onAction}>{actionLabel}</Button>}
    </Box>
  );
}
