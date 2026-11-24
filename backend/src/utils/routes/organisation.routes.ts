import { RequestMethod } from '@nestjs/common';
import { Service } from '../constants/service';
import { PermissionEnum } from '../constants/permissions';

export const CreateOrganisationAPI = {
  path: '/create',
  endpoint: [
    `${Service.ORGANISATION_API_PREFIX}create`,
    `${Service.ORGANISATION_API_PREFIX}v1/create`,
  ],
  method: RequestMethod.POST,
  argument: '',
  permissions: [PermissionEnum.CREATE_ORGANISATION],
  service: Service.ORGANISATION_SERVICE,
  sample: '/create',
};

export const GetOrganisationByIdAPI = {
    path: '/get/:id',
    endpoint: [
      `${Service.ORGANISATION_API_PREFIX}get/:id`,
      `${Service.ORGANISATION_API_PREFIX}v1/get/:id`,
    ],
    method: RequestMethod.GET,
    argument: 'id',
    permissions: [PermissionEnum.GET_ORGANISATION_BY_ID],
    service: Service.ORGANISATION_SERVICE,
    sample: '/get/1',
}

export const GetOrganisationAdminsAPI = {
  path: '/:orgId/org-admins',
  endpoint: [
    `${Service.ORGANISATION_API_PREFIX}:orgId/org-admins`,
    `${Service.ORGANISATION_API_PREFIX}v1/:orgId/org-admins`,
  ],
  method: RequestMethod.GET,
  argument: 'orgId',
  permissions: [PermissionEnum.GET_ORGANISATION_BY_ID],
  service: Service.ORGANISATION_SERVICE,
  sample: '/<orgId>/org-admins',
};

export const UpdateOrganisationAPI = {
    path: '/update/:id',
    endpoint: [
      `${Service.ORGANISATION_API_PREFIX}update/:id`,
      `${Service.ORGANISATION_API_PREFIX}v1/update/:id`,
    ],
    method: RequestMethod.PUT,
    argument: 'id',
    permissions: [PermissionEnum.UPDATE_ORGANISATION],  
    service: Service.ORGANISATION_SERVICE,
    sample: '/update/1',
}

export const CreateBranchAPI = {
  path: '/:orgId/branches/create',
  endpoint: [
    `${Service.ORGANISATION_API_PREFIX}:orgId/branches/create`,
    `${Service.ORGANISATION_API_PREFIX}v1/:orgId/branches/create`,
  ],
  method: RequestMethod.POST,
  argument: 'orgId',
  permissions: [PermissionEnum.CREATE_BRANCH],
  service: Service.ORGANISATION_SERVICE,
  sample: '/<orgId>/branches/create',
};

export const UpdateBranchAPI = {
  path: '/branches/update/:id',
  endpoint: [
    `${Service.ORGANISATION_API_PREFIX}branches/update/:id`,
    `${Service.ORGANISATION_API_PREFIX}v1/branches/update/:id`,
  ],
  method: RequestMethod.PUT,
  argument: 'id',
  permissions: [PermissionEnum.UPDATE_BRANCH],
  service: Service.ORGANISATION_SERVICE,
  sample: '/branches/update/<id>',
};

export const GetBranchByIdAPI = {
  path: '/branches/get/:id',
  endpoint: [
    `${Service.ORGANISATION_API_PREFIX}branches/get/:id`,
    `${Service.ORGANISATION_API_PREFIX}v1/branches/get/:id`,
  ],
  method: RequestMethod.GET,
  argument: 'id',
  permissions: [PermissionEnum.GET_BRANCH_BY_ID],
  service: Service.ORGANISATION_SERVICE,
  sample: '/branches/get/<id>',
};

export const GetBranchListByOrgIdAPI = {
  path: '/:orgId/branches',
  endpoint: [
    `${Service.ORGANISATION_API_PREFIX}:orgId/branches`,
    `${Service.ORGANISATION_API_PREFIX}v1/:orgId/branches`,
  ],
  method: RequestMethod.GET,
  argument: 'orgId',
  permissions: [PermissionEnum.GET_BRANCH_LIST_BY_ORG_ID],
  service: Service.ORGANISATION_SERVICE,
  sample: '/<orgId>/branches',
};

