import { redirect } from "next/navigation";
import type { ReactElement } from "react";
import { SubjectsPage } from "@/components/org-admin/subjects-page";
import { requireDashboardContext } from "@/lib/auth-server";

export default async function Page(): Promise<ReactElement> {
  const { organisationId, manager, superUser } = await requireDashboardContext();
  if (!organisationId || manager || superUser) redirect("/dashboard");
  return <SubjectsPage key={organisationId} orgId={organisationId} />;
}
