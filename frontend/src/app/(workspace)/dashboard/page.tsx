import type { ReactElement } from "react";
import DashboardPage from "@/components/dashboard/dashboard-page";
import { requireActiveDashboardContext } from "@/lib/auth-server";
import { redirect } from "next/navigation";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }): Promise<ReactElement> {
  const params = await searchParams;
  const context = await requireActiveDashboardContext(params);
  if (params.role && !context.activeRoleId) redirect("/dashboard");
  if (!params.role && context.activeRoleId) {
    const scope = context.manager ?? context.teacher;
    redirect(`/dashboard?role=${context.activeRoleId}${context.organisationId ? `&org=${context.organisationId}` : ""}${scope ? `&org=${scope.orgId}&branch=${scope.branchId}` : ""}`);
  }
  return <DashboardPage section="Dashboard" context={context} />;
}
