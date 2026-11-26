import { redirect } from "next/navigation";
import { requireActiveDashboardContext } from "@/lib/auth-server";
import { BranchClassesPage } from "@/components/branch/branch-classes-page";
import { TeachingDashboard } from "@/components/teacher/teaching-dashboard";

export default async function BranchClassesRoute({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const context = await requireActiveDashboardContext(await searchParams);
  if (context.teacher) return <TeachingDashboard {...context.teacher} />;
  if (!context.manager) redirect("/dashboard");
  return <BranchClassesPage key={context.manager.branchId} {...context.manager} />;
}
