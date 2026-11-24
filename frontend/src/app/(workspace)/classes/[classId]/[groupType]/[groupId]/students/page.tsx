import type { ReactElement } from "react";
import { notFound } from "next/navigation";
import { requireBranchManager } from "@/lib/auth-server";
import { StudentListPage } from "@/components/branch/student-list-page";

interface ListRoute {
  params: Promise<{ classId: string; groupType: string; groupId: string }>;
}

export default async function StudentListRoute({ params }: ListRoute): Promise<ReactElement> {
  const { classId, groupType, groupId } = await params;
  const manager = await requireBranchManager();
  if (groupType !== "sections" && groupType !== "batches") notFound();
  return <StudentListPage key={groupId} {...manager} classId={classId} groupId={groupId} groupType={groupType} />;
}
