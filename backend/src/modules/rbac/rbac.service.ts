import { BadRequestException, Injectable } from '@nestjs/common';
import { Assignment } from './access-context';
import { RbacRepository } from './rbac.repository';
import { CreateRoleDto, GetRoleDto, RolePermissionsDto } from './dto/rbac.dto';
import { Logger } from '../../logger';

@Injectable()
export class RbacService {
  private readonly logger = new Logger(RbacService.name);

  constructor(private readonly rbacRepository: RbacRepository) {}

  async activeAssignments(userId: string): Promise<Assignment[]> {
    try {
      return await this.rbacRepository.activeAssignments(userId);
    } catch (error) {
      this.logger.error(`Failed to fetch active assignments for user ${userId}`, error);
      throw error;
    }
  }

  async branchBelongsToOrg(branchId: string, orgId: string): Promise<boolean> {
    try {
      return await this.rbacRepository.branchBelongsToOrg(branchId, orgId);
    } catch (error) {
      this.logger.error(`Failed to check if branch ${branchId} belongs to org ${orgId}`, error);
      throw error;
    }
  }

  async createRole(roleData: CreateRoleDto): Promise<GetRoleDto> {
    try {
      const role = await this.rbacRepository.createRole(roleData);
      this.logger.log(`Created role ${role.name}`);
      return role;
    } catch (error) {
      this.logger.error('Failed to create role', error);
      throw new BadRequestException(error instanceof Error ? error.message : 'Failed to create role');
    }
  }

  async updateRole(roleId: string, roleData: CreateRoleDto): Promise<GetRoleDto> {
    try {
      const role = await this.rbacRepository.updateRole(roleId, roleData);
      this.logger.log(`Updated role ${roleId}`);
      return role;
    } catch (error) {
      this.logger.error(`Failed to update role ${roleId}`, error);
      throw new BadRequestException(error instanceof Error ? error.message : 'Failed to update role');
    }
  }

  async upsertPermissions(permissions: string[]): Promise<void> {
    try {
      await this.rbacRepository.upsertPermissions(permissions);
      this.logger.log(`Upserted ${permissions.length} permissions`);
    } catch (error) {
      this.logger.error('Failed to upsert permissions', error);
      throw new BadRequestException(error instanceof Error ? error.message : 'Failed to upsert permissions');
    }
  }

  async getAllPermissions(): Promise<{ id: string; permission: string }[]> {
    try {
      return await this.rbacRepository.getAllPermissions();
    } catch (error) {
      this.logger.error('Failed to fetch all permissions', error);
      throw error;
    }
  }

  async assignPermissionToRole(roleId: string, permissionIds: string[]): Promise<void> {
    try {
      await this.rbacRepository.assignPermissionToRole(roleId, permissionIds);
      this.logger.log(`Assigned ${permissionIds.length} permissions to role ${roleId}`);
    } catch (error) {
      this.logger.error(`Failed to assign permissions to role ${roleId}`, error);
      throw error;
    }
  }

  async getRolePermissions(roleId: string): Promise<RolePermissionsDto> {
    try {
      return await this.rbacRepository.getRolePermissions(roleId);
    } catch (error) {
      this.logger.error(`Failed to fetch permissions for role ${roleId}`, error);
      throw error;
    }
  }

  async editAssignment(userId: string, orgId: string, roleId: string, branchId: string | undefined, grant: boolean): Promise<void> {
    try {
      await this.rbacRepository.editAssignment(userId, orgId, roleId, branchId, grant);
      this.logger.log(`${grant ? 'Granted' : 'Revoked'} role ${roleId} for user ${userId} in org ${orgId}`);
    } catch (error) {
      this.logger.error(`Failed to edit assignment for user ${userId} in org ${orgId}`, error);
      throw error;
    }
  }

  async updateBranchMembership(userId: string, orgId: string, branchId: string, status: number): Promise<void> {
    try {
      await this.rbacRepository.updateBranchMembership(userId, orgId, branchId, status);
      this.logger.log(`Updated branch membership for user ${userId} in branch ${branchId} to status ${status}`);
    } catch (error) {
      this.logger.error(`Failed to update branch membership for user ${userId} in branch ${branchId}`, error);
      throw error;
    }
  }

  async assignRolesToUser(userId: string, roleIds: string[], orgId: string, branchId?: string): Promise<void> {
    try {
      if (!orgId) throw new BadRequestException('Organisation context is required');
      await this.rbacRepository.assignRolesToUser(userId, roleIds, orgId, branchId);
      this.logger.log(`Assigned roles to user ${userId} in org ${orgId}`);
    } catch (error) {
      this.logger.error(`Failed to assign roles to user ${userId} in org ${orgId}`, error);
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(error instanceof Error ? error.message : 'Failed to assign roles to user');
    }
  }

  async getAllRoles(): Promise<GetRoleDto[]> {
    try {
      return await this.rbacRepository.getAllRoles();
    } catch (error) {
      this.logger.error('Failed to fetch all roles', error);
      throw error;
    }
  }

  async getBranchRoles(): Promise<GetRoleDto[]> {
    try {
      return await this.rbacRepository.getBranchRoles();
    } catch (error) {
      this.logger.error('Failed to fetch branch roles', error);
      throw error;
    }
  }

  async getUserPermissions(userId: string, orgId?: string): Promise<string[]> {
    try {
      const rows = await this.rbacRepository.getPermissionsByUserId(userId, orgId);
      return rows.map((row) => row.permission);
    } catch (error) {
      this.logger.error(`Failed to fetch permissions for user ${userId}`, error);
      throw error;
    }
  }

  async getUserRoles(userId: string, orgId?: string): Promise<GetRoleDto[]> {
    try {
      return await this.rbacRepository.getUserRoles(userId, orgId);
    } catch (error) {
      this.logger.error(`Failed to fetch roles for user ${userId}`, error);
      throw error;
    }
  }

  async userHasRole(userId: string, roleName: string, orgId?: string): Promise<boolean> {
    try {
      return await this.rbacRepository.userHasRole(userId, roleName, orgId);
    } catch (error) {
      this.logger.error(`Failed to check role ${roleName} for user ${userId}`, error);
      throw error;
    }
  }
}
