import { redirect } from "next/navigation";
import type { ReactElement } from "react";
import { AcademicSessionsPage } from "@/components/org-admin/academic-sessions-page";
import { requireActiveDashboardContext } from "@/lib/auth-server";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<ReactElement> {
  const { organisationId, manager, superUser } = await requireActiveDashboardContext(await searchParams);
  if (!organisationId || manager || superUser) redirect("/dashboard");
  return <AcademicSessionsPage key={organisationId} orgId={organisationId} />;
}
