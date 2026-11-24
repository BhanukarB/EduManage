import { requireBranchManager } from "@/lib/auth-server";
import { BranchClassesPage } from "@/components/branch/branch-classes-page";

export default async function BranchClassesRoute() {
  const manager = await requireBranchManager();
  return <BranchClassesPage key={manager.branchId} {...manager} />;
}
