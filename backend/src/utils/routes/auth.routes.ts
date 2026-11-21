import { RequestMethod } from '@nestjs/common';
import { Service } from '../constants/service';
import { PermissionEnum } from '../constants/permissions';
import path from 'path';


export const LoginWithEmailPasswordAPI = {
  path: '/login',
  endpoint: [
    `${Service.AUTH_API_PREFIX}login`,
    `${Service.AUTH_API_PREFIX}v1/login`,
  ],
  method: RequestMethod.POST,
  permissions: [],
  service: Service.AUTH_SERVICE,
  sample: '/login',
}

export const RefreshTokenAPI = {
  path: '/refresh',
  endpoint: [
    `${Service.AUTH_API_PREFIX}refresh`,
    `${Service.AUTH_API_PREFIX}v1/refresh`,
  ],
  method: RequestMethod.POST,
  permissions: [],
  service: Service.AUTH_SERVICE,
  sample: '/1',
}

