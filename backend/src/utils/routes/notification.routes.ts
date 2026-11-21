import { RequestMethod } from '@nestjs/common';
import { Service } from '../constants/service';
import { PermissionEnum } from '../constants/permissions';
import path from 'path';


export const CreateEventNotificationFormatAPI = {
    path: '/create_format',
    endpoint: [
        `${Service.NOTIFICATION_API_PREFIX}create_format`,
        `${Service.NOTIFICATION_API_PREFIX}v1/create_format`,
    ],
    method: RequestMethod.POST,
    permissions: [PermissionEnum.CREATE_NOTIFICATION_FORMAT],
    service: Service.NOTIFICATION_SERVICE,
    sample: '/create_format',
}

export const GetAllNotificationFormatsAPI = {
    path: '/get_all_formats',
    endpoint: [
        `${Service.NOTIFICATION_API_PREFIX}get_all_formats`,
        `${Service.NOTIFICATION_API_PREFIX}v1/get_all_formats`,
    ],
    method: RequestMethod.GET,
    permissions: [PermissionEnum.GET_ALL_NOTIFICATION_FORMATS],
    service: Service.NOTIFICATION_SERVICE,
    sample: '/get_all_formats',
}

export const GetEventNotificationFormatAPI = {
    path: '/get_format/:id',
    endpoint: [
        `${Service.NOTIFICATION_API_PREFIX}get_format/:id`,
        `${Service.NOTIFICATION_API_PREFIX}v1/get_format/:id`,
    ],
    method: RequestMethod.GET,
    permissions: [PermissionEnum.GET_NOTIFICATION_FORMAT_BY_ID],
    service: Service.NOTIFICATION_SERVICE,
    sample: '/get_format',
}

export const UpdateEventNotificationFormatAPI = {
    path: '/update_format/:id',
    endpoint: [
        `${Service.NOTIFICATION_API_PREFIX}update_format/:id`,
        `${Service.NOTIFICATION_API_PREFIX}v1/update_format/:id`,
    ],
    method: RequestMethod.PUT,
    permissions: [PermissionEnum.UPDATE_NOTIFICATION_FORMAT],
    service: Service.NOTIFICATION_SERVICE,
    sample: '/update_format/1',
}

export const DeleteEventNotificationFormatAPI = {
    path: '/delete_format/:id',
    endpoint: [
        `${Service.NOTIFICATION_API_PREFIX}delete_format/:id`,
        `${Service.NOTIFICATION_API_PREFIX}v1/delete_format/:id`,
    ],
    method: RequestMethod.DELETE,
    permissions: [PermissionEnum.DELETE_NOTIFICATION_FORMAT],
    service: Service.NOTIFICATION_SERVICE,
    sample: '/delete_format/1',
}

export const UpdateFcmTokenAPI = {
    path: '/update_fcm_token',
    endpoint: [
        `${Service.NOTIFICATION_API_PREFIX}update_fcm_token`,
        `${Service.NOTIFICATION_API_PREFIX}v1/update_fcm_token`,
    ],
    method: RequestMethod.PUT,
    service: Service.NOTIFICATION_SERVICE,
    sample: '/update_fcm_token',
}

export const GetUserNotificationPreferencesAPI = {
    path: '/user_notification_preferences',
    endpoint: [
        `${Service.NOTIFICATION_API_PREFIX}user_notification_preferences`,
        `${Service.NOTIFICATION_API_PREFIX}v1/user_notification_preferences`,
    ],
    method: RequestMethod.GET,
    permissions: [PermissionEnum.GET_USER_NOTIFICATION_PREFERENCES],
    service: Service.NOTIFICATION_SERVICE,
    sample: '/user_notification_preferences',
}

export const CreateUserNotificationPreferenceAPI = {
    path: '/user_notification_preference',
    endpoint: [
        `${Service.NOTIFICATION_API_PREFIX}user_notification_preference`,
        `${Service.NOTIFICATION_API_PREFIX}v1/user_notification_preference`,
    ],
    method: RequestMethod.POST,
    permissions: [PermissionEnum.CREATE_USER_NOTIFICATION_PREFERENCE],
    service: Service.NOTIFICATION_SERVICE,
    sample: '/user_notification_preference',
}

export const UpdateUserNotificationPreferenceAPI = {
    path: '/user_notification_preference',
    endpoint: [
        `${Service.NOTIFICATION_API_PREFIX}user_notification_preference`,
        `${Service.NOTIFICATION_API_PREFIX}v1/user_notification_preference`,
    ],
    method: RequestMethod.PUT,
    permissions: [PermissionEnum.UPDATE_USER_NOTIFICATION_PREFERENCE],
    service: Service.NOTIFICATION_SERVICE,
    sample: '/user_notification_preference',
}