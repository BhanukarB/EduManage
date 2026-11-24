import { redirect } from "next/navigation";
import { requireDashboardContext } from "@/lib/auth-server";
import { BranchDetailsPage } from "@/components/branch/branch-details-page";

export default async function BranchPage({ params, searchParams }: { params: Promise<{ branchId: string }>; searchParams: Promise<{ view?: string | string[] }> }) {
  const [{ branchId }, query, { manager, organisationId, email }] = await Promise.all([
    params, searchParams, requireDashboardContext(),
  ]);
  if (manager) {
    if (manager.branchId !== branchId) redirect("/dashboard");
    redirect(query.view === "staff" ? "/dashboard/branch/staff" : "/dashboard");
  }
  if (!organisationId) redirect("/dashboard");
  return <BranchDetailsPage key={branchId} orgId={organisationId} branchId={branchId} email={email} />;
}
