import { RequestMethod } from '@nestjs/common';
import { Service } from '../constants/service';
import { PermissionEnum } from '../constants/permissions';
import path from 'path';

export const CreateUserAPI = {
  path: '/create',
  endpoint: [
    `${Service.USER_API_PREFIX}create`,
    `${Service.USER_API_PREFIX}v1/create`,
  ],
  method: RequestMethod.POST,
  argument: '',
  permissions: [],
  service: Service.USER_SERVICE,
  sample: '/create',
};

export const GetUserDetailAPI = {
    path: '/details',
    endpoint: [
        `${Service.USER_API_PREFIX}details`,
        `${Service.USER_API_PREFIX}v1/details`,
    ],
    method: RequestMethod.GET,
    argument: '',
    permissions: [PermissionEnum.GET_LOGGED_IN_USER],
    service: Service.USER_SERVICE,
    sample: '/details',
}

export const GetLoggedInUserDetailsAPI = {
    path: '/me',
    endpoint: [
        `${Service.USER_API_PREFIX}me`,
        `${Service.USER_API_PREFIX}v1/me`,
    ],
    method: RequestMethod.GET,
    argument: '',
    permissions: [],
    service: Service.USER_SERVICE,
    sample: '/me',
}

export const UpdateOwnPhoneAPI = {
  path: '/me',
  endpoint: ['/users/me'],
  method: RequestMethod.PATCH,
  permissions: [PermissionEnum.UPDATE_OWN_PHONE],
  service: Service.USER_SERVICE,
};

export const GetUserByIdAPI = {
    path: '/get/:id',
    endpoint: [
        `${Service.USER_API_PREFIX}get/:id`,
        `${Service.USER_API_PREFIX}v1/get/:id`,
    ],
    method: RequestMethod.GET,
    argument: '',
    permissions: [PermissionEnum.GET_USER_BY_ID],
    service: Service.USER_SERVICE,
    sample: '/get/1',
}

export const UpdateUserAPI = {
    path: '/update',
    endpoint: [
        `${Service.USER_API_PREFIX}update`,
        `${Service.USER_API_PREFIX}v1/update`,
    ],
    method: RequestMethod.PUT,
    argument: '',
    permissions: [PermissionEnum.UPDATE_USER],
    service: Service.USER_SERVICE,
    sample: '/update',
}

export const DeleteUserAPI = {
    path: '/delete/:id',
    endpoint: [
        `${Service.USER_API_PREFIX}delete/:id`,
        `${Service.USER_API_PREFIX}v1/delete/:id`,
    ],
    method: RequestMethod.DELETE,
    argument: '',
    permissions: [PermissionEnum.DELETE_USER],
    service: Service.USER_SERVICE,
    sample: '/delete/1',
}

export const SendResetPssswordEmailAPI = {
    path: '/reset-password',
    endpoint: [
        `${Service.USER_API_PREFIX}reset-password`,
        `${Service.USER_API_PREFIX}v1/reset-password`,
    ],
    method: RequestMethod.POST,
    argument: '',
    permissions: [],
    service: Service.USER_SERVICE,
    sample: '/reset-password',
}

export const UpdatePasswordWithTokenAPI = {
    path: '/update-password/:token',
    endpoint: [
        `${Service.USER_API_PREFIX}update-password/:token`,
        `${Service.USER_API_PREFIX}v1/update-password/:token`,
    ],
    method: RequestMethod.POST,
    argument: 'token',
    permissions: [],
    service: Service.USER_SERVICE,
    sample: '/update-password/ecba8b75-64f2-4e06-a6c5-24f5a716cc9d',
}


export const UpdatePasswordAPI = {
    path: '/update-password',
    endpoint: [
        `${Service.USER_API_PREFIX}update-password`,
        `${Service.USER_API_PREFIX}v1/update-password`,
    ],
    method: RequestMethod.POST,
    argument: '',
    permissions: [],
    service: Service.USER_SERVICE,
    sample: '/update-password',
}

export const UpdateUserAcknowledgementAPI = {
    path: '/update-acknowledgement',
    endpoint: [
        `${Service.USER_API_PREFIX}update-acknowledgement`,
        `${Service.USER_API_PREFIX}v1/update-acknowledgement`,
    ],
    method: RequestMethod.PUT,
    argument: '',
    permissions: [],
    service: Service.USER_SERVICE,
    sample: '/update-acknowledgement',
}


export const CreateApiKeyForUserAPI = {
  path: '/create/api-key/:user_id',
  endpoint: [
    `${Service.USER_API_PREFIX}create/api-key/:user_id`,
    `${Service.USER_API_PREFIX}v1/create/api-key/:user_id`,
  ],
  method: RequestMethod.POST,
  permissions: [PermissionEnum.CREATE_API_KEY],
  service: Service.USER_API_PREFIX,
  sample: '/create/api-key/1',
}
