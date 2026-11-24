import type { ReactNode } from "react";
import { Box, CircularProgress } from "@mui/material";

export function PanelLoading({ padding = 6 }: { padding?: number }): ReactNode {
  return (
    <Box sx={{ display: "flex", justifyContent: "center", py: padding }}>
      <CircularProgress aria-label="Loading" />
    </Box>
  );
}
