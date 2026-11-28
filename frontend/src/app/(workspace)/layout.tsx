import { cookies } from "next/headers";
import type { ReactElement, ReactNode } from "react";
import { WorkspaceShell } from "@/components/layout/workspace-sidebar";
import { requireDashboardContext } from "@/lib/auth-server";

export default async function WorkspaceLayout({ children }: { children: ReactNode }): Promise<ReactElement> {
  const { email, superUser, manager, organisationId } = await requireDashboardContext();
  const role = superUser ? "super" : manager ? "branch" : organisationId ? "organisation" : "member";
  const hidden = (await cookies()).get("cm_sidebar_hidden")?.value === "1";

  return <WorkspaceShell role={role} email={email} initiallyHidden={hidden}>{children}</WorkspaceShell>;
}
