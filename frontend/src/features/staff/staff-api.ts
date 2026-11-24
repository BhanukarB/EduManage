import { api } from "@/lib/api";
import type { Staff } from "@/types/domain";

export type StaffChanges = Partial<Pick<Staff, "status" | "designation" | "branchId">>;

export function updateStaffMember(orgId: string, staffId: string, changes: StaffChanges): Promise<Staff> {
  return api<Staff>("organisations/staff/update", {
    method: "PUT",
    body: JSON.stringify({ orgId, staffId, ...changes }),
  });
}
