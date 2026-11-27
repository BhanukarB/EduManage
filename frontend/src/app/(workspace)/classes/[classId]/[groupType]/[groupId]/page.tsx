import type { ReactElement } from "react";
import { notFound, redirect } from "next/navigation";
import { SectionDetailsPage } from "@/components/pages/section-details-page";
import { requireActiveDashboardContext } from "@/lib/auth-server";

interface SectionRouteProps {
  params: Promise<{ classId: string; groupType: string; groupId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function SectionRoute({ params, searchParams }: SectionRouteProps): Promise<ReactElement> {
  const { classId, groupType, groupId } = await params;
  if (groupType !== "sections") notFound();
  const { manager } = await requireActiveDashboardContext(await searchParams);
  if (!manager) redirect("/dashboard");
  return <SectionDetailsPage key={`${manager.branchId}:${classId}:${groupId}`} {...manager} classId={classId} sectionId={groupId} />;
}
