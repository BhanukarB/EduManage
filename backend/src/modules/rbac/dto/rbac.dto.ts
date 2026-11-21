import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ description: 'Shared role name', example: 'teacher' })
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class GetRoleDto {
  @ApiProperty({ description: 'Role UUID' })
  @IsUUID()
  id: string;

  @ApiProperty({ description: 'Role name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Number of permissions assigned to the role', required: false })
  permission_count?: number;
}

export class AssignRolesDto {
  @ApiProperty({ description: 'Role UUIDs to assign', example: ['e840d2f2-6ca9-4f8a-94b8-50b614c09331'], type: [String] })
  @IsArray()
  @IsUUID('all', { each: true })
  roleIds: string[];
}

export class AssignPermissionsToRoleDto {
  @ApiProperty({ description: 'Permission UUIDs to attach to the role', type: [String] })
  @IsArray()
  @IsUUID('all', { each: true })
  permissionIds: string[];
}

export class RolePermissionsDto {
  @ApiProperty({ description: 'Role UUID' })
  @IsUUID()
  roleId: string;

  @ApiProperty({ description: 'Role name' })
  @IsString()
  role: string;

  @ApiProperty({ description: 'Permissions', type: [Object] })
  permissions: { id: string; permission: string }[];
}
