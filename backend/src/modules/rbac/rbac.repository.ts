import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { Assignment } from './access-context';
import { RoleType } from '../../utils/enums/roleType';
import { randomUUID } from 'crypto';
import knexConnection from '../../db/connector/knex';
import { CreateRoleDto, GetRoleDto, RolePermissionsDto } from './dto/rbac.dto';

@Injectable()
export class RbacRepository {
  async activeAssignments(userId: string): Promise<Assignment[]> {
    const base = knexConnection('user_roles_table as ur').join('roles_table as r', 'r.id', 'ur.role_id')
      .where('ur.is_active', true).where('ur.user_id', userId).select('r.id as roleId', 'r.role_name as name', 'r.role_type as roleType', 'ur.org_id as orgId');
    const [wide, staff, students] = await Promise.all([
      base.clone().whereNull('ur.branch_id').where(q => q
        .where({ 'r.role_type': RoleType.GLOBAL }).whereNull('ur.org_id')
        .orWhere(sub => sub.where({ 'r.role_type': RoleType.ORG_LEVEL }).whereNotNull('ur.org_id'))),
      base.clone().join('organisation_staff_table as s', function () {
        this.on('s.user_id', 'ur.user_id').andOn('s.org_id', 'ur.org_id');
      }).join('branches as b', 'b.id', 'ur.branch_id')
        .where({ 'r.role_type': RoleType.BRANCH_LEVEL, 's.status': 1 })
        .whereNot('r.role_name', 'student').select('b.id as branchId', 'b.branch_name as branchName'),
      base.clone().join('organisation_student_table as e', function () {
        this.on('e.user_id', 'ur.user_id').andOn('e.org_id', 'ur.org_id');
      }).join('branches as b', function () {
        this.on('b.id', 'e.branch_id').andOn('b.org_id', 'e.org_id');
      }).where({ 'r.role_name': 'student', 'e.status': 1 }).distinct('b.id as branchId', 'b.branch_name as branchName'),
    ]);
    return [...wide.map(row => ({ ...row, branchId: null, branchName: null })), ...staff, ...students];
  }

  async branchBelongsToOrg(branchId: string, orgId: string): Promise<boolean> {
    return Boolean(await knexConnection('branches').where({ id: branchId, org_id: orgId }).first('id'));
  }

  async createRole(roleData: CreateRoleDto): Promise<GetRoleDto> {
    try {
      const [role] = await knexConnection('roles_table')
        .insert({ id: randomUUID(), role_name: roleData.name, role_type: roleData.roleType ?? null })
        .returning(['id', 'role_name', 'role_type']);
      return { id: role.id, name: role.role_name, roleType: role.role_type, permission_count: 0 };
    } catch (error) {
      throw new InternalServerErrorException(`Failed to create role: ${error.message}`);
    }
  }

  async updateRole(roleId: string, roleData: CreateRoleDto): Promise<GetRoleDto> {
    try {
      const [role] = await knexConnection('roles_table')
        .where({ id: roleId })
        .update({ role_name: roleData.name, ...(roleData.roleType !== undefined ? { role_type: roleData.roleType } : {}) })
        .returning(['id', 'role_name', 'role_type']);
      if (!role) throw new Error('Role not found');
      return { id: role.id, name: role.role_name, roleType: role.role_type };
    } catch (error) {
      throw new InternalServerErrorException(`Failed to update role: ${error.message}`);
    }
  }

  async upsertPermissions(permissions: string[]): Promise<void> {
    try {
      for (const permission of permissions) {
        await knexConnection('permissions_table')
          .insert({ id: randomUUID(), permission })
          .onConflict('permission')
          .ignore();
      }
    } catch (error) {
      throw new InternalServerErrorException(`Unable to upsert permissions: ${error.message}`);
    }
  }

  async getAllPermissions(): Promise<{ id: string; permission: string }[]> {
    return knexConnection('permissions_table').select('id', 'permission');
  }

  async assignPermissionToRole(roleId: string, permissionIds: string[]): Promise<void> {
    await knexConnection.transaction(async (trx) => {
      await trx('role_permissions_table').where({ role_id: roleId }).del();
      if (permissionIds.length) {
        await trx('role_permissions_table').insert(permissionIds.map((permissionId) => ({
          id: randomUUID(), role_id: roleId, permission_id: permissionId,
        })));
      }
    });
  }

  async getRolePermissions(roleId: string): Promise<RolePermissionsDto> {
    const role = await knexConnection('roles_table').where({ id: roleId }).first();
    if (!role) throw new InternalServerErrorException('Role not found');
    const permissions = await knexConnection('role_permissions_table as rp')
      .join('permissions_table as p', 'rp.permission_id', 'p.id')
      .where('rp.role_id', roleId)
      .select('p.id', 'p.permission');
    return { roleId: role.id, role: role.role_name, permissions };
  }

  async getAllRoles(): Promise<GetRoleDto[]> {
    const roles = await knexConnection('roles_table as r')
      .leftJoin('role_permissions_table as rp', 'r.id', 'rp.role_id')
      .select('r.id', 'r.role_name as name', 'r.role_type as roleType')
      .count('rp.permission_id as permission_count')
      .groupBy('r.id', 'r.role_name', 'r.role_type');
    return roles.map((role) => ({
      id: String(role.id),
      name: String(role.name),
      roleType: role.roleType === null || role.roleType === undefined ? null : Number(role.roleType),
      permission_count: Number(role.permission_count),
    }));
  }

