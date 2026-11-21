import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/auth-server";
import { BranchDetailsPage } from "@/components/pages/branch-details-page";

function getOrganisationId(token?: string) {
  try {
    const payload = token?.split(".")[1];
    if (!payload) return null;
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { roles?: unknown; role_names?: unknown; orgId?: unknown };
    const roles = [...(Array.isArray(claims.roles) ? claims.roles : []), ...(Array.isArray(claims.role_names) ? claims.role_names : [])];
    return roles.includes("org_admin") && typeof claims.orgId === "string" ? claims.orgId : null;
  } catch { return null; }
}

export default async function BranchPage({ params }: { params: Promise<{ branchId: string }> }) {
  const jar = await cookies();
  if (!jar.has(ACCESS_COOKIE) && !jar.has(REFRESH_COOKIE)) redirect("/");
  const orgId = getOrganisationId(jar.get(ACCESS_COOKIE)?.value);
  if (!orgId) redirect("/dashboard");
  const { branchId } = await params;
  return <BranchDetailsPage orgId={orgId} branchId={branchId} />;
}