export const GetOrganisationStaffAPI = {
  path: '/:orgId/staff',
  endpoint: [
    `${Service.ORGANISATION_API_PREFIX}:orgId/staff`,
    `${Service.ORGANISATION_API_PREFIX}v1/:orgId/staff`,
  ],
  method: RequestMethod.GET,
  argument: 'orgId',
  permissions: [PermissionEnum.GET_ORG_STAFF_LIST],
  service: Service.ORGANISATION_SERVICE,
  sample: '/<orgId>/staff',
};

export const UpdateOrganisationStaffAPI = {
  path: '/staff/update',
  endpoint: [
    `${Service.ORGANISATION_API_PREFIX}staff/update`,
    `${Service.ORGANISATION_API_PREFIX}v1/staff/update`,
  ],
  method: RequestMethod.PUT,
  argument: '',
  permissions: [PermissionEnum.UPDATE_ORG_STAFF],
  service: Service.ORGANISATION_SERVICE,
  sample: '/staff/update',
};

export const AddOrganisationStaffAPI = {
  path: '/staff/add',
  endpoint: [
    `${Service.ORGANISATION_API_PREFIX}staff/add`,
    `${Service.ORGANISATION_API_PREFIX}v1/staff/add`,
  ],
  method: RequestMethod.POST,
  argument: '',
  permissions: [PermissionEnum.ADD_ORG_STAFF],
  service: Service.ORGANISATION_SERVICE,
  sample: '/staff/add',
};

export const CreateClassAPI = {
  path: '/:orgId/classes/create',
  endpoint: [
    `${Service.ORGANISATION_API_PREFIX}:orgId/classes/create`,
    `${Service.ORGANISATION_API_PREFIX}v1/:orgId/classes/create`,
  ],
  method: RequestMethod.POST,
  argument: 'orgId',
  permissions: [PermissionEnum.CREATE_CLASS],
  service: Service.ORGANISATION_SERVICE,
  sample: '/<orgId>/classes/create',
};

export const CreateBranchClassAPI = {
  path: '/:orgId/:branchId/classes/create',
  endpoint: [`${Service.ORGANISATION_API_PREFIX}:orgId/:branchId/classes/create`],
  method: RequestMethod.POST,
  argument: ['orgId', 'branchId'],
  permissions: [PermissionEnum.CREATE_CLASS],
  service: Service.ORGANISATION_SERVICE,
  sample: '/<orgId>/<branchId>/classes/create',
};

export const UpdateBranchClassAPI = {
  path: '/:orgId/:branchId/classes/update/:id',
  endpoint: [`${Service.ORGANISATION_API_PREFIX}:orgId/:branchId/classes/update/:id`],
  method: RequestMethod.PUT,
  argument: ['orgId', 'branchId', 'id'],
  permissions: [PermissionEnum.UPDATE_CLASS],
  service: Service.ORGANISATION_SERVICE,
  sample: '/<orgId>/<branchId>/classes/update/<id>',
};

export const UpdateClassAPI = {
  path: '/classes/update/:id',
  endpoint: [
    `${Service.ORGANISATION_API_PREFIX}classes/update/:id`,
    `${Service.ORGANISATION_API_PREFIX}v1/classes/update/:id`,
  ],
  method: RequestMethod.PUT,
  argument: 'id',
  permissions: [PermissionEnum.UPDATE_CLASS],
  service: Service.ORGANISATION_SERVICE,
  sample: '/classes/update/<id>',
};

