import { redirect } from "next/navigation";
import type { ReactElement } from "react";
import { BranchSubjectsPage } from "@/components/branch/branch-subjects-page";
import { SubjectsPage } from "@/components/org-admin/subjects-page";
import { requireDashboardContext } from "@/lib/auth-server";

export default async function Page(): Promise<ReactElement> {
  const { organisationId, manager, superUser } = await requireDashboardContext();
  if (manager && !superUser) return <BranchSubjectsPage key={manager.branchId} {...manager} />;
  if (!organisationId || superUser) redirect("/dashboard");
  return <SubjectsPage key={organisationId} orgId={organisationId} />;
}
