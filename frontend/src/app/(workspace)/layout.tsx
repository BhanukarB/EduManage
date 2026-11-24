import { cookies } from "next/headers";
import type { ReactElement, ReactNode } from "react";
import { Box } from "@mui/material";
import { WorkspaceSidebar } from "@/components/layout/workspace-sidebar";
import { requireDashboardContext } from "@/lib/auth-server";

export default async function WorkspaceLayout({ children }: { children: ReactNode }): Promise<ReactElement> {
  const { email, superUser, manager, organisationId } = await requireDashboardContext();
  const role = superUser ? "super" : manager ? "branch" : organisationId ? "organisation" : "member";
  const hidden = (await cookies()).get("cm_sidebar_hidden")?.value === "1";

  return (
    <Box sx={{ display: "flex", minHeight: "100dvh", bgcolor: "background.default" }}>
      <WorkspaceSidebar role={role} email={email} initiallyHidden={hidden} />
      <Box sx={{ flex: 1, minWidth: 0 }}>{children}</Box>
    </Box>
  );
}