export const GetClassListByOrgIdAPI = {
  path: '/:orgId/classes',
  endpoint: [
    `${Service.ORGANISATION_API_PREFIX}:orgId/classes`,
    `${Service.ORGANISATION_API_PREFIX}v1/:orgId/classes`,
  ],
  method: RequestMethod.GET,
  argument: 'orgId',
  permissions: [PermissionEnum.GET_CLASS_LIST_BY_ORG_ID],
  service: Service.ORGANISATION_SERVICE,
  sample: '/<orgId>/classes',
};

export const GetClassListByBranchAPI = {
  path: '/:orgId/:branchId/classes',
  endpoint: [
    `${Service.ORGANISATION_API_PREFIX}:orgId/:branchId/classes`,
    `${Service.ORGANISATION_API_PREFIX}v1/:orgId/:branchId/classes`,
  ],
  method: RequestMethod.GET,
  argument: ['orgId', 'branchId'],
  permissions: [PermissionEnum.GET_CLASS_LIST_BY_BRANCH],
  service: Service.ORGANISATION_SERVICE,
  sample: '/<orgId>/<branchId>/classes',
};

export const CreateClassSectionAPI = {
  path: '/:orgId/:branchId/:academicSessionId/class-sections/create',
  endpoint: [
    `${Service.ORGANISATION_API_PREFIX}:orgId/:branchId/:academicSessionId/class-sections/create`,
    `${Service.ORGANISATION_API_PREFIX}v1/:orgId/:branchId/:academicSessionId/class-sections/create`,
  ],
  method: RequestMethod.POST,
  argument: ['orgId', 'branchId', 'academicSessionId'],
  permissions: [PermissionEnum.CREATE_CLASS_SECTION],
  service: Service.ORGANISATION_SERVICE,
  sample: '/<orgId>/<branchId>/<academicSessionId>/class-sections/create',
};

export const UpdateClassSectionAPI = {
  path: '/:orgId/:branchId/:academicSessionId/class-sections/update/:id',
  endpoint: [
    `${Service.ORGANISATION_API_PREFIX}:orgId/:branchId/:academicSessionId/class-sections/update/:id`,
    `${Service.ORGANISATION_API_PREFIX}v1/:orgId/:branchId/:academicSessionId/class-sections/update/:id`,
  ],
  method: RequestMethod.PUT,
  argument: ['orgId', 'branchId', 'academicSessionId', 'id'],
  permissions: [PermissionEnum.UPDATE_CLASS_SECTION],
  service: Service.ORGANISATION_SERVICE,
  sample: '/<orgId>/<branchId>/<academicSessionId>/class-sections/update/<id>',
};

export const GetClassSectionListAPI = {
  path: '/:orgId/:branchId/:academicSessionId/class-sections',
  endpoint: [
    `${Service.ORGANISATION_API_PREFIX}:orgId/:branchId/:academicSessionId/class-sections`,
    `${Service.ORGANISATION_API_PREFIX}v1/:orgId/:branchId/:academicSessionId/class-sections`,
  ],
  method: RequestMethod.GET,
  argument: ['orgId', 'branchId', 'academicSessionId'],
  permissions: [PermissionEnum.GET_CLASS_SECTION_LIST],
  service: Service.ORGANISATION_SERVICE,
  sample: '/<orgId>/<branchId>/<academicSessionId>/class-sections',
};

export const CreateClassBatchAPI = {
  path: '/:orgId/:branchId/:academicSessionId/class-batches/create',
  endpoint: [
    `${Service.ORGANISATION_API_PREFIX}:orgId/:branchId/:academicSessionId/class-batches/create`,
    `${Service.ORGANISATION_API_PREFIX}v1/:orgId/:branchId/:academicSessionId/class-batches/create`,
  ],
  method: RequestMethod.POST,
  argument: ['orgId', 'branchId', 'academicSessionId'],
  permissions: [PermissionEnum.CREATE_CLASS_BATCH],
  service: Service.ORGANISATION_SERVICE,
  sample: '/<orgId>/<branchId>/<academicSessionId>/class-batches/create',
};

