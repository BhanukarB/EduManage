import { redirect } from "next/navigation";
import { requireBranchManager } from "@/lib/auth-server";

export default async function BranchClassDetailsRoute({ params }: { params: Promise<{ branchId: string; classId: string }> }) {
  const { branchId, classId } = await params;
  await requireBranchManager(branchId);
  redirect(`/dashboard/branch/classes/${classId}`);
}
