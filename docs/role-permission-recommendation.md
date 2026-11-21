# Recommended API permissions by role

This is a proposed starting point for the current permission catalog in `backend/src/utils/constants/permissions.ts`. Each role is assigned to a specific organization, so permissions should operate within that organization. This is a recommendation, not an assignment to the database. Review it as APIs and organization rules are added.

## Legend

- **Yes**: recommend granting the permission.
- **—**: leave unassigned for now.
- **Conditional**: grant only after the API enforces the stated scope.

| Permission | org_admin | principal | teacher | guardian | student |
|---|:---:|:---:|:---:|:---:|:---:|
| `get_user_by_id` | Yes | Yes¹ | — | Conditional² | — |
| `get_logged_in_user` | Yes | Yes | Yes | Yes | Yes |
| `update_user` | Yes | Yes¹ | — | — | — |
| `delete_user` | Yes | — | — | — | — |
| `create_api_key` | — | — | — | — | — |
| `create_role` | — | — | — | — | — |
| `get_all_roles` | Yes | Yes | — | — | — |
| `update_role` | — | — | — | — | — |
| `assign_role_to_user` | Yes | — | — | — | — |
| `assign_permission_to_role` | — | — | — | — | — |
| `get_role_permissions` | Yes | Yes | — | — | — |
| `get_all_permissions` | Yes | Yes | — | — | — |
| `get_user_roles` | Yes | Yes¹ | — | — | — |
| `get_org_roles` | Yes | Yes | — | — | — |
| `get_users_by_org_and_role` | Yes | Yes¹ | — | — | — |
| `create_organisation` | — | — | — | — | — |
| `get_organisation_by_id` | Yes | Yes | Conditional³ | Conditional³ | Conditional³ |
| `update_organisation` | Yes | — | — | — | — |
| `create_branch` | Yes | — | — | — | — |
| `update_branch` | Yes | — | — | — | — |
| `get_branch_by_id` | Yes | Yes | Conditional³ | Conditional³ | Conditional³ |
| `get_branch_list_by_org_id` | Yes | Yes | Conditional³ | Conditional³ | Conditional³ |
| `create_class` | Yes | Yes | — | — | — |
| `update_class` | Yes | Yes | — | — | — |
| `get_class_list_by_org_id` | Yes | Yes | Yes | Conditional³ | Conditional³ |
| `create_class_section` | Yes | Yes | — | — | — |
| `update_class_section` | Yes | Yes | — | — | — |
| `get_class_section_list` | Yes | Yes | Yes | Conditional³ | Conditional³ |
| `create_class_batch` | Yes | Yes | — | — | — |
| `update_class_batch` | Yes | Yes | — | — | — |
| `get_class_batch_list` | Yes | Yes | Yes | Conditional³ | Conditional³ |
| `create_org_academic_session` | Yes | Yes | — | — | — |
| `update_org_academic_session` | Yes | Yes | — | — | — |
| `get_org_academic_session_list` | Yes | Yes | Yes | Conditional³ | Conditional³ |
| `get_org_academic_session_by_id` | Yes | Yes | Yes | Conditional³ | Conditional³ |
| `create_subject` | Yes | Yes | — | — | — |
| `update_subject` | Yes | Yes | — | — | — |
| `get_subject_list_by_org_id` | Yes | Yes | Yes | Conditional³ | Conditional³ |
| `get_subject_by_id` | Yes | Yes | Yes | Conditional³ | Conditional³ |
| `create_class_subject_mapping` | Yes | Yes | — | — | — |
| `update_class_subject_mapping` | Yes | Yes | — | — | — |
| `create_section_subject_mapping` | Yes | Yes | — | — | — |
| `update_section_subject_mapping` | Yes | Yes | — | — | — |
| `create_batch_subject_mapping` | Yes | Yes | — | — | — |
| `update_batch_subject_mapping` | Yes | Yes | — | — | — |
| `add_student_to_org` | Yes | Yes | — | — | — |
| `get_all_notification_formats` | Yes | Yes | — | — | — |
| `create_notification_format` | Yes | — | — | — | — |
| `get_notification_format_by_id` | Yes | Yes | — | — | — |
| `update_notification_format` | Yes | — | — | — | — |
| `delete_notification_format` | Yes | — | — | — | — |
| `get_user_notification_preferences` | Yes | Yes | Yes | Yes | Yes |
| `create_user_notification_preference` | Yes | Yes | Yes | Yes | Yes |
| `update_user_notification_preference` | Yes | Yes | Yes | Yes | Yes |

## Scope and implementation notes

1. **Principal user access**: because the principal's role assignment is organization-scoped, these user and role lookup permissions are recommended within that organization. The APIs must honor the role assignment's `org_id`; a principal should not manage org_admins or super_admins.
2. **Guardian user access**: `get_user_by_id` should be granted only after the API verifies a guardian-to-student relationship and limits returned fields. Organization membership alone does not authorize access to every user's details.
3. **Read access for families and staff**: organization-scoped role assignment is the outer boundary. For teachers, guardians, and students, the listed reads should also filter to relevant class, section, batch, or student enrollment when records are person- or class-specific. The current permission names alone do not express those row-level limits.

### Role intent

- **org_admin**: manage organization setup, membership, and organization-level role assignment within the assigned organization. Keep global role/permission administration and API-key creation restricted to `super_admin` or a dedicated trusted operator.
- **principal**: manage academic structure and read school-level administration information within the assigned organization. User and staff management should respect role hierarchy and organization scope.
- **teacher**: read academic reference data needed to teach and manage their own notification preferences. Teaching, attendance, grading, and class roster permissions should be added when those APIs exist.
- **guardian**: manage their own notification preferences. Student progress, attendance, messaging, and linked-student access should be added when those APIs exist and relationship checks are available.
- **student**: manage their own notification preferences. Timetable, assignments, grades, and student profile permissions should be added when those APIs exist and are scoped to the authenticated student.

The catalog also contains routes with no permission requirement (for example user creation, authentication/password flows, and some profile endpoints). This matrix covers only named `PermissionEnum` permissions; those routes need their own authentication and authorization review.
