import { readApi, readCachedApi } from "@/lib/api";

export interface BranchClass {
  id: string;
  className: string;
  classCode: string;
  description?: string | null;
}

export interface BranchSummary {
  branch: {
    branchName: string;
    branchCode: string;
    emailId: string;
    phoneNumber?: string | null;
    status: number;
    type: number;
  };
  staffCount: number;
  studentCount: number;
  classes?: BranchClass[];
  classCount?: number;
}

const maxAge = 30_000;

function summaryPath(orgId: string, branchId: string, countsOnly: boolean): string {
  return `organisations/${orgId}/branches/${branchId}/summary${countsOnly ? "?countsOnly=true" : ""}`;
}

export function readBranchSummary(orgId: string, branchId: string, countsOnly: boolean): Promise<BranchSummary> {
  return readApi<BranchSummary>(summaryPath(orgId, branchId, countsOnly), maxAge);
}

export async function readBranchClasses(orgId: string, branchId: string, classId?: string): Promise<BranchClass[]> {
  const path = `organisations/${orgId}/${branchId}/classes`;
  if (!classId) return readApi<BranchClass[]>(path, maxAge);
  const cached = readCachedApi<BranchClass[]>(path);
  const selected = cached && (await cached).find((item) => item.id === classId);
  return selected ? [selected] : readApi<BranchClass[]>(`${path}?classId=${encodeURIComponent(classId)}`, maxAge);
}

export async function readBranchIdentity(orgId: string, branchId: string): Promise<BranchSummary["branch"]> {
  const summary = readCachedApi<BranchSummary>(summaryPath(orgId, branchId, true)) ??
    readCachedApi<BranchSummary>(summaryPath(orgId, branchId, false));
  if (summary) return (await summary).branch;

  const branches = await readApi<(BranchSummary["branch"] & { id: string })[]>(`organisations/${orgId}/branches`, maxAge);
  const branch = branches.find((item) => item.id === branchId);
  if (!branch) throw new Error("Could not load the assigned branch.");
  return branch;
}
