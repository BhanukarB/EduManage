import { requireBranchManager } from "@/lib/auth-server";
import { BranchClassDetailsPage } from "@/components/branch/branch-class-details-page";

export default async function BranchClassDetailsRoute({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = await params;
  const manager = await requireBranchManager();
  return <BranchClassDetailsPage key={`${manager.branchId}:${classId}`} {...manager} classId={classId} />;
}
