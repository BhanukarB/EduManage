import type { ReactElement } from "react";
import { notFound } from "next/navigation";
import { requireBranchManager } from "@/lib/auth-server";
import { StudentRosterPage } from "@/components/branch/student-roster-page";

interface RosterRoute {
  params: Promise<{ classId: string; groupType: string; groupId: string }>;
}

export default async function StudentRosterRoute({ params }: RosterRoute): Promise<ReactElement> {
  const { classId, groupType, groupId } = await params;
  const manager = await requireBranchManager();
  if (groupType !== "sections" && groupType !== "batches") notFound();
  return <StudentRosterPage key={groupId} {...manager} classId={classId} groupId={groupId} groupType={groupType} />;
}
