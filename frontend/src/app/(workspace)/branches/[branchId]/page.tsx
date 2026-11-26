import { redirect } from "next/navigation";
import { requireActiveDashboardContext } from "@/lib/auth-server";
import { BranchDetailsPage } from "@/components/branch/branch-details-page";

export default async function BranchPage({ params, searchParams }: { params: Promise<{ branchId: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [{ branchId }, query] = await Promise.all([params, searchParams]);
  const { manager, organisationId } = await requireActiveDashboardContext(query);
  if (manager) {
    if (manager.branchId !== branchId) redirect("/dashboard");
    if (query.view === "staff") redirect("/staff");
    return <BranchDetailsPage {...manager} branchManager />;
  }
  if (!organisationId) redirect("/dashboard");
  return <BranchDetailsPage key={branchId} orgId={organisationId} branchId={branchId} />;
}
