import type { ReactNode } from "react";
import { Box } from "@mui/material";

export function BranchWorkspace({ maxWidth = 1100, children }: {
  maxWidth?: number;
  children: ReactNode;
}): ReactNode {
  return (
    <Box component="main" sx={{ p: { xs: 2, md: 4 } }}>
      <Box sx={{ maxWidth, mx: "auto" }}>{children}</Box>
    </Box>
  );
}