export const UpdateClassBatchAPI = {
  path: '/:orgId/:branchId/:academicSessionId/class-batches/update/:id',
  endpoint: [
    `${Service.ORGANISATION_API_PREFIX}:orgId/:branchId/:academicSessionId/class-batches/update/:id`,
    `${Service.ORGANISATION_API_PREFIX}v1/:orgId/:branchId/:academicSessionId/class-batches/update/:id`,
  ],
  method: RequestMethod.PUT,
  argument: ['orgId', 'branchId', 'academicSessionId', 'id'],
  permissions: [PermissionEnum.UPDATE_CLASS_BATCH],
  service: Service.ORGANISATION_SERVICE,
  sample: '/<orgId>/<branchId>/<academicSessionId>/class-batches/update/<id>',
};

export const GetClassBatchListAPI = {
  path: '/:orgId/:branchId/:academicSessionId/class-batches',
  endpoint: [
    `${Service.ORGANISATION_API_PREFIX}:orgId/:branchId/:academicSessionId/class-batches`,
    `${Service.ORGANISATION_API_PREFIX}v1/:orgId/:branchId/:academicSessionId/class-batches`,
  ],
  method: RequestMethod.GET,
  argument: ['orgId', 'branchId', 'academicSessionId'],
  permissions: [PermissionEnum.GET_CLASS_BATCH_LIST],
  service: Service.ORGANISATION_SERVICE,
  sample: '/<orgId>/<branchId>/<academicSessionId>/class-batches',
};

export const CreateOrgAcademicSessionAPI = {
  path: '/:orgId/academic-sessions/create',
  endpoint: [
    `${Service.ORGANISATION_API_PREFIX}:orgId/academic-sessions/create`,
    `${Service.ORGANISATION_API_PREFIX}v1/:orgId/academic-sessions/create`,
  ],
  method: RequestMethod.POST,
  argument: 'orgId',
  permissions: [PermissionEnum.CREATE_ORG_ACADEMIC_SESSION],
  service: Service.ORGANISATION_SERVICE,
  sample: '/<orgId>/academic-sessions/create',
};

export const UpdateOrgAcademicSessionAPI = {
  path: '/:orgId/academic-sessions/update/:id',
  endpoint: [
    `${Service.ORGANISATION_API_PREFIX}:orgId/academic-sessions/update/:id`,
    `${Service.ORGANISATION_API_PREFIX}v1/:orgId/academic-sessions/update/:id`,
  ],
  method: RequestMethod.PUT,
  argument: ['orgId', 'id'],
  permissions: [PermissionEnum.UPDATE_ORG_ACADEMIC_SESSION],
  service: Service.ORGANISATION_SERVICE,
  sample: '/<orgId>/academic-sessions/update/<id>',
};

export const GetOrgAcademicSessionListAPI = {
  path: '/:orgId/academic-sessions',
  endpoint: [
    `${Service.ORGANISATION_API_PREFIX}:orgId/academic-sessions`,
    `${Service.ORGANISATION_API_PREFIX}v1/:orgId/academic-sessions`,
  ],
  method: RequestMethod.GET,
  argument: 'orgId',
  permissions: [PermissionEnum.GET_ORG_ACADEMIC_SESSION_LIST],
  service: Service.ORGANISATION_SERVICE,
  sample: '/<orgId>/academic-sessions',
};

export const GetOrgAcademicSessionByIdAPI = {
  path: '/:orgId/academic-sessions/:id',
  endpoint: [
    `${Service.ORGANISATION_API_PREFIX}:orgId/academic-sessions/:id`,
    `${Service.ORGANISATION_API_PREFIX}v1/:orgId/academic-sessions/:id`,
  ],
  method: RequestMethod.GET,
  argument: ['orgId', 'id'],
  permissions: [PermissionEnum.GET_ORG_ACADEMIC_SESSION_BY_ID],
  service: Service.ORGANISATION_SERVICE,
  sample: '/<orgId>/academic-sessions/<id>',
};

