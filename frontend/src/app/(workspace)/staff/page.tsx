import { requireBranchManager } from "@/lib/auth-server";
import { BranchDetailsPage } from "@/components/branch/branch-details-page";

export default async function BranchStaffRoute() {
  const manager = await requireBranchManager();
  return <BranchDetailsPage key={manager.branchId} {...manager} branchManager initialStaffView />;
}