  async getBranchRoles(): Promise<GetRoleDto[]> {
    const roles = await knexConnection('roles_table as r')
      .leftJoin('role_permissions_table as rp', 'r.id', 'rp.role_id')
      .where('r.role_type', 3)
      .select('r.id', 'r.role_name as name', 'r.role_type as roleType')
      .count('rp.permission_id as permission_count')
      .groupBy('r.id', 'r.role_name', 'r.role_type');
    return roles.map((role) => ({
      id: String(role.id), name: String(role.name), roleType: Number(role.roleType),
      permission_count: Number(role.permission_count),
    }));
  }

  async getPermissionsByUserId(userId: string, orgId?: string): Promise<{ permission: string }[]> {
    const query = knexConnection('user_roles_table as ur')
      .join('role_permissions_table as rp', 'ur.role_id', 'rp.role_id')
      .join('permissions_table as p', 'rp.permission_id', 'p.id')
      .where('ur.is_active', true).where('ur.user_id', userId);
    if (orgId) query.andWhere((builder) => builder.where('ur.org_id', orgId).orWhereNull('ur.org_id'));
    return query.distinct('p.permission');
  }

  async getUserRoles(userId: string, orgId?: string): Promise<GetRoleDto[]> {
    const query = knexConnection('user_roles_table as ur')
      .join('roles_table as r', 'ur.role_id', 'r.id')
      .where('ur.user_id', userId);
    if (orgId) query.andWhere((builder) => builder.where('ur.org_id', orgId).orWhereNull('ur.org_id'));
    return query.select('r.id', 'r.role_name as name', 'r.role_type as roleType', 'ur.org_id as org_id', 'ur.branch_id as branchId');
  }

  async userHasRole(userId: string, roleName: string, orgId?: string): Promise<boolean> {
    const query = knexConnection('user_roles_table as ur')
      .join('roles_table as r', 'ur.role_id', 'r.id')
      .where('ur.is_active', true).where('ur.user_id', userId)
      .andWhere('r.role_name', roleName);
    if (orgId) query.andWhere((builder) => builder.where('ur.org_id', orgId).orWhereNull('ur.org_id'));
    else query.whereNull('ur.org_id');
    return Boolean(await query.first('ur.id'));
  }

  async editAssignment(userId: string, orgId: string, roleId: string, branchId: string | undefined, grant: boolean): Promise<void> {
    await knexConnection.transaction(async trx => {
      const profileQuery = trx('organisation_staff_table as s').where({ 's.user_id': userId, 's.org_id': orgId });
      if (grant) {
        profileQuery.join('users_table as u', function () {
          this.on('s.user_id', 'u.id').andOn('s.org_id', 'u.org_id');
        });
      }
      const profile = await profileQuery.forUpdate('s').first('s.id', 's.status');
      if (!profile || (grant && profile.status !== 1)) throw new BadRequestException('An active staff profile is required');
      const type = branchId ? RoleType.BRANCH_LEVEL : RoleType.ORG_LEVEL;
      const role = await trx('roles_table').where({ id: roleId, role_type: type }).whereNot('role_name', 'student').first('id');
      if (!role) throw new BadRequestException('The role does not belong to this scope');
      const scope = { user_id: userId, org_id: orgId, branch_id: branchId ?? null };
      if (grant && branchId) {
        const branch = await trx('branches').where({ id: branchId, org_id: orgId }).first('id');
        if (!branch) throw new BadRequestException('Branch does not belong to this organisation');
        const member = await trx('user_roles_table').where(scope).orderBy('is_active', 'desc').first('is_active');
        if (member && !member.is_active) throw new BadRequestException('Branch membership is inactive');
      }
      const key = { ...scope, role_id: roleId };
      if (grant) await trx('user_roles_table').insert({ id: randomUUID(), ...key }).onConflict().ignore();
      else await trx('user_roles_table').where(key).del();
    });
  }

  async updateBranchMembership(userId: string, orgId: string, branchId: string, status: number): Promise<void> {
    const updated = await knexConnection('user_roles_table')
      .where({ user_id: userId, org_id: orgId, branch_id: branchId }).update({ is_active: status === 1, is_deleted: status === 2 });
    if (!updated) throw new BadRequestException('Branch membership was not found');
  }

  async assignRolesToUser(userId: string, roleIds: string[], orgId: string, branchId?: string): Promise<void> {
    await knexConnection.transaction(async trx => {
      const user = await trx('users_table').where({ id: userId, org_id: orgId }).forUpdate().first('id');
      if (!user) throw new BadRequestException('User does not belong to this organisation');
      const roles = await trx('roles_table').whereIn('id', roleIds).select('id', 'role_type', 'role_name');
      const type = branchId ? RoleType.BRANCH_LEVEL : RoleType.ORG_LEVEL;
      if (roles.length !== new Set(roleIds).size || roles.some(role => role.role_type !== type || role.role_name === 'student')) {
        throw new BadRequestException('Select roles belonging to one scope. Branch roles require an explicit branch.');
      }
      const scope = { user_id: userId, org_id: orgId, branch_id: branchId ?? null };
      if (branchId) {
        const member = await trx('user_roles_table as m').join('organisation_staff_table as s', function () {
          this.on('m.org_id', 's.org_id').andOn('m.user_id', 's.user_id');
        }).where({ 'm.org_id': orgId, 'm.user_id': userId, 'm.branch_id': branchId, 'm.is_active': true, 's.status': 1 })
          .forUpdate().first('m.id');
        if (!member) throw new BadRequestException('Active branch membership is required');
      }
      const editable = trx('roles_table').where({ role_type: type }).whereNot('role_name', 'student').select('id');
      await trx('user_roles_table').where(scope).whereIn('role_id', editable).whereNotIn('role_id', roleIds).del();
      if (roles.length) await trx('user_roles_table').insert(roles.map(role => ({
        id: randomUUID(), ...scope, role_id: role.id,
      }))).onConflict().ignore();
    });
  }
}
