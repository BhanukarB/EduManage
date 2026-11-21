import { Body, Controller, ForbiddenException, Get, Param, ParseUUIDPipe, Post, Put, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../common/guards/auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../utils/decorators/permission.decorator';
import {
  AssignPermissionsToRoleAPI,
  AssignRolesToUserAPI,
  CreateRoleAPI,
  GetAllPermissionsAPI,
  GetAllRolesAPI,
  GetBranchRolesAPI,
  GetRolePermissionsAPI,
  GetUserRolesAPI,
  UpdateRoleAPI,
} from '../../utils/routes/rbac.routes';
import { AssignPermissionsToRoleDto, AssignRolesDto, CreateRoleDto, GetRoleDto, RolePermissionsDto } from './dto/rbac.dto';
import { RbacService } from './rbac.service';

@ApiTags('rbac')
@ApiBearerAuth()
@UseGuards(AuthGuard, PermissionsGuard)
@Controller('rbac')
export class RbacController {
  constructor(private readonly rbacService: RbacService) {}

  @Post('roles')
  @UseGuards(AuthGuard, PermissionsGuard)
  @Permissions(...CreateRoleAPI.permissions)
  @ApiOperation({ summary: 'Create a shared role (super_admin only)' })
  @ApiResponse({ status: 201, type: GetRoleDto })
  createRole(@Body() data: CreateRoleDto): Promise<GetRoleDto> {
    return this.rbacService.createRole(data);
  }

  @Put('roles/:roleId')
  @UseGuards(AuthGuard, PermissionsGuard)
  @Permissions(...UpdateRoleAPI.permissions)
  @ApiOperation({ summary: 'Update a shared role (super_admin only)' })
  updateRole(@Param('roleId', ParseUUIDPipe) roleId: string, @Body() data: CreateRoleDto): Promise<GetRoleDto> {
    return this.rbacService.updateRole(roleId, data);
  }

  @Get('roles')
  @UseGuards(AuthGuard, PermissionsGuard)
  @Permissions(...GetAllRolesAPI.permissions)
  @ApiOperation({ summary: 'List shared roles' })
  getAllRoles(): Promise<GetRoleDto[]> {
    return this.rbacService.getAllRoles();
  }

  @Get(GetBranchRolesAPI.path)
  @UseGuards(AuthGuard, PermissionsGuard)
  @Permissions(...GetBranchRolesAPI.permissions)
  @ApiOperation({ summary: 'List branch-level roles' })
  getBranchRoles(): Promise<GetRoleDto[]> {
    return this.rbacService.getBranchRoles();
  }

  @Get('permissions')
  @UseGuards(AuthGuard, PermissionsGuard)
  @Permissions(...GetAllPermissionsAPI.permissions)
  @ApiOperation({ summary: 'List available permissions' })
  getAllPermissions(): Promise<{ id: string; permission: string }[]> {
    return this.rbacService.getAllPermissions();
  }

  @Post('roles/:roleId/permissions')
  @UseGuards(AuthGuard, PermissionsGuard)
  @Permissions(...AssignPermissionsToRoleAPI.permissions)
  @ApiOperation({ summary: 'Assign permissions to a shared role (super_admin only)' })
  assignPermissionsToRole(@Param('roleId', ParseUUIDPipe) roleId: string, @Body() data: AssignPermissionsToRoleDto): Promise<void> {
    return this.rbacService.assignPermissionToRole(roleId, data.permissionIds);
  }

  @Get('roles/:roleId/permissions')
  @UseGuards(AuthGuard, PermissionsGuard)
  @Permissions(...GetRolePermissionsAPI.permissions)
  @ApiOperation({ summary: 'List permissions assigned to a role' })
  getRolePermissions(@Param('roleId', ParseUUIDPipe) roleId: string): Promise<RolePermissionsDto> {
    return this.rbacService.getRolePermissions(roleId);
  }

  @Post('users/:userId/roles')
  @UseGuards(AuthGuard, PermissionsGuard)
  @Permissions(...AssignRolesToUserAPI.permissions)
  @ApiOperation({ summary: 'Assign shared roles to a user in the current organisation (org_admin only)' })
  assignRolesToUser(@Req() req: any, @Param('userId', ParseUUIDPipe) userId: string, @Body() data: AssignRolesDto) {
    return this.rbacService.assignRolesToUser(userId, data.roleIds, req.user.orgId);
  }

  @Post('organisations/:orgId/users/:userId/roles')
  @UseGuards(AuthGuard, PermissionsGuard)
  @Permissions(...AssignRolesToUserAPI.permissions)
  @ApiOperation({ summary: 'Assign roles to a user in a selected organisation (super_admin only)' })
  async assignRolesToUserInOrganisation(
    @Req() req: any,
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() data: AssignRolesDto,
  ): Promise<void> {
    if (!await this.rbacService.userHasRole(req.user.uid, 'super_admin')) {
      throw new ForbiddenException('Only a super_admin can assign roles across organisations');
    }
    return this.rbacService.assignRolesToUser(userId, data.roleIds, orgId);
  }

  @Get('users/:userId/roles')
  @UseGuards(AuthGuard, PermissionsGuard)
  @Permissions(...GetUserRolesAPI.permissions)
  @ApiOperation({ summary: 'List a user’s roles in the current organisation' })
  getUserRoles(@Req() req: any, @Param('userId', ParseUUIDPipe) userId: string): Promise<GetRoleDto[]> {
    return this.rbacService.getUserRoles(userId, req.user.orgId);
  }
}
