import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import knexConnection from '../../db/connector/knex';
import { CreateRoleDto, GetRoleDto, RolePermissionsDto } from './dto/rbac.dto';

@Injectable()
export class RbacRepository {
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
      .where('ur.user_id', userId);
    if (orgId) query.andWhere((builder) => builder.where('ur.org_id', orgId).orWhereNull('ur.org_id'));
    return query.distinct('p.permission');
  }

  async getUserRoles(userId: string, orgId?: string): Promise<GetRoleDto[]> {
    const query = knexConnection('user_roles_table as ur')
      .join('roles_table as r', 'ur.role_id', 'r.id')
      .where('ur.user_id', userId);
    if (orgId) query.andWhere((builder) => builder.where('ur.org_id', orgId).orWhereNull('ur.org_id'));
    return query.select('r.id', 'r.role_name as name', 'r.role_type as roleType', 'ur.org_id as org_id');
  }

  async userHasRole(userId: string, roleName: string, orgId?: string): Promise<boolean> {
    const query = knexConnection('user_roles_table as ur')
      .join('roles_table as r', 'ur.role_id', 'r.id')
      .where('ur.user_id', userId)
      .andWhere('r.role_name', roleName);
    if (orgId) query.andWhere((builder) => builder.where('ur.org_id', orgId).orWhereNull('ur.org_id'));
    else query.whereNull('ur.org_id');
    return Boolean(await query.first('ur.id'));
  }

  async assignRolesToUser(userId: string, roleIds: string[], orgId: string): Promise<void> {
    await knexConnection.transaction(async (trx) => {
      const user = await trx('users_table').where({ id: userId, org_id: orgId }).first('id');
      if (!user) throw new Error('User does not belong to this organisation');
      const roles = await trx('roles_table').whereIn('id', roleIds).select('id', 'role_name');
      if (roles.length !== new Set(roleIds).size) throw new Error('One or more roles do not exist');
      if (roles.some((role) => role.role_name === 'super_admin')) throw new Error('Organisation admins cannot assign super_admin');
      await trx('user_roles_table').where({ user_id: userId, org_id: orgId }).del();
      if (roleIds.length) {
        await trx('user_roles_table').insert(roleIds.map((roleId) => ({
          id: randomUUID(), user_id: userId, role_id: roleId, org_id: orgId,
        })));
      }
    });
  }
}
