import { redirect } from "next/navigation";
import { ACCESS_COOKIE, getEmailFromToken, getOrgAdminOrgId, requireAuth } from "@/lib/auth-server";
import { BranchDetailsPage } from "@/components/branch/branch-details-page";

export default async function BranchPage({ params }: { params: Promise<{ branchId: string }> }) {
  const jar = await requireAuth();
  const token = jar.get(ACCESS_COOKIE)?.value;
  const orgId = getOrgAdminOrgId(token);
  if (!orgId) redirect("/dashboard");
  const { branchId } = await params;
  return <BranchDetailsPage orgId={orgId} branchId={branchId} email={getEmailFromToken(token)} />;
}
