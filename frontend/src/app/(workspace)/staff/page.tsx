import { redirect } from "next/navigation";
import { requireActiveDashboardContext } from "@/lib/auth-server";
import { BranchDetailsPage } from "@/components/branch/branch-details-page";

export default async function BranchStaffRoute({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { manager } = await requireActiveDashboardContext(await searchParams);
  if (!manager) redirect("/dashboard");
  return <BranchDetailsPage key={manager.branchId} {...manager} branchManager initialStaffView />;
}
