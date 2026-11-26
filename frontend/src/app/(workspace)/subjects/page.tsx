import { redirect } from "next/navigation";
import type { ReactElement } from "react";
import { BranchSubjectsPage } from "@/components/branch/branch-subjects-page";
import { SubjectsPage } from "@/components/org-admin/subjects-page";
import { requireActiveDashboardContext } from "@/lib/auth-server";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }): Promise<ReactElement> {
  const { organisationId, manager, superUser } = await requireActiveDashboardContext(await searchParams);
  if (manager && !superUser) return <BranchSubjectsPage key={manager.branchId} {...manager} />;
  if (!organisationId || superUser) redirect("/dashboard");
  return <SubjectsPage key={organisationId} orgId={organisationId} />;
}
