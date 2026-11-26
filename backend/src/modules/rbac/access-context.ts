import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { isUUID } from 'class-validator';

export interface Assignment {
  roleId: string;
  name: string;
  roleType: number;
  orgId: string | null;
  branchId: string | null;
  branchName: string | null;
}

export function scopeId(values: unknown[]): string | undefined {
  const ids = values.filter(value => value !== undefined);
  for (const id of ids) {
    if (typeof id !== 'string' || !isUUID(id)) throw new BadRequestException('Scope IDs must be UUIDs');
  }
  if (new Set(ids).size > 1) throw new BadRequestException('Conflicting scope IDs');
  return ids[0] as string | undefined;
}

export function selectAssignment(assignments: Assignment[], roleId?: string, orgId?: string, branchId?: string): Assignment {
  if (!roleId && new Set(assignments.map(row => row.roleId)).size > 1) {
    throw new BadRequestException('Select an acting role');
  }
  const matches = assignments.filter(row =>
    (!roleId || roleId === row.roleId) &&
    (!orgId || !row.orgId || orgId === row.orgId) &&
    (!branchId || !row.branchId || branchId === row.branchId));
  if (!matches.length) throw new ForbiddenException('This role and scope are unavailable');
  if (matches.length !== 1) throw new BadRequestException('Select an organisation and branch');
  return matches[0];
}
