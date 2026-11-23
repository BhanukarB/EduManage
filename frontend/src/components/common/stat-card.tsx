import type { ReactNode } from "react";
import { Box, Paper, Stack, Typography } from "@mui/material";

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  onClick?: () => void;
}

export function StatCard({ icon, label, value, onClick }: StatCardProps) {
  return (
    <Paper
      variant="outlined"
      {...(onClick ? { component: "button" as const, onClick, type: "button" as const } : {})}
      sx={{
        p: 3,
        borderRadius: "12px",
        flex: 1,
        minWidth: 0,
        textAlign: "left",
        bgcolor: "background.paper",
        ...(onClick ? { cursor: "pointer", "&:hover": { borderColor: "primary.main", boxShadow: 1 } } : {}),
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center">
        <Box sx={{ width: 44, height: 44, borderRadius: "50%", display: "grid", placeItems: "center", bgcolor: "primary.light", color: "primary.dark", flexShrink: 0 }}>
          {icon}
        </Box>
        <Box>
          <Typography variant="body2" color="text.secondary">{label}</Typography>
          <Typography variant="h4" component="p">{value}</Typography>
        </Box>
      </Stack>
    </Paper>
  );
}
