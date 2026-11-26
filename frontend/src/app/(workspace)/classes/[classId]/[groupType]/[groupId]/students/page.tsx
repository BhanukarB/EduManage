import type { ReactElement } from "react";
import { notFound } from "next/navigation";
import { redirect } from "next/navigation";
import { requireActiveDashboardContext } from "@/lib/auth-server";
import { StudentListPage } from "@/components/branch/student-list-page";

interface ListRoute {
  params: Promise<{ classId: string; groupType: string; groupId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function StudentListRoute({ params, searchParams }: ListRoute): Promise<ReactElement> {
  const { classId, groupType, groupId } = await params;
  const { manager } = await requireActiveDashboardContext(await searchParams);
  if (!manager) redirect("/dashboard");
  if (groupType !== "sections" && groupType !== "batches") notFound();
  return <StudentListPage key={groupId} {...manager} classId={classId} groupId={groupId} groupType={groupType} />;
}
