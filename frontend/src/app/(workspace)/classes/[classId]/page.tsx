import type { ReactElement } from "react";
import { redirect } from "next/navigation";
import { requireActiveDashboardContext } from "@/lib/auth-server";
import { BranchClassDetailsPage } from "@/components/branch/branch-class-details-page";

export default async function BranchClassDetailsRoute({ params, searchParams }: { params: Promise<{ classId: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }): Promise<ReactElement> {
  const { classId } = await params;
  const { manager } = await requireActiveDashboardContext(await searchParams);
  if (!manager) redirect("/dashboard");
  return <BranchClassDetailsPage key={`${manager.branchId}:${classId}`} {...manager} classId={classId} />;
}