export const CreateSubjectAPI = {
  path: '/:orgId/subjects/create',
  endpoint: [
    `${Service.ORGANISATION_API_PREFIX}:orgId/subjects/create`,
    `${Service.ORGANISATION_API_PREFIX}v1/:orgId/subjects/create`,
  ],
  method: RequestMethod.POST,
  argument: 'orgId',
  permissions: [PermissionEnum.CREATE_SUBJECT],
  service: Service.ORGANISATION_SERVICE,
  sample: '/<orgId>/subjects/create',
};

export const UpdateSubjectAPI = {
  path: '/:orgId/subjects/update/:id',
  endpoint: [
    `${Service.ORGANISATION_API_PREFIX}:orgId/subjects/update/:id`,
    `${Service.ORGANISATION_API_PREFIX}v1/:orgId/subjects/update/:id`,
  ],
  method: RequestMethod.PUT,
  argument: ['orgId', 'id'],
  permissions: [PermissionEnum.UPDATE_SUBJECT],
  service: Service.ORGANISATION_SERVICE,
  sample: '/<orgId>/subjects/update/<id>',
};

export const GetSubjectListByOrgIdAPI = {
  path: '/:orgId/subjects',
  endpoint: [
    `${Service.ORGANISATION_API_PREFIX}:orgId/subjects`,
    `${Service.ORGANISATION_API_PREFIX}v1/:orgId/subjects`,
  ],
  method: RequestMethod.GET,
  argument: 'orgId',
  permissions: [PermissionEnum.GET_SUBJECT_LIST_BY_ORG_ID],
  service: Service.ORGANISATION_SERVICE,
  sample: '/<orgId>/subjects',
};

export const GetSubjectByIdAPI = {
  path: '/:orgId/subjects/:id',
  endpoint: [
    `${Service.ORGANISATION_API_PREFIX}:orgId/subjects/:id`,
    `${Service.ORGANISATION_API_PREFIX}v1/:orgId/subjects/:id`,
  ],
  method: RequestMethod.GET,
  argument: ['orgId', 'id'],
  permissions: [PermissionEnum.GET_SUBJECT_BY_ID],
  service: Service.ORGANISATION_SERVICE,
  sample: '/<orgId>/subjects/<id>',
};

export const CreateClassSubjectMappingAPI = {
  path: '/:orgId/:academicSessionId/class-subjects/create',
  endpoint: [
    `${Service.ORGANISATION_API_PREFIX}:orgId/:academicSessionId/class-subjects/create`,
    `${Service.ORGANISATION_API_PREFIX}v1/:orgId/:academicSessionId/class-subjects/create`,
  ],
  method: RequestMethod.POST,
  argument: ['orgId', 'academicSessionId'],
  permissions: [PermissionEnum.CREATE_CLASS_SUBJECT_MAPPING],
  service: Service.ORGANISATION_SERVICE,
  sample: '/<orgId>/<academicSessionId>/class-subjects/create',
};

export const UpdateClassSubjectMappingAPI = {
  path: '/:orgId/:academicSessionId/class-subjects/update/:id',
  endpoint: [
    `${Service.ORGANISATION_API_PREFIX}:orgId/:academicSessionId/class-subjects/update/:id`,
    `${Service.ORGANISATION_API_PREFIX}v1/:orgId/:academicSessionId/class-subjects/update/:id`,
  ],
  method: RequestMethod.PUT,
  argument: ['orgId', 'academicSessionId', 'id'],
  permissions: [PermissionEnum.UPDATE_CLASS_SUBJECT_MAPPING],
  service: Service.ORGANISATION_SERVICE,
  sample: '/<orgId>/<academicSessionId>/class-subjects/update/<id>',
};

export const CreateSectionSubjectMappingAPI = {
  path: '/:orgId/:branchId/:academicSessionId/section-subjects/create',
  endpoint: [
    `${Service.ORGANISATION_API_PREFIX}:orgId/:branchId/:academicSessionId/section-subjects/create`,
    `${Service.ORGANISATION_API_PREFIX}v1/:orgId/:branchId/:academicSessionId/section-subjects/create`,
  ],
  method: RequestMethod.POST,
  argument: ['orgId', 'branchId', 'academicSessionId'],
  permissions: [PermissionEnum.CREATE_SECTION_SUBJECT_MAPPING],
  service: Service.ORGANISATION_SERVICE,
  sample: '/<orgId>/<branchId>/<academicSessionId>/section-subjects/create',
};

