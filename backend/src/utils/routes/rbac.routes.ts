import { RequestMethod } from '@nestjs/common';
import { Service } from '../constants/service';
import { PermissionEnum } from '../constants/permissions';
import path from 'path';

export const CreateRoleAPI = {
  path: '/create',
  endpoint: [
    `${Service.RBAC_API_PREFIX}create`,
    `${Service.RBAC_API_PREFIX}v1/create`,
  ],
  method: RequestMethod.POST,
  argument: '',
  permissions: [PermissionEnum.CREATE_ROLE],
  service: Service.RBAC_SERVICE,
  sample: '/create',
};

export const UpdateRoleAPI = {
    path: '/update/:role_id',
    endpoint: [
        `${Service.RBAC_API_PREFIX}update/:role_id`,
        `${Service.RBAC_API_PREFIX}v1/update/:role_id`,
    ],
    method: RequestMethod.PUT,
    argument: '',
    permissions: [PermissionEnum.UPDATE_ROLE],
    service: Service.RBAC_SERVICE,
    sample: '/update/1',
}

export const GetAllRolesAPI = {
    path: '/roles',
    endpoint: [
        `${Service.RBAC_API_PREFIX}roles`,
        `${Service.RBAC_API_PREFIX}v1/roles`,
    ],
    method: RequestMethod.GET,
    argument: '',
    permissions: [PermissionEnum.GET_ALL_ROLES],
    service: Service.RBAC_SERVICE,
    sample: '/roles',
}

export const GetAllPermissionsAPI = {
    path: '/permissions',
    endpoint: [
        `${Service.RBAC_API_PREFIX}permissions`,
        `${Service.RBAC_API_PREFIX}v1/permissions`,
    ],
    method: RequestMethod.GET,
    argument: '',
    permissions: [PermissionEnum.GET_ALL_PERMISSIONS],
    service: Service.RBAC_SERVICE,
    sample: '/permissions',
}

export const AssignPermissionsToRoleAPI = {
    path: '/assign-permissions',
    endpoint: [
        `${Service.RBAC_API_PREFIX}assign-permissions`,
        `${Service.RBAC_API_PREFIX}v1/assign-permissions`,
    ],
    method: RequestMethod.POST,
    argument: '',
    permissions: [PermissionEnum.ASSIGN_PERMISSION_TO_ROLE],
    service: Service.RBAC_SERVICE,
    sample: '/assign-permissions',
}

export const GetRolePermissionsAPI = {
    path: '/role-permissions/:roleId',
    endpoint: [
        `${Service.RBAC_API_PREFIX}role-permissions/:roleId`,
        `${Service.RBAC_API_PREFIX}v1/role-permissions/:roleId`,
    ],
    method: RequestMethod.GET,
    argument: '',
    permissions: [PermissionEnum.GET_ROLE_PERMISSIONS],
    service: Service.RBAC_SERVICE,
    sample: '/role-permissions/1',
}

export const AssignRolesToUserAPI = {
    path: '/assign-roles/:userId',
    endpoint: [
        `${Service.RBAC_API_PREFIX}assign-roles/:userId`,
        `${Service.RBAC_API_PREFIX}v1/assign-roles/:userId`,
    ],
    method: RequestMethod.POST,
    argument: '',
    permissions: [PermissionEnum.ASSIGN_ROLE_TO_USER],
    service: Service.RBAC_SERVICE,
    sample: '/assign-roles/1',
}

export const GetUserRolesAPI = {
    path: '/user/:userId/roles',
    endpoint: [
        `${Service.RBAC_API_PREFIX}user/:userId/roles`,
        `${Service.RBAC_API_PREFIX}v1/user/:userId/roles`,
    ],
    method: RequestMethod.GET,
    argument: '',
    permissions: [PermissionEnum.GET_USER_ROLES],
    service: Service.RBAC_SERVICE,
    sample: '/user/1/roles',
};

export const GetOrgRolesAPI = {
  path: '/org_roles',
  endpoint: [
    `${Service.RBAC_API_PREFIX}org_roles`,
    `${Service.RBAC_API_PREFIX}v1/org_roles`,
  ],
  method: RequestMethod.GET,
  argument: [],
  permissions: [PermissionEnum.GET_ORG_ROLES],
  service: Service.RBAC_API_PREFIX,
  sample: '/org_roles',
}

export const GetUsersByOrgAndRoleAPI = {
    path: '/org/role/:roleId/users',
    endpoint: [
        `${Service.RBAC_API_PREFIX}org/role/:roleId/users`,
        `${Service.RBAC_API_PREFIX}v1/org/role/:roleId/users`,
    ],
    method: RequestMethod.GET,
    argument: '',
    permissions: [PermissionEnum.GET_USERS_BY_ORG_AND_ROLE],
    service: Service.RBAC_SERVICE,
    sample: '/org/role/2/users',
}
