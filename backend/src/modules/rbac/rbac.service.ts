import { BadRequestException, Injectable } from '@nestjs/common';
import { Assignment } from './access-context';
import { RbacRepository } from './rbac.repository';
import { CreateRoleDto, GetRoleDto, RolePermissionsDto } from './dto/rbac.dto';

@Injectable()
export class RbacService {
  constructor(private readonly rbacRepository: RbacRepository) {}

  activeAssignments(userId: string): Promise<Assignment[]> {
    return this.rbacRepository.activeAssignments(userId);
  }

  branchBelongsToOrg(branchId: string, orgId: string): Promise<boolean> {
    return this.rbacRepository.branchBelongsToOrg(branchId, orgId);
  }

  async createRole(roleData: CreateRoleDto): Promise<GetRoleDto> {
    try { return await this.rbacRepository.createRole(roleData); }
    catch (error) { throw new BadRequestException(error.message); }
  }

  async updateRole(roleId: string, roleData: CreateRoleDto): Promise<GetRoleDto> {
    try { return await this.rbacRepository.updateRole(roleId, roleData); }
    catch (error) { throw new BadRequestException(error.message); }
  }

  async upsertPermissions(permissions: string[]): Promise<void> {
    try { await this.rbacRepository.upsertPermissions(permissions); }
    catch (error) { throw new BadRequestException(error.message); }
  }

  async getAllPermissions(): Promise<{ id: string; permission: string }[]> {
    return this.rbacRepository.getAllPermissions();
  }

  async assignPermissionToRole(roleId: string, permissionIds: string[]): Promise<void> {
    return this.rbacRepository.assignPermissionToRole(roleId, permissionIds);
  }

  async getRolePermissions(roleId: string): Promise<RolePermissionsDto> {
    return this.rbacRepository.getRolePermissions(roleId);
  }

  editAssignment(userId: string, orgId: string, roleId: string, branchId: string | undefined, grant: boolean): Promise<void> {
    return this.rbacRepository.editAssignment(userId, orgId, roleId, branchId, grant);
  }

  updateBranchMembership(userId: string, orgId: string, branchId: string, status: number): Promise<void> {
    return this.rbacRepository.updateBranchMembership(userId, orgId, branchId, status);
  }

  async assignRolesToUser(userId: string, roleIds: string[], orgId: string, branchId?: string): Promise<void> {
    if (!orgId) throw new BadRequestException('Organisation context is required');
    try { await this.rbacRepository.assignRolesToUser(userId, roleIds, orgId, branchId); }
    catch (error) { throw new BadRequestException(error.message); }
  }

  async getAllRoles(): Promise<GetRoleDto[]> {
    return this.rbacRepository.getAllRoles();
  }

  async getBranchRoles(): Promise<GetRoleDto[]> {
    return this.rbacRepository.getBranchRoles();
  }

  async getUserPermissions(userId: string, orgId?: string): Promise<string[]> {
    const rows = await this.rbacRepository.getPermissionsByUserId(userId, orgId);
    return rows.map((row) => row.permission);
  }

  async getUserRoles(userId: string, orgId?: string): Promise<GetRoleDto[]> {
    return this.rbacRepository.getUserRoles(userId, orgId);
  }

  async userHasRole(userId: string, roleName: string, orgId?: string): Promise<boolean> {
    return this.rbacRepository.userHasRole(userId, roleName, orgId);
  }
}