export const UpdateSectionSubjectMappingAPI = {
  path: '/:orgId/:branchId/:academicSessionId/section-subjects/update/:id',
  endpoint: [
    `${Service.ORGANISATION_API_PREFIX}:orgId/:branchId/:academicSessionId/section-subjects/update/:id`,
    `${Service.ORGANISATION_API_PREFIX}v1/:orgId/:branchId/:academicSessionId/section-subjects/update/:id`,
  ],
  method: RequestMethod.PUT,
  argument: ['orgId', 'branchId', 'academicSessionId', 'id'],
  permissions: [PermissionEnum.UPDATE_SECTION_SUBJECT_MAPPING],
  service: Service.ORGANISATION_SERVICE,
  sample: '/<orgId>/<branchId>/<academicSessionId>/section-subjects/update/<id>',
};

export const CreateBatchSubjectMappingAPI = {
  path: '/:orgId/:branchId/:academicSessionId/batch-subjects/create',
  endpoint: [
    `${Service.ORGANISATION_API_PREFIX}:orgId/:branchId/:academicSessionId/batch-subjects/create`,
    `${Service.ORGANISATION_API_PREFIX}v1/:orgId/:branchId/:academicSessionId/batch-subjects/create`,
  ],
  method: RequestMethod.POST,
  argument: ['orgId', 'branchId', 'academicSessionId'],
  permissions: [PermissionEnum.CREATE_BATCH_SUBJECT_MAPPING],
  service: Service.ORGANISATION_SERVICE,
  sample: '/<orgId>/<branchId>/<academicSessionId>/batch-subjects/create',
};

export const UpdateBatchSubjectMappingAPI = {
  path: '/:orgId/:branchId/:academicSessionId/batch-subjects/update/:id',
  endpoint: [
    `${Service.ORGANISATION_API_PREFIX}:orgId/:branchId/:academicSessionId/batch-subjects/update/:id`,
    `${Service.ORGANISATION_API_PREFIX}v1/:orgId/:branchId/:academicSessionId/batch-subjects/update/:id`,
  ],
  method: RequestMethod.PUT,
  argument: ['orgId', 'branchId', 'academicSessionId', 'id'],
  permissions: [PermissionEnum.UPDATE_BATCH_SUBJECT_MAPPING],
  service: Service.ORGANISATION_SERVICE,
  sample: '/<orgId>/<branchId>/<academicSessionId>/batch-subjects/update/<id>',
};

export const AddStudentToOrgAPI = {
  path: '/:orgId/students/add',
  endpoint: [
    `${Service.ORGANISATION_API_PREFIX}:orgId/students/add`,
    `${Service.ORGANISATION_API_PREFIX}v1/:orgId/students/add`,
  ],
  method: RequestMethod.POST,
  argument: 'orgId',
  permissions: [PermissionEnum.ADD_STUDENT_TO_ORG],
  service: Service.ORGANISATION_SERVICE,
  sample: '/<orgId>/students/add',
};



const listPath = '/:orgId/branches/:branchId/:groupType/:groupId/students';
export const GetStudentListAPI = {
  path: listPath,
  endpoint: [`${Service.ORGANISATION_API_PREFIX}${listPath.slice(1)}`, `${Service.ORGANISATION_API_PREFIX}v1${listPath}`],
  method: RequestMethod.GET,
  argument: ['orgId', 'branchId', 'groupType', 'groupId'],
  permissions: [PermissionEnum.VIEW_STUDENT_LIST],
  service: Service.ORGANISATION_SERVICE,
  sample: '/<orgId>/branches/<branchId>/sections/<groupId>/students',
};
