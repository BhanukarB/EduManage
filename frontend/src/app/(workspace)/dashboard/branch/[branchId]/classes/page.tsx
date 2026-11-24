import { redirect } from "next/navigation";
import { requireBranchManager } from "@/lib/auth-server";

export default async function BranchClassesRoute({ params }: { params: Promise<{ branchId: string }> }) {
  const { branchId } = await params;
  await requireBranchManager(branchId);
  redirect("/classes");
}
