import {
    BadRequestException, ConflictException, ForbiddenException, HttpException, Injectable,
    InternalServerErrorException, NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import type { Knex } from 'knex';
import knexConnection from '../../db/connector/knex';
import { CreateOrganisationDto, OrganisationAdminDto, OrganisationDto, UpdateOrganisationDto } from './dtos/organisation.dto';
import { BranchDto, CreateBranchDto, UpdateBranchDto } from './dtos/branch.dto';
import { ClassDto, CreateClassDto, TeachingClassDto, UpdateClassDto } from './dtos/class.dto';
import { ClassSectionDto, CreateClassSectionDto, UpdateClassSectionDto } from './dtos/class-section.dto';
import { ClassBatchDto, CreateClassBatchDto, UpdateClassBatchDto } from './dtos/class-batch.dto';
import { CreateOrgAcademicSessionDto, OrgAcademicSessionDto, UpdateOrgAcademicSessionDto } from './dtos/org-academic-session.dto';
import { CreateSubjectDto, SubjectDto, UpdateSubjectDto } from './dtos/subject.dto';
import {
    ClassSubjectMappingDto,
    CreateClassSubjectMappingDto,
    UpdateClassSubjectMappingDto,
} from './dtos/class-subject-mapping.dto';
import {
    CreateSectionSubjectMappingDto, SectionSubjectDto, SectionSubjectMappingDto, UpdateSectionSubjectMappingDto,
} from './dtos/section-subject-mapping.dto';
import {
    BatchSubjectDto, BatchSubjectMappingDto, CreateBatchSubjectMappingDto, UpdateBatchSubjectMappingDto,
} from './dtos/batch-subject-mapping.dto';
import {
    AttendanceSubject,
    AttendanceRangeDto,
    StudentAttendanceHistory,
    SetStudentAttendanceDto,
    StudentListQueryDto,
    StudentListPage,
    StudentGroupType,
    AddStudentToOrgDto,
    AddStudentToOrgResultDto,
    BranchStudentListQueryDto,
    BranchStudentListPage,
    AddExistingStudentToBatchDto,
    AddExistingStudentToBatchResultDto,
    UpdateBranchStudentDto,
    UpdateBranchStudentResultDto,
} from './dtos/add-student-to-org.dto';
import { AddOrganisationStaffDto, OrganisationStaffDto, UpdateOrganisationStaffDto, OrganisationStaffPageDto, StaffPageQueryDto } from './dtos/organisation-staff.dto';
import { RoleType } from '../../utils/enums/roleType';
import { OrganisationType } from '../../utils/enums/organisation';

const organisationColumns = [
    'id', 'name', 'tagline', 'type', 'email_id as emailId', 'phone_number as phoneNumber',
    'logo', 'address', 'status', 'created_at as createdAt', 'updated_at as updatedAt',
];

const classSubjectColumns = [
    'id', 'org_id as orgId', 'branch_id as branchId', 'class_id as classId',
    'section_id as sectionId', 'batch_id as batchId', 'subject_id as subjectId',
    'class_start_time as classStartTime', 'class_end_time as classEndTime',
    'is_active as isActive', 'created_at as createdAt',
];

const branchColumns = [
    'id', 'org_id as orgId', 'branch_name as branchName', 'branch_code as branchCode',
    'type', 'email_id as emailId', 'phone_number as phoneNumber', 'address', 'status',
    'created_at as createdAt', 'updated_at as updatedAt',
];

const classColumns = [
    'id', 'org_id as orgId', 'class_name as className', 'class_code as classCode',
    'description', 'status', 'created_at as createdAt', 'updated_at as updatedAt',
];

const classSectionColumns = [
    's.id', 'c.org_id as orgId', 's.branch_id as branchId',
    's.class_id as classId',
    's.section_code as sectionCode', 's.capacity', 's.daily_start_time as dailyStartTime',
    's.daily_end_time as dailyEndTime', 's.status', 's.created_at as createdAt', 's.updated_at as updatedAt',
];

const classBatchColumns = [
    'id', 'org_id as orgId', 'branch_id as branchId', 'academic_session_id as academicSessionId',
    'class_id as classId', 'batch_code as batchCode', 'batch_name as batchName',
    'daily_start_time as dailyStartTime', 'daily_end_time as dailyEndTime',
    'start_date as startDate', 'end_date as endDate', 'capacity', 'status',
    'created_at as createdAt', 'updated_at as updatedAt',
];

const academicSessionColumns = [
    'id', 'org_id as orgId', 'session_name as sessionName', 'start_date as startDate',
    'end_date as endDate', 'status', 'created_at as createdAt', 'updated_at as updatedAt',
];

const subjectColumns = [
    'id', 'organisation_id as orgId', 'subject_name as subjectName', 'subject_code as subjectCode',
    'description', 'status', 'created_at as createdAt', 'updated_at as updatedAt',
];

@Injectable()
export class OrganisationsRepository {
    async teacherGroupSubjects(
        orgId: string, branchId: string, userId: string, groupType: StudentGroupType, groupId: string,
        trx?: Knex.Transaction,
    ): Promise<AttendanceSubject[]> {
        const section = groupType === StudentGroupType.Sections;
        const db = trx ?? knexConnection;
        return db(section ? 'section_subjects_table as m' : 'batch_subjects_table as m')
            .join(section ? 'sections_table as g' : 'batches_table as g', 'g.id', section ? 'm.section_id' : 'm.batch_id')
            .join('classes as c', 'c.id', 'g.class_id')
            .join('subjects_table as sub', 'sub.id', 'm.subject_id')
            .join('academic_sessions_table as ses', 'ses.id', 'm.academic_session_id')
            .where({ 'g.id': groupId, 'g.branch_id': branchId, 'c.org_id': orgId, 'sub.organisation_id': orgId,
                'ses.org_id': orgId, 'ses.status': 1, 'm.teacher_user_id': userId })
            .modify(builder => { if (trx) builder.forShare(); })
            .orderBy(['sub.subject_name', 'sub.id'])
            .select('sub.id as subjectId', 'sub.subject_name as subjectName');
    }

    async getStudentAttendance(
        orgId: string, branchId: string, groupType: StudentGroupType, groupId: string,
        studentId: string, range: AttendanceRangeDto,
    ): Promise<StudentAttendanceHistory> {
        const groupColumn = groupType === StudentGroupType.Sections ? 'section_id' : 'batch_id';
        const student = await knexConnection('organisation_student_table')
            .where({ id: studentId, org_id: orgId, branch_id: branchId, [groupColumn]: groupId, status: 1 }).first('id');
        if (!student) throw new NotFoundException('Student is not enrolled in this group');
        const rows = await knexConnection('student_attendence_table')
            .where({ org_student_id: studentId, subject_id: range.subjectId, [groupColumn]: groupId })
            .whereBetween('attendence_date', [range.startDate, range.endDate])
            .orderBy('attendence_date')
            .select<{ date: string }[]>(knexConnection.raw("to_char(attendence_date, 'YYYY-MM-DD') as date"));
        return { presentDates: rows.map(row => row.date) };
    }

    async setStudentAttendance(
        orgId: string, branchId: string, groupType: StudentGroupType, groupId: string,
        studentId: string, teacherId: string, data: SetStudentAttendanceDto, date: string,
    ): Promise<void> {
        const groupColumn = groupType === StudentGroupType.Sections ? 'section_id' : 'batch_id';
        await knexConnection.transaction(async (trx) => {
            const subjects = await this.teacherGroupSubjects(orgId, branchId, teacherId, groupType, groupId, trx);
            if (!subjects.some(subject => subject.subjectId === data.subjectId)) {
                throw new ForbiddenException('You are not assigned to teach this subject in this group');
            }
            const student = await trx('organisation_student_table')
                .where({ id: studentId, org_id: orgId, branch_id: branchId, [groupColumn]: groupId, status: 1 })
                .forUpdate().first('user_id');
            if (!student) throw new NotFoundException('Student is not enrolled in this group');
            const key = { org_student_id: studentId, subject_id: data.subjectId, attendence_date: date, [groupColumn]: groupId };
            const attendance = trx('student_attendence_table');
            if (data.present) {
                await attendance.insert({ ...key, id: randomUUID(), user_id: student.user_id, teacher_user_id: teacherId })
                    .onConflict(['org_student_id', 'subject_id', 'attendence_date', groupColumn]).ignore();
            } else {
                await attendance.where(key).del();
            }
        });
    }

    async getStudentList(orgId: string, branchId: string, groupType: StudentGroupType, groupId: string, query: StudentListQueryDto,
        subjectId: string | null, date: string, subjects: AttendanceSubject[]): Promise<StudentListPage> {
        const section = groupType === StudentGroupType.Sections;
        const groupRow = await knexConnection(section ? 'sections_table as g' : 'batches_table as g')
            .join('classes as c', 'c.id', 'g.class_id')
            .where({ 'g.id': groupId, 'g.branch_id': branchId, 'c.org_id': orgId })
            .first('g.class_id as classId', 'c.class_name as className',
                ...(section ? ['g.section_code as code'] : ['g.batch_code as code', 'g.batch_name as batchName', 'g.academic_session_id as academicSessionId']));
        if (!groupRow) throw new NotFoundException('Class group not found in this branch');
        const { code, batchName, ...group } = groupRow;
        const list = knexConnection('organisation_student_table as s')
            .join('users_table as u', 'u.id', 's.user_id')
            .where({ 's.org_id': orgId, 's.branch_id': branchId, [section ? 's.section_id' : 's.batch_id']: groupId, 's.status': 1 });
        const count = await list.clone().count('* as total').first();
        const total = Number(count?.total ?? 0);
        const { pageSize } = query;
        const page = Math.min(query.page, Math.max(1, Math.ceil(total / pageSize)));
        if (subjectId) {
            list.leftJoin('student_attendence_table as a', function () {
                this.on('a.org_student_id', 's.id')
                    .onVal('a.subject_id', subjectId).onVal('a.attendence_date', date)
                    .onVal(section ? 'a.section_id' : 'a.batch_id', groupId);
            });
        }
        const students = await list.orderBy(['u.first_name', 'u.last_name', 's.enrollment_number', 's.id'])
            .limit(pageSize).offset((page - 1) * pageSize)
            .select(knexConnection.raw(subjectId ? 'a.id is not null as present' : 'null::boolean as present'),
                's.id', 's.user_id as userId', 's.enrollment_number as enrollmentNumber', 'u.first_name as firstName',
                'u.middle_name as middleName', 'u.last_name as lastName', 'u.email_id as emailId', 'u.phone_number as phoneNumber');
        const guardians = await knexConnection('student_guardian_table as link')
            .join('users_table as g', 'g.id', 'link.guardian_user_id')
            .whereIn('link.student_user_id', students.map(student => student.userId))
            .orderBy(['g.first_name', 'g.id'])
            .select('link.student_user_id as userId', 'g.first_name as firstName', 'g.middle_name as middleName',
                'g.last_name as lastName', 'g.phone_number as phoneNumber');
        const items = students.map(({ userId, ...student }) => ({
            ...student,
            guardians: guardians.filter(contact => contact.userId === userId)
                .map(({ firstName, middleName, lastName, phoneNumber }) => ({ firstName, middleName, lastName, phoneNumber })),
        }));
        return { subjectId, date, subjects, group: { ...group, name: section ? `Section ${code}` : batchName || code }, items, total, page, pageSize };
    }

    async getBranchStudentList(orgId: string, branchId: string, query: BranchStudentListQueryDto): Promise<BranchStudentListPage> {
        const latestPerUser = knexConnection('organisation_student_table')
            .distinctOn('user_id')
            .where({ org_id: orgId, branch_id: branchId, status: 1 })
            .modify((qb) => {
                if (query.classId) qb.andWhere({ class_id: query.classId });
            })
            .orderBy([
                { column: 'user_id', order: 'asc' },
                { column: 'updated_at', order: 'desc' },
                { column: 'id', order: 'desc' },
            ])
            .select('id');

        const list = knexConnection('organisation_student_table as s')
            .join('users_table as u', 'u.id', 's.user_id')
            .join('classes as c', 'c.id', 's.class_id')
            .leftJoin('batches_table as b', 'b.id', 's.batch_id')
            .leftJoin('sections_table as sec', 'sec.id', 's.section_id')
            .where({ 's.org_id': orgId, 's.branch_id': branchId, 's.status': 1 })
            .whereIn('s.id', latestPerUser);

        if (query.classId) {
            list.andWhere({ 's.class_id': query.classId });
        }

        if (query.excludeBatchId) {
            list.whereNotExists(
                knexConnection('organisation_student_table as ex')
                    .whereRaw('ex.user_id = s.user_id')
                    .andWhere({
                        'ex.org_id': orgId,
                        'ex.branch_id': branchId,
                        'ex.batch_id': query.excludeBatchId,
                        'ex.status': 1,
                    }),
            );
        }

        const search = query.search?.trim();
        if (search) {
            const term = `%${search}%`;
            list.andWhere((builder) => {
                builder
                    .whereRaw("concat_ws(' ', u.first_name, u.middle_name, u.last_name) ILIKE ?", [term])
                    .orWhere('u.email_id', 'ilike', term)
                    .orWhere('s.enrollment_number', 'ilike', term);
            });
        }

        const count = await list.clone().count('* as total').first();
        const total = Number(count?.total ?? 0);
        const { pageSize } = query;
        const page = Math.min(query.page, Math.max(1, Math.ceil(total / pageSize)));
        const items = await list
            .orderBy(['u.first_name', 'u.last_name', 's.enrollment_number', 's.id'])
            .limit(pageSize)
            .offset((page - 1) * pageSize)
            .select(
                's.id',
                's.user_id as userId',
                's.enrollment_number as enrollmentNumber',
                'u.first_name as firstName',
                'u.middle_name as middleName',
                'u.last_name as lastName',
                'u.email_id as emailId',
                'u.phone_number as phoneNumber',
                's.class_id as classId',
                'c.class_name as className',
                's.batch_id as batchId',
                knexConnection.raw('coalesce(b.batch_name, b.batch_code) as "batchName"'),
                's.section_id as sectionId',
                'sec.section_code as sectionCode',
            );

        return { items, total, page, pageSize };
    }

    async addExistingStudentToBatch(
        orgId: string,
        branchId: string,
        batchId: string,
        data: AddExistingStudentToBatchDto,
    ): Promise<AddExistingStudentToBatchResultDto> {
        const trx = await knexConnection.transaction();
        try {
            const batch = await trx('batches_table')
                .where({ id: batchId, org_id: orgId, branch_id: branchId })
                .first('id', 'class_id', 'academic_session_id');
            if (!batch) {
                throw new NotFoundException('Batch not found for this organisation and branch');
            }

            const session = await trx('academic_sessions_table')
                .where({ id: batch.academic_session_id, org_id: orgId })
                .first('id', 'status');
            if (!session) {
                throw new NotFoundException('Academic session not found for this organisation');
            }
            if (session.status !== 1) {
                throw new BadRequestException('Changes can only be made for the active academic session');
            }

            const existingStudent = await trx('organisation_student_table')
                .where({ id: data.studentId, org_id: orgId, status: 1 })
                .first('id', 'user_id', 'branch_id', 'class_id', 'batch_id', 'enrollment_number', 'enrollment_date');
            if (!existingStudent) {
                throw new NotFoundException('Student not found in this organisation');
            }
            if (existingStudent.branch_id !== branchId) {
                throw new BadRequestException('Student does not belong to this branch');
            }
            if (existingStudent.class_id !== batch.class_id) {
                throw new BadRequestException('Student does not belong to this class');
            }

            const alreadyInBatch = await trx('organisation_student_table')
                .where({
                    user_id: existingStudent.user_id,
                    org_id: orgId,
                    branch_id: branchId,
                    batch_id: batchId,
                    status: 1,
                })
                .first('id');
            if (alreadyInBatch) {
                throw new ConflictException('Student is already enrolled in this batch');
            }

            const enrollmentDate = data.enrollmentDate ?? existingStudent.enrollment_date;
            const placement = {
                id: randomUUID(),
                academic_session_id: batch.academic_session_id,
                org_id: orgId,
                branch_id: branchId,
                user_id: existingStudent.user_id,
                class_id: batch.class_id,
                section_id: null,
                batch_id: batchId,
                enrollment_date: enrollmentDate,
            };

            const [student] = await trx('organisation_student_table')
                .insert({
                    ...placement,
                    enrollment_number: existingStudent.enrollment_number,
                    status: 1,
                })
                .returning([
                    'id', 'academic_session_id as academicSessionId', 'org_id as orgId',
                    'branch_id as branchId', 'user_id as userId', 'class_id as classId',
                    'section_id as sectionId', 'batch_id as batchId', 'enrollment_number as enrollmentNumber',
                    'enrollment_date as enrollmentDate', 'status', 'created_at as createdAt', 'updated_at as updatedAt',
                ]);

            await trx('student_enrollment').insert({
                ...placement,
                is_active: true,
            });

            await trx.commit();
            return { student };
        } catch (error) {
            await trx.rollback();
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Unable to add student to batch; all changes were rolled back');
        }
    }

    async updateBranchStudent(
        orgId: string,
        branchId: string,
        studentId: string,
        data: UpdateBranchStudentDto,
        requireGroup = false,
    ): Promise<UpdateBranchStudentResultDto> {
        if (data.sectionId && data.batchId) {
            throw new BadRequestException('A student cannot be enrolled in both a section and a batch');
        }
        if (requireGroup && !data.sectionId && !data.batchId) {
            throw new BadRequestException('Choose a section or batch for this student.');
        }

        const trx = await knexConnection.transaction();
        try {
            const existing = await trx('organisation_student_table')
                .where({ id: studentId, org_id: orgId, branch_id: branchId, status: 1 })
                .first('id', 'user_id', 'academic_session_id', 'class_id', 'section_id', 'batch_id', 'enrollment_date');
            if (!existing) {
                throw new NotFoundException('Active student record not found in this branch');
            }

            const [branch, session, classMapping] = await Promise.all([
                trx('branches').where({ id: branchId, org_id: orgId }).first('id', 'type'),
                data.academicSessionId
                    ? trx('academic_sessions_table').where({ id: data.academicSessionId, org_id: orgId }).first('id', 'status')
                    : trx('academic_sessions_table').where({ org_id: orgId, status: 1 }).first('id', 'status'),
                trx('branch_classes_table')
                    .join('classes as c', 'c.id', 'branch_classes_table.class_id')
                    .where({
                        'branch_classes_table.org_id': orgId,
                        'branch_classes_table.branch_id': branchId,
                        'branch_classes_table.class_id': data.classId,
                    })
                    .first('c.id'),
            ]);

            if (!branch) throw new NotFoundException('Branch not found for this organisation');
            if (!session) throw new NotFoundException('Active academic session not found for this organisation');
            if (session.status !== 1) {
                throw new BadRequestException('Changes can only be made for the active academic session');
            }
            if (!classMapping) throw new NotFoundException('Class not found for this branch');

            if (data.sectionId) {
                const section = await trx('sections_table').where({
                    id: data.sectionId,
                    class_id: data.classId,
                    branch_id: branchId,
                }).first('id');
                if (!section) {
                    throw new NotFoundException('Section not found for this class and branch');
                }
            }
            if (data.batchId) {
                const batch = await trx('batches_table').where({
                    id: data.batchId,
                    org_id: orgId,
                    branch_id: branchId,
                    academic_session_id: session.id,
                    class_id: data.classId,
                }).first('id');
                if (!batch) {
                    throw new NotFoundException('Batch not found for this class, branch, and academic session');
                }

                const duplicateBatch = await trx('organisation_student_table')
                    .where({
                        user_id: existing.user_id,
                        org_id: orgId,
                        branch_id: branchId,
                        batch_id: data.batchId,
                        status: 1,
                    })
                    .whereNot('id', studentId)
                    .first('id');
                if (duplicateBatch) {
                    throw new ConflictException('Student is already enrolled in this batch');
                }
            }

            if (data.classId !== existing.class_id) {
                await trx('organisation_student_table')
                    .where({ user_id: existing.user_id, org_id: orgId, branch_id: branchId, status: 1 })
                    .whereNot('id', studentId)
                    .update({ status: 0, updated_at: trx.fn.now() });

                await trx('student_enrollment')
                    .where({ user_id: existing.user_id, is_active: true })
                    .whereNot('id', studentId)
                    .update({ is_active: false });
            } else if (data.sectionId) {
                await trx('student_enrollment')
                    .where({ user_id: existing.user_id, is_active: true })
                    .whereNotNull('section_id')
                    .whereNot('id', studentId)
                    .update({ is_active: false });
            }

            const userUpdates: Record<string, unknown> = {};
            if (data.firstName !== undefined) userUpdates.first_name = data.firstName.trim();
            if (data.middleName !== undefined) userUpdates.middle_name = data.middleName?.trim() || null;
            if (data.lastName !== undefined) userUpdates.last_name = data.lastName.trim();
            if (data.phoneNumber !== undefined) userUpdates.phone_number = data.phoneNumber?.trim() || null;
            if (Object.keys(userUpdates).length > 0) {
                userUpdates.updated_at = trx.fn.now();
                await trx('users_table')
                    .where({ id: existing.user_id, org_id: orgId })
                    .update(userUpdates);
            }

            const [student] = await trx('organisation_student_table')
                .where({ id: studentId, org_id: orgId, branch_id: branchId, status: 1 })
                .update({
                    academic_session_id: session.id,
                    class_id: data.classId,
                    section_id: data.sectionId ?? null,
                    batch_id: data.batchId ?? null,
                    updated_at: trx.fn.now(),
                })
                .returning([
                    'id', 'academic_session_id as academicSessionId', 'org_id as orgId',
                    'branch_id as branchId', 'user_id as userId', 'class_id as classId',
                    'section_id as sectionId', 'batch_id as batchId', 'enrollment_number as enrollmentNumber',
                    'enrollment_date as enrollmentDate', 'status', 'created_at as createdAt', 'updated_at as updatedAt',
                ]);

            const enrollmentRow = await trx('student_enrollment').where({ id: studentId }).first('id');
            if (enrollmentRow) {
                await trx('student_enrollment')
                    .where({ id: studentId })
                    .update({
                        academic_session_id: session.id,
                        class_id: data.classId,
                        section_id: data.sectionId ?? null,
                        batch_id: data.batchId ?? null,
                        is_active: true,
                    });
            } else {
                await trx('student_enrollment').insert({
                    id: studentId,
                    academic_session_id: session.id,
                    org_id: orgId,
                    branch_id: branchId,
                    user_id: existing.user_id,
                    class_id: data.classId,
                    section_id: data.sectionId ?? null,
                    batch_id: data.batchId ?? null,
                    enrollment_date: existing.enrollment_date,
                    is_active: true,
                });
            }

            await trx.commit();
            return { student };
        } catch (error) {
            await trx.rollback();
            if (error instanceof HttpException) throw error;
            if (error?.code === '23505') throw new ConflictException('Student is already enrolled in this class group');
            throw new InternalServerErrorException('Unable to update student; all changes were rolled back');
        }
    }

    async addStudentToOrg(orgId: string, data: AddStudentToOrgDto): Promise<AddStudentToOrgResultDto> {
        if (data.sectionId && data.batchId) {
            throw new BadRequestException('A student cannot be enrolled in both a section and a batch');
        }
        const passwordHash = await bcrypt.hash('Password@123', 10);
        const userId = randomUUID();
        const studentId = randomUUID();
        const trx = await knexConnection.transaction();
        try {
            const organisation = await trx('organisations').where({ id: orgId }).first('id');
            if (!organisation) throw new NotFoundException('Organisation not found');
            const [branch, session, classRecord] = await Promise.all([
                trx('branches').where({ id: data.branchId, org_id: orgId }).first('id'),
                trx('academic_sessions_table').where({ id: data.academicSessionId, org_id: orgId }).first('id', 'status'),
                trx('classes').where({ id: data.classId, org_id: orgId }).first('id'),
            ]);
            if (!branch) throw new NotFoundException('Branch not found for this organisation');
            if (!session) throw new NotFoundException('Academic session not found for this organisation');
            if (session.status !== 1) throw new BadRequestException('Changes can only be made for the active academic session');
            if (!classRecord) throw new NotFoundException('Class not found for this organisation');

            if (data.sectionId) {
                const section = await trx('sections_table').where({
                    id: data.sectionId,
                    class_id: data.classId,
                    branch_id: data.branchId,
                }).first('id');
                if (!section) throw new NotFoundException('Section not found for this class and branch');
            }
            if (data.batchId) {
                const batch = await trx('batches_table').where({
                    id: data.batchId,
                    org_id: orgId,
                    branch_id: data.branchId,
                    academic_session_id: data.academicSessionId,
                    class_id: data.classId,
                }).first('id');
                if (!batch) throw new NotFoundException('Batch not found for this class, branch, and academic session');
            }

            const existingUser = await trx('users_table')
                .whereRaw('lower(email_id) = lower(?)', [data.emailId])
                .first('id');
            if (existingUser) throw new ConflictException('A user with this email already exists');
            const existingEnrollment = await trx('organisation_student_table')
                .where({ org_id: orgId, enrollment_number: data.enrollmentNumber })
                .first('id');
            if (existingEnrollment) throw new ConflictException('Enrollment number already exists in this organisation');

            const [user] = await trx('users_table').insert({
                id: userId,
                first_name: data.firstName,
                middle_name: data.middleName ?? null,
                last_name: data.lastName,
                email_id: data.emailId.toLowerCase(),
                password_hash: passwordHash,
                phone_number: data.phoneNumber ?? null,
                org_id: orgId,
                address: data.address ?? null,
            }).returning([
                'id', 'first_name as firstName', 'middle_name as middleName', 'last_name as lastName',
                'email_id as emailId', 'phone_number as phoneNumber', 'org_id as orgId', 'address',
                'created_at as createdAt', 'updated_at as updatedAt',
            ]);

            const role = await trx('roles_table').where({ role_name: 'student' }).first('id');
            if (!role) throw new InternalServerErrorException('Student role is missing');
            await trx('user_roles_table').insert({ id: randomUUID(), user_id: userId, role_id: role.id, org_id: orgId });
            if (data.guardianName?.trim() && data.guardianContact?.trim()) {
                const guardianId = randomUUID();
                const [firstName, ...lastName] = data.guardianName.trim().split(/\s+/);
                await trx('users_table').insert({ id: guardianId, first_name: firstName, last_name: lastName.join(' '),
                    org_id: orgId, phone_number: data.guardianContact.trim() });
                await trx('student_guardian_table').insert({ id: randomUUID(), student_user_id: userId,
                    guardian_user_id: guardianId, relation_type: 'Guardian' });
            }
            const placement = {
                id: studentId,
                academic_session_id: data.academicSessionId,
                org_id: orgId,
                branch_id: data.branchId,
                user_id: userId,
                class_id: data.classId,
                section_id: data.sectionId ?? null,
                batch_id: data.batchId ?? null,
                enrollment_date: data.enrollmentDate,
            };
            const [student] = await trx('organisation_student_table').insert({
                ...placement,
                enrollment_number: data.enrollmentNumber,
            }).returning([
                'id', 'academic_session_id as academicSessionId', 'org_id as orgId',
                'branch_id as branchId', 'user_id as userId', 'class_id as classId',
                'section_id as sectionId', 'batch_id as batchId', 'enrollment_number as enrollmentNumber',
                'enrollment_date as enrollmentDate', 'status', 'created_at as createdAt', 'updated_at as updatedAt',
            ]);
            await trx('student_enrollment').insert({ ...placement, is_active: true });
            await trx.commit();
            return { user, student };
        } catch (error) {
            await trx.rollback();
            if (error instanceof HttpException) throw error;
            if (error?.code === '23505') throw new ConflictException('Student or user record already exists');
            throw new InternalServerErrorException('Unable to add student to organisation; all changes were rolled back');
        }
    }

    private assertValidSubjectTimeSlot(startTime: string | null, endTime: string | null): void {
        if (startTime && endTime && startTime.padEnd(8, ':00') >= endTime.padEnd(8, ':00')) {
            throw new BadRequestException('Subject start time must be earlier than end time');
        }
    }

    private async assertActiveBranchTeacher(
        orgId: string,
        branchId: string,
        teacherUserId: string,
        db: Knex | Knex.Transaction = knexConnection,
    ): Promise<void> {
        const teacher = await db('organisation_staff_table as st')
            .join('user_roles_table as ur', function () {
                this.on('ur.user_id', 'st.user_id').andOn('ur.org_id', 'st.org_id');
            })
            .join('roles_table as r', 'r.id', 'ur.role_id')
            .where({
                'st.org_id': orgId,
                'st.user_id': teacherUserId,
                'st.status': 1,
                'ur.branch_id': branchId,
                'ur.is_active': true,
                'ur.is_deleted': false,
                'r.role_name': 'teacher',
            })
            .first('st.user_id')
            .forShare();
        if (!teacher) throw new BadRequestException('Choose an active teacher assigned to this branch');
    }

    async findSectionSubjectMappingById(
        orgId: string, branchId: string, academicSessionId: string, id: string,
    ): Promise<{ id: string; sectionId: string; startTime: string | null; endTime: string | null } | undefined> {
        return knexConnection('section_subjects_table as ss')
            .join('sections_table as s', 's.id', 'ss.section_id')
            .join('classes as c', 's.class_id', 'c.id')
            .where({
                'ss.id': id,
                'ss.academic_session_id': academicSessionId,
                's.branch_id': branchId,
                'c.org_id': orgId,
            })
            .first('ss.id', 'ss.section_id as sectionId', 'ss.start_time as startTime', 'ss.end_time as endTime');
    }

    async findBatchSubjectMappingById(
        orgId: string, branchId: string, academicSessionId: string, id: string,
    ): Promise<{ id: string; batchId: string; startTime: string | null; endTime: string | null } | undefined> {
        return knexConnection('batch_subjects_table as bs')
            .join('batches_table as b', 'b.id', 'bs.batch_id')
            .where({
                'bs.id': id,
                'bs.academic_session_id': academicSessionId,
                'b.org_id': orgId,
                'b.branch_id': branchId,
                'b.academic_session_id': academicSessionId,
            })
            .first('bs.id', 'bs.batch_id as batchId', 'bs.start_time as startTime', 'bs.end_time as endTime');
    }

    async listSectionSubjects(orgId: string, branchId: string, academicSessionId: string, sectionId: string): Promise<SectionSubjectDto[]> {
        await this.findClassSectionById(sectionId, orgId, branchId);
        return knexConnection('section_subjects_table as ss')
            .join('subjects_table as s', 's.id', 'ss.subject_id')
            .leftJoin('users_table as u', function () {
                this.on('u.id', 'ss.teacher_user_id').andOn('u.org_id', 's.organisation_id');
            })
            .where({
                'ss.section_id': sectionId,
                'ss.academic_session_id': academicSessionId,
                's.organisation_id': orgId,
            })
            .select(
                'ss.id',
                's.id as subjectId',
                's.organisation_id as orgId',
                's.subject_name as subjectName',
                's.subject_code as subjectCode',
                's.description',
                's.status',
                'ss.teacher_user_id as teacherUserId',
                'u.first_name as teacherFirstName',
                'u.last_name as teacherLastName',
                'ss.start_time as startTime',
                'ss.end_time as endTime',
                'ss.created_at as createdAt',
                'ss.updated_at as updatedAt',
            )
            .orderBy('s.subject_name');
    }

    async createSectionSubjectMapping(data: CreateSectionSubjectMappingDto): Promise<SectionSubjectMappingDto> {
        return this.saveSectionSubjectMapping(data.orgId, data.branchId, data.academicSessionId, data);
    }

    async updateSectionSubjectMapping(
        orgId: string, branchId: string, academicSessionId: string, id: string, data: UpdateSectionSubjectMappingDto,
    ): Promise<SectionSubjectMappingDto> {
        return this.saveSectionSubjectMapping(orgId, branchId, academicSessionId, data, id);
    }

    private async saveSectionSubjectMapping(
        orgId: string, branchId: string, academicSessionId: string, data: UpdateSectionSubjectMappingDto, id?: string,
    ): Promise<SectionSubjectMappingDto> {
        try {
            return await knexConnection.transaction(async (trx) => {
                const session = await trx('academic_sessions_table').where({ id: academicSessionId, org_id: orgId })
                    .first('status').forShare();
                if (!session) throw new NotFoundException('Academic session not found for this organisation');
                if (session.status !== 1) throw new BadRequestException('Choose the active academic session');

                const sections = trx('sections_table as s').join('classes as c', 's.class_id', 'c.id')
                    .where({ 's.branch_id': branchId, 'c.org_id': orgId }).select('s.id');
                const current = id ? await trx('section_subjects_table').where({ id, academic_session_id: academicSessionId })
                    .whereIn('section_id', sections.clone()).first('section_id', 'subject_id', 'teacher_user_id', 'start_time', 'end_time').forUpdate() : undefined;
                if (id && !current) throw new NotFoundException('Section subject mapping not found in this branch and session');

                const sectionId = data.sectionId ?? current?.section_id;
                const subjectId = data.subjectId ?? current?.subject_id;
                if (!await sections.where('s.id', sectionId).first().forShare()) {
                    throw new NotFoundException('Section not found for this branch');
                }
                const subject = await trx('branch_subjects_table as bs').join('subjects_table as s', 's.id', 'bs.subject_id')
                    .where({ 'bs.branch_id': branchId, 'bs.subject_id': subjectId, 's.organisation_id': orgId }).first('s.id').forShare();
                if (!subject) throw new BadRequestException('Choose a subject assigned to this branch');

                if (data.teacherUserId !== undefined && data.teacherUserId !== null) {
                    await this.assertActiveBranchTeacher(orgId, branchId, data.teacherUserId, trx);
                }

                const teacherUserId = data.teacherUserId !== undefined
                    ? data.teacherUserId
                    : (current?.teacher_user_id ?? null);
                const startTime = data.startTime !== undefined ? data.startTime : (current?.start_time ?? null);
                const endTime = data.endTime !== undefined ? data.endTime : (current?.end_time ?? null);
                this.assertValidSubjectTimeSlot(startTime, endTime);

                const values = {
                    section_id: sectionId,
                    subject_id: subjectId,
                    teacher_user_id: teacherUserId,
                    start_time: startTime,
                    end_time: endTime,
                };
                const mappings = trx('section_subjects_table');
                const write = id ? mappings.where({ id }).update({ ...values, updated_at: trx.fn.now() })
                    : mappings.insert({ ...values, id: randomUUID(), academic_session_id: academicSessionId });
                const [mapping] = await write.returning(['id', 'section_id as sectionId', 'subject_id as subjectId',
                    'academic_session_id as academicSessionId', 'teacher_user_id as teacherUserId',
                    'start_time as startTime', 'end_time as endTime',
                    'created_at as createdAt', 'updated_at as updatedAt']);
                return { ...mapping, orgId, branchId };
            });
        } catch (error: unknown) {
            if (typeof error === 'object' && error !== null && 'constraint' in error && error.constraint === 'section_subject_session_unique') {
                throw new ConflictException('This subject is already assigned to the section for this academic session');
            }
            throw error;
        }
    }

    async listBatchSubjects(orgId: string, branchId: string, academicSessionId: string, batchId: string): Promise<BatchSubjectDto[]> {
        await this.validateSessionScope(orgId, branchId, academicSessionId, false);
        const batch = await knexConnection('batches_table')
            .where({ id: batchId, org_id: orgId, branch_id: branchId, academic_session_id: academicSessionId })
            .first('id');
        if (!batch) throw new NotFoundException('Batch not found for this organisation, branch, and academic session');
        return knexConnection('batch_subjects_table as bs')
            .join('subjects_table as s', 's.id', 'bs.subject_id')
            .leftJoin('users_table as u', function () {
                this.on('u.id', 'bs.teacher_user_id').andOn('u.org_id', 's.organisation_id');
            })
            .where({
                'bs.batch_id': batchId,
                'bs.academic_session_id': academicSessionId,
                's.organisation_id': orgId,
            })
            .select(
                'bs.id',
                's.id as subjectId',
                's.organisation_id as orgId',
                's.subject_name as subjectName',
                's.subject_code as subjectCode',
                's.description',
                's.status',
                'bs.teacher_user_id as teacherUserId',
                'u.first_name as teacherFirstName',
                'u.last_name as teacherLastName',
                'bs.start_time as startTime',
                'bs.end_time as endTime',
                'bs.created_at as createdAt',
                'bs.updated_at as updatedAt',
            )
            .orderBy('s.subject_name');
    }

    async createBatchSubjectMapping(data: CreateBatchSubjectMappingDto): Promise<BatchSubjectMappingDto> {
        await this.validateSessionScope(data.orgId, data.branchId, data.academicSessionId, true);
        const subject = await knexConnection('subjects_table').where({ id: data.subjectId, organisation_id: data.orgId }).first('id');
        if (!subject) throw new NotFoundException('Subject not found for this organisation');
        const batch = await knexConnection('batches_table')
            .where({ id: data.batchId, org_id: data.orgId, branch_id: data.branchId, academic_session_id: data.academicSessionId })
            .first('id');
        if (!batch) throw new NotFoundException('Batch not found for this organisation, branch, and academic session');
        const startTime = data.startTime ?? null;
        const endTime = data.endTime ?? null;
        this.assertValidSubjectTimeSlot(startTime, endTime);
        const [mapping] = await knexConnection('batch_subjects_table')
            .insert({
                id: randomUUID(), batch_id: data.batchId, subject_id: data.subjectId,
                academic_session_id: data.academicSessionId, teacher_user_id: null,
                start_time: startTime, end_time: endTime,
            })
            .returning(['id', 'batch_id as batchId', 'subject_id as subjectId', 'academic_session_id as academicSessionId',
                'teacher_user_id as teacherUserId', 'start_time as startTime', 'end_time as endTime',
                'created_at as createdAt', 'updated_at as updatedAt']);
        return { ...mapping, orgId: data.orgId, branchId: data.branchId };
    }

    async updateBatchSubjectMapping(
        orgId: string, branchId: string, academicSessionId: string, id: string,
        data: UpdateBatchSubjectMappingDto,
    ): Promise<BatchSubjectMappingDto> {
        await this.validateSessionScope(orgId, branchId, academicSessionId, true);
        const current = await knexConnection('batch_subjects_table as bs')
            .join('batches_table as b', 'bs.batch_id', 'b.id')
            .where({ 'bs.id': id, 'bs.academic_session_id': academicSessionId, 'b.org_id': orgId, 'b.branch_id': branchId, 'b.academic_session_id': academicSessionId })
            .first('bs.batch_id as batchId', 'bs.subject_id as subjectId', 'bs.teacher_user_id as teacherUserId',
                'bs.start_time as startTime', 'bs.end_time as endTime');
        if (!current) throw new NotFoundException('Batch subject mapping not found in this context');
        const batchId = data.batchId ?? current.batchId;
        const subjectId = data.subjectId ?? current.subjectId;
        const subject = await knexConnection('subjects_table').where({ id: subjectId, organisation_id: orgId }).first('id');
        if (!subject) throw new NotFoundException('Subject not found for this organisation');
        const batch = await knexConnection('batches_table').where({
            id: batchId, org_id: orgId, branch_id: branchId, academic_session_id: academicSessionId,
        }).first('id');
        if (!batch) throw new NotFoundException('Batch not found in this context');

        if (data.teacherUserId !== undefined && data.teacherUserId !== null) {
            await this.assertActiveBranchTeacher(orgId, branchId, data.teacherUserId);
        }

        const teacherUserId = data.teacherUserId !== undefined ? data.teacherUserId : current.teacherUserId;
        const startTime = data.startTime !== undefined ? data.startTime : current.startTime;
        const endTime = data.endTime !== undefined ? data.endTime : current.endTime;
        this.assertValidSubjectTimeSlot(startTime, endTime);

        if (
            data.batchId !== undefined || data.subjectId !== undefined || data.teacherUserId !== undefined
            || data.startTime !== undefined || data.endTime !== undefined
        ) {
            await knexConnection('batch_subjects_table').where({ id }).update({
                batch_id: batchId,
                subject_id: subjectId,
                teacher_user_id: teacherUserId,
                start_time: startTime,
                end_time: endTime,
                updated_at: knexConnection.fn.now(),
            });
        }
        const [mapping] = await knexConnection('batch_subjects_table')
            .where({ id }).select('id', 'batch_id as batchId', 'subject_id as subjectId',
                'academic_session_id as academicSessionId', 'teacher_user_id as teacherUserId',
                'start_time as startTime', 'end_time as endTime',
                'created_at as createdAt', 'updated_at as updatedAt');
        return { ...mapping, orgId, branchId };
    }

    private async validateClassSubjectMapping(
        data: CreateClassSubjectMappingDto,
        db: Knex | Knex.Transaction = knexConnection,
    ): Promise<void> {
        if (Boolean(data.sectionId) === Boolean(data.batchId)) throw new BadRequestException('Select exactly one section or batch');
        if (data.classStartTime.padEnd(8, ':00') >= data.classEndTime.padEnd(8, ':00')) throw new BadRequestException('class end time must be after start time');
        const [branch, classRecord, subject, group] = await Promise.all([
            db('branches').where({ id: data.branchId, org_id: data.orgId }).first('id'),
            db('classes').where({ id: data.classId, org_id: data.orgId }).first('id'),
            db('subjects_table').where({ id: data.subjectId, organisation_id: data.orgId }).first('id'),
            data.sectionId
                ? db('sections_table').where({ id: data.sectionId, class_id: data.classId, branch_id: data.branchId }).first('id')
                : db('batches_table').where({ id: data.batchId, org_id: data.orgId, class_id: data.classId, branch_id: data.branchId }).first('id'),
        ]);
        if (!branch) throw new NotFoundException('Branch not found for this organisation');
        if (!classRecord) throw new NotFoundException('Class not found for this organisation');
        if (!subject) throw new NotFoundException('Subject not found for this organisation');
        if (!group) throw new NotFoundException('Section or batch not found for this class and branch');
    }

    async createClassSubjectMapping(data: CreateClassSubjectMappingDto): Promise<ClassSubjectMappingDto> {
        await this.validateClassSubjectMapping(data);
        const [mapping] = await knexConnection('class_subjects_table')
            .insert({
                id: randomUUID(), org_id: data.orgId, branch_id: data.branchId,
                class_id: data.classId, subject_id: data.subjectId,
                section_id: data.sectionId ?? null, batch_id: data.batchId ?? null,
                class_start_time: data.classStartTime, class_end_time: data.classEndTime,
                is_active: data.isActive ?? true,
            })
            .returning(classSubjectColumns);
        return mapping;
    }

    async updateClassSubjectMapping(
        orgId: string,
        id: string,
        data: UpdateClassSubjectMappingDto,
    ): Promise<ClassSubjectMappingDto> {
        return knexConnection.transaction(async (trx) => {
            const current = await trx('class_subjects_table').where({ id, org_id: orgId }).first(classSubjectColumns).forUpdate();
            if (!current) throw new NotFoundException('Class subject mapping not found for this organisation');
            const updated: CreateClassSubjectMappingDto = {
                orgId,
                branchId: data.branchId ?? current.branchId,
                classId: data.classId ?? current.classId,
                sectionId: data.sectionId === undefined ? current.sectionId : data.sectionId,
                batchId: data.batchId === undefined ? current.batchId : data.batchId,
                subjectId: data.subjectId ?? current.subjectId,
                classStartTime: data.classStartTime ?? current.classStartTime,
                classEndTime: data.classEndTime ?? current.classEndTime,
                isActive: data.isActive ?? current.isActive,
            };
            await this.validateClassSubjectMapping(updated, trx);
            const [mapping] = await trx('class_subjects_table').where({ id, org_id: orgId }).update({
                branch_id: updated.branchId, class_id: updated.classId,
                section_id: updated.sectionId ?? null, batch_id: updated.batchId ?? null,
                subject_id: updated.subjectId, class_start_time: updated.classStartTime, class_end_time: updated.classEndTime,
                is_active: updated.isActive,
            }).returning(classSubjectColumns);
            return mapping;
        });
    }

    async createSubject(data: CreateSubjectDto): Promise<SubjectDto> {
        const organisation = await knexConnection('organisations').where({ id: data.orgId }).first('id');
        if (!organisation) throw new NotFoundException('Organisation not found');
        const [subject] = await knexConnection('subjects_table')
            .insert({
                id: randomUUID(), organisation_id: data.orgId, subject_name: data.subjectName,
                subject_code: data.subjectCode, description: data.description ?? null,
            })
            .returning(subjectColumns);
        return subject;
    }

    async updateSubject(orgId: string, id: string, data: UpdateSubjectDto): Promise<SubjectDto> {
        const changes: Record<string, unknown> = {};
        if (data.subjectName !== undefined) changes.subject_name = data.subjectName;
        if (data.subjectCode !== undefined) changes.subject_code = data.subjectCode;
        if (data.description !== undefined) changes.description = data.description;
        if (!Object.keys(changes).length) return this.findSubjectById(orgId, id);
        changes.updated_at = knexConnection.fn.now();
        const [subject] = await knexConnection('subjects_table')
            .where({ id, organisation_id: orgId })
            .update(changes)
            .returning(subjectColumns);
        if (!subject) throw new NotFoundException('Subject not found for this organisation');
        return subject;
    }

    async assignBranchSubject(orgId: string, branchId: string, subjectId: string): Promise<void> {
        await knexConnection.transaction(async (trx) => {
            const branch = await trx('branches').where({ id: branchId, org_id: orgId }).first('id').forShare();
            if (!branch) throw new NotFoundException('Branch not found for this organisation');
            const subject = await trx('subjects_table')
                .where({ id: subjectId, organisation_id: orgId }).first('id').forShare();
            if (!subject) throw new NotFoundException('Subject not found for this organisation');
            await trx('branch_subjects_table').insert({ id: randomUUID(), branch_id: branchId, subject_id: subjectId })
                .onConflict(['branch_id', 'subject_id']).ignore();
        });
    }

    async findSubjectListByOrgId(orgId: string, branchId?: string): Promise<SubjectDto[]> {
        const organisation = await knexConnection('organisations').where({ id: orgId }).first('id');
        if (!organisation) throw new NotFoundException('Organisation not found');
        return knexConnection('subjects_table')
            .where({ organisation_id: orgId })
            .modify((query) => {
                if (branchId) query.whereIn('id', knexConnection('branch_subjects_table')
                    .where({ branch_id: branchId }).select('subject_id'));
            })
            .select(subjectColumns)
            .orderBy('subject_name', 'asc');
    }

    async findSubjectById(orgId: string, id: string): Promise<SubjectDto> {
        const subject = await knexConnection('subjects_table')
            .where({ id, organisation_id: orgId })
            .select(subjectColumns)
            .first();
        if (!subject) throw new NotFoundException('Subject not found for this organisation');
        return subject;
    }

    private assertValidSessionDates(startDate: string | Date, endDate: string | Date): void {
        const start = new Date(startDate).getTime();
        const end = new Date(endDate).getTime();
        if (Number.isNaN(start) || Number.isNaN(end) || end < start) {
            throw new BadRequestException('Academic session end date must be on or after start date');
        }
    }

    async createOrgAcademicSession(data: CreateOrgAcademicSessionDto): Promise<OrgAcademicSessionDto> {
        const organisation = await knexConnection('organisations').where({ id: data.orgId }).first('id');
        if (!organisation) throw new NotFoundException('Organisation not found');
        this.assertValidSessionDates(data.startDate, data.endDate);
        const status = data.status ?? 1;
        return knexConnection.transaction(async (trx) => {
            if (status === 1) {
                await trx('academic_sessions_table')
                    .where({ org_id: data.orgId, status: 1 })
                    .update({ status: 0, updated_at: knexConnection.fn.now() });
            }
            const [session] = await trx('academic_sessions_table')
                .insert({
                    id: randomUUID(), org_id: data.orgId, session_name: data.sessionName ?? null,
                    start_date: data.startDate, end_date: data.endDate, status,
                })
                .returning(academicSessionColumns);
            return session;
        });
    }

    async updateOrgAcademicSession(
        orgId: string,
        id: string,
        data: UpdateOrgAcademicSessionDto,
    ): Promise<OrgAcademicSessionDto> {
        const existing = await knexConnection('academic_sessions_table')
            .where({ id, org_id: orgId })
            .first('id', 'start_date', 'end_date');
        if (!existing) throw new NotFoundException('Academic session not found for this organisation');
        if (data.startDate !== undefined || data.endDate !== undefined) {
            this.assertValidSessionDates(data.startDate ?? existing.start_date, data.endDate ?? existing.end_date);
        }
        const changes: Record<string, unknown> = {};
        if (data.sessionName !== undefined) changes.session_name = data.sessionName;
        if (data.startDate !== undefined) changes.start_date = data.startDate;
        if (data.endDate !== undefined) changes.end_date = data.endDate;
        if (data.status !== undefined) changes.status = data.status;
        if (!Object.keys(changes).length) return this.findOrgAcademicSessionById(orgId, id);
        changes.updated_at = knexConnection.fn.now();
        return knexConnection.transaction(async (trx) => {
            if (data.status === 1) {
                await trx('academic_sessions_table')
                    .where({ org_id: orgId, status: 1 })
                    .whereNot({ id })
                    .update({ status: 0, updated_at: knexConnection.fn.now() });
            }
            const [session] = await trx('academic_sessions_table')
                .where({ id, org_id: orgId })
                .update(changes)
                .returning(academicSessionColumns);
            return session;
        });
    }

    async findOrgAcademicSessionList(orgId: string): Promise<OrgAcademicSessionDto[]> {
        const organisation = await knexConnection('organisations').where({ id: orgId }).first('id');
        if (!organisation) throw new NotFoundException('Organisation not found');
        return knexConnection('academic_sessions_table')
            .where({ org_id: orgId })
            .select(academicSessionColumns)
            .orderBy([{ column: 'status', order: 'desc' }, { column: 'start_date', order: 'desc' }]);
    }

    async findOrgAcademicSessionById(orgId: string, id: string): Promise<OrgAcademicSessionDto> {
        const session = await knexConnection('academic_sessions_table')
            .where({ id, org_id: orgId })
            .select(academicSessionColumns)
            .first();
        if (!session) throw new NotFoundException('Academic session not found for this organisation');
        return session;
    }

    private assertValidBatchDates(startDate: string | Date, endDate: string | Date): void {
        const start = new Date(startDate).getTime();
        const end = new Date(endDate).getTime();
        if (Number.isNaN(start) || Number.isNaN(end) || end < start) {
            throw new BadRequestException('Batch end date must be on or after start date');
        }
    }

    async createClassBatch(data: CreateClassBatchDto): Promise<ClassBatchDto> {
        const { organisation, branch } = await this.validateSessionScope(data.orgId, data.branchId, data.academicSessionId, true);
        if (organisation.type !== OrganisationType.COACHING || branch.type !== OrganisationType.COACHING) {
            throw new BadRequestException('Batches can only be created for coaching organisations');
        }
        this.assertValidBatchDates(data.startDate, data.endDate);
        const classRecord = await knexConnection('classes').where({ id: data.classId, org_id: data.orgId }).first('id');
        if (!classRecord) throw new NotFoundException('Class not found for this organisation');
        const [batch] = await knexConnection('batches_table')
            .insert({
                id: randomUUID(), org_id: data.orgId, branch_id: data.branchId,
                academic_session_id: data.academicSessionId, class_id: data.classId,
                batch_code: data.batchCode, batch_name: data.batchName ?? null,
                daily_start_time: data.dailyStartTime ?? null, daily_end_time: data.dailyEndTime ?? null,
                start_date: data.startDate, end_date: data.endDate, capacity: data.capacity,
            })
            .returning(classBatchColumns);
        return batch;
    }

    async updateClassBatch(
        id: string,
        orgId: string,
        branchId: string,
        academicSessionId: string,
        data: UpdateClassBatchDto,
    ): Promise<ClassBatchDto> {
        await this.validateSessionScope(orgId, branchId, academicSessionId, true);
        const existing = await knexConnection('batches_table')
            .where({ id, org_id: orgId, branch_id: branchId, academic_session_id: academicSessionId })
            .first('id', 'start_date', 'end_date');
        if (!existing) throw new NotFoundException('Class batch not found for this organisation, branch, and academic session');
        if (data.startDate !== undefined || data.endDate !== undefined) {
            this.assertValidBatchDates(data.startDate ?? existing.start_date, data.endDate ?? existing.end_date);
        }
        const changes: Record<string, unknown> = {};
        if (data.batchCode !== undefined) changes.batch_code = data.batchCode;
        if (data.batchName !== undefined) changes.batch_name = data.batchName;
        if (data.dailyStartTime !== undefined) changes.daily_start_time = data.dailyStartTime;
        if (data.dailyEndTime !== undefined) changes.daily_end_time = data.dailyEndTime;
        if (data.startDate !== undefined) changes.start_date = data.startDate;
        if (data.endDate !== undefined) changes.end_date = data.endDate;
        if (data.capacity !== undefined) changes.capacity = data.capacity;
        if (Object.keys(changes).length) {
            changes.updated_at = knexConnection.fn.now();
            await knexConnection('batches_table')
                .where({ id, org_id: orgId, branch_id: branchId, academic_session_id: academicSessionId })
                .update(changes);
        }
        return this.findClassBatchById(id, orgId, branchId, academicSessionId);
    }

    async findClassBatchById(id: string, orgId: string, branchId: string, academicSessionId: string): Promise<ClassBatchDto> {
        const batch = await knexConnection('batches_table')
            .where({ id, org_id: orgId, branch_id: branchId, academic_session_id: academicSessionId })
            .select(classBatchColumns)
            .first();
        if (!batch) throw new NotFoundException('Class batch not found for this organisation, branch, and academic session');
        return batch;
    }

    async findClassBatchList(orgId: string, branchId: string, academicSessionId: string, classId?: string): Promise<ClassBatchDto[]> {
        await this.validateSessionScope(orgId, branchId, academicSessionId);
        return knexConnection('batches_table')
            .where({ org_id: orgId, branch_id: branchId, academic_session_id: academicSessionId })
            .modify((query) => { if (classId) query.where('class_id', classId); })
            .select(classBatchColumns)
            .orderBy('created_at', 'desc');
    }

    private async validateSessionScope(
        orgId: string,
        branchId: string,
        academicSessionId: string,
        requireActiveSession = false,
    ): Promise<{ organisation: { id: string; type: number }; branch: { id: string; type: number } }> {
        const [organisation, branch, academicSession] = await Promise.all([
            knexConnection('organisations').where({ id: orgId }).first('id', 'type'),
            knexConnection('branches').where({ id: branchId, org_id: orgId }).first('id', 'type'),
            knexConnection('academic_sessions_table').where({ id: academicSessionId, org_id: orgId }).first('id', 'status'),
        ]);
        if (!organisation) throw new NotFoundException('Organisation not found');
        if (!branch) throw new NotFoundException('Branch not found for this organisation');
        if (!academicSession) throw new NotFoundException('Academic session not found for this organisation');
        if (requireActiveSession && academicSession.status !== 1) {
            throw new BadRequestException('Changes can only be made for the active academic session');
        }
        return { organisation, branch };
    }

    async createClassSection(data: CreateClassSectionDto): Promise<ClassSectionDto> {
        const branch = await knexConnection('branches').where({ id: data.branchId, org_id: data.orgId }).first('id', 'type');
        if (!branch) throw new NotFoundException('Branch not found for this organisation');
        if (branch.type !== OrganisationType.SCHOOL) throw new BadRequestException('Sections are available for school branches');
        const classRecord = await this.branchClassesQuery(data.orgId, data.branchId).where({ id: data.classId }).first('id');
        if (!classRecord) throw new NotFoundException('Class not found for this branch');
        const [section] = await knexConnection('sections_table')
            .insert({
                id: randomUUID(), class_id: data.classId, branch_id: data.branchId,
                section_code: data.sectionCode,
                capacity: data.capacity, daily_start_time: data.dailyStartTime ?? null,
                daily_end_time: data.dailyEndTime ?? null,
            })
            .returning(['id', 'class_id as classId', 'branch_id as branchId',
                'section_code as sectionCode', 'capacity', 'daily_start_time as dailyStartTime', 'daily_end_time as dailyEndTime',
                'status', 'created_at as createdAt', 'updated_at as updatedAt']);
        return { ...section, orgId: data.orgId };
    }

    async updateClassSection(
        id: string,
        orgId: string,
        branchId: string,
        data: UpdateClassSectionDto,
    ): Promise<ClassSectionDto> {
        const existing = await knexConnection('sections_table as s')
            .join('classes as c', 's.class_id', 'c.id')
            .where({ 's.id': id, 's.branch_id': branchId, 'c.org_id': orgId })
            .first('s.id');
        if (!existing) throw new NotFoundException('Class section not found for this organisation and branch');
        const changes: Record<string, unknown> = {};
        if (data.sectionCode !== undefined) changes.section_code = data.sectionCode;
        if (data.capacity !== undefined) changes.capacity = data.capacity;
        if (data.dailyStartTime !== undefined) changes.daily_start_time = data.dailyStartTime;
        if (data.dailyEndTime !== undefined) changes.daily_end_time = data.dailyEndTime;
        if (Object.keys(changes).length) {
            changes.updated_at = knexConnection.fn.now();
            await knexConnection('sections_table').where({ id }).update(changes);
        }
        return this.findClassSectionById(id, orgId, branchId);
    }

    async findClassSectionById(id: string, orgId: string, branchId: string): Promise<ClassSectionDto> {
        const section = await knexConnection('sections_table as s')
            .join('classes as c', 's.class_id', 'c.id')
            .where({ 's.id': id, 's.branch_id': branchId, 'c.org_id': orgId })
            .select(classSectionColumns)
            .first();
        if (!section) throw new NotFoundException('Class section not found for this organisation and branch');
        return section;
    }

    async findClassSectionList(orgId: string, branchId: string, classId?: string): Promise<ClassSectionDto[]> {
        return knexConnection('sections_table as s')
            .join('classes as c', 's.class_id', 'c.id')
            .where({ 'c.org_id': orgId, 's.branch_id': branchId })
            .modify((query) => { if (classId) query.where('s.class_id', classId); })
            .select(classSectionColumns)
            .orderBy('s.created_at', 'desc');
    }

    async createClass(data: CreateClassDto): Promise<ClassDto> {
        const organisation = await knexConnection('organisations').where({ id: data.orgId }).first('id');
        if (!organisation) throw new NotFoundException('Organisation not found');
        const [createdClass] = await knexConnection('classes')
            .insert({
                id: randomUUID(), org_id: data.orgId, class_name: data.className,
                class_code: data.classCode, description: data.description ?? null,
            })
            .returning(classColumns);
        return createdClass;
    }

    async createBranchClass(orgId: string, branchId: string, data: Omit<CreateClassDto, 'orgId'>): Promise<ClassDto> {
        const branch = await knexConnection('branches').where({ id: branchId, org_id: orgId }).first('id');
        if (!branch) throw new NotFoundException('Branch not found for this organisation');
        return knexConnection.transaction(async (trx) => {
            const [created] = await trx('classes').insert({
                id: randomUUID(), org_id: orgId, class_name: data.className,
                class_code: data.classCode, description: data.description ?? null,
            }).returning(classColumns);
            await trx('branch_classes_table').insert({ id: randomUUID(), org_id: orgId, branch_id: branchId, class_id: created.id });
            return created;
        });
    }

    async updateBranchClass(orgId: string, branchId: string, id: string, data: UpdateClassDto): Promise<ClassDto> {
        const mapping = await knexConnection('branch_classes_table').where({ org_id: orgId, branch_id: branchId, class_id: id }).first('id');
        if (!mapping) throw new NotFoundException('Class not found for this branch');
        const changes: Record<string, unknown> = {};
        if (data.className !== undefined) changes.class_name = data.className;
        if (data.classCode !== undefined) changes.class_code = data.classCode;
        if (data.description !== undefined) changes.description = data.description;
        if (Object.keys(changes).length) {
            changes.updated_at = knexConnection.fn.now();
            await knexConnection('classes').where({ id, org_id: orgId }).update(changes);
        }
        return this.findClassById(id);
    }

    async updateClass(id: string, data: UpdateClassDto): Promise<ClassDto> {
        const changes: Record<string, unknown> = {};
        if (data.className !== undefined) changes.class_name = data.className;
        if (data.classCode !== undefined) changes.class_code = data.classCode;
        if (data.description !== undefined) changes.description = data.description;
        if (Object.keys(changes).length === 0) return this.findClassById(id);
        changes.updated_at = knexConnection.fn.now();
        const [updatedClass] = await knexConnection('classes').where({ id }).update(changes).returning(classColumns);
        if (!updatedClass) throw new NotFoundException('Class not found');
        return updatedClass;
    }

    async findClassById(id: string): Promise<ClassDto> {
        const foundClass = await knexConnection('classes').where({ id }).select(classColumns).first();
        if (!foundClass) throw new NotFoundException('Class not found');
        return foundClass;
    }

    async findClassListByOrgId(orgId: string): Promise<ClassDto[]> {
        const organisation = await knexConnection('organisations').where({ id: orgId }).first('id');
        if (!organisation) throw new NotFoundException('Organisation not found');
        return knexConnection('classes').where({ org_id: orgId }).select(classColumns).orderBy('created_at', 'desc');
    }

    async teachingClasses(orgId: string, branchId: string, userId: string): Promise<TeachingClassDto[]> {
        const sectionAssignments = knexConnection('section_subjects_table as ss')
            .join('sections_table as sec', 'sec.id', 'ss.section_id')
            .join('classes as c', 'c.id', 'sec.class_id')
            .join('subjects_table as sub', 'sub.id', 'ss.subject_id')
            .join('academic_sessions_table as ses', 'ses.id', 'ss.academic_session_id')
            .where({
                'ss.teacher_user_id': userId,
                'sec.branch_id': branchId,
                'c.org_id': orgId,
                'sub.organisation_id': orgId,
                'ses.org_id': orgId,
                'ses.status': 1,
            })
            .select(
                'ss.id',
                'c.id as classId',
                'c.class_name as className',
                'c.class_code as classCode',
                knexConnection.raw(`'section' as "groupType"`),
                'sec.id as groupId',
                'sec.section_code as groupName',
                'sec.section_code as groupCode',
                'sub.id as subjectId',
                'sub.subject_name as subjectName',
                'sub.subject_code as subjectCode',
                'ses.id as academicSessionId',
                'ses.session_name as sessionName',
                'ss.start_time as startTime',
                'ss.end_time as endTime',
            );

        const batchAssignments = knexConnection('batch_subjects_table as bs')
            .join('batches_table as b', 'b.id', 'bs.batch_id')
            .join('classes as c', 'c.id', 'b.class_id')
            .join('subjects_table as sub', 'sub.id', 'bs.subject_id')
            .join('academic_sessions_table as ses', 'ses.id', 'bs.academic_session_id')
            .where({
                'bs.teacher_user_id': userId,
                'b.org_id': orgId,
                'b.branch_id': branchId,
                'c.org_id': orgId,
                'sub.organisation_id': orgId,
                'ses.org_id': orgId,
                'ses.status': 1,
            })
            .select(
                'bs.id',
                'c.id as classId',
                'c.class_name as className',
                'c.class_code as classCode',
                knexConnection.raw(`'batch' as "groupType"`),
                'b.id as groupId',
                'b.batch_name as groupName',
                'b.batch_code as groupCode',
                'sub.id as subjectId',
                'sub.subject_name as subjectName',
                'sub.subject_code as subjectCode',
                'ses.id as academicSessionId',
                'ses.session_name as sessionName',
                'bs.start_time as startTime',
                'bs.end_time as endTime',
            );

        const [sections, batches] = await Promise.all([sectionAssignments, batchAssignments]);
        return [...sections, ...batches].sort((a, b) =>
            a.className.localeCompare(b.className)
            || a.groupName.localeCompare(b.groupName)
            || (a.startTime ?? '').localeCompare(b.startTime ?? '')
            || a.subjectName.localeCompare(b.subjectName),
        );
    }

    async findClassListByBranch(orgId: string, branchId: string, classId?: string): Promise<ClassDto[]> {
        const branch = await knexConnection('branches').where({ id: branchId, org_id: orgId }).first('id');
        if (!branch) throw new NotFoundException('Branch not found for this organisation');

        return this.branchClassesQuery(orgId, branchId)
            .modify((query) => { if (classId) query.where('id', classId); })
            .select(classColumns)
            .orderBy('created_at', 'desc');
    }

    private branchClassesQuery(orgId: string, branchId: string) {
        const mappedClassIds = knexConnection('branch_classes_table').select('class_id').where({ org_id: orgId, branch_id: branchId });
        const sectionClassIds = knexConnection('sections_table')
            .select('class_id')
            .where({ branch_id: branchId });
        const batchClassIds = knexConnection('batches_table')
            .select('class_id')
            .where({ org_id: orgId, branch_id: branchId });

        return knexConnection('classes')
            .where({ org_id: orgId })
            .whereIn('id', mappedClassIds.union(sectionClassIds).union(batchClassIds));
    }

    async createBranch(data: CreateBranchDto): Promise<BranchDto> {
        const organisation = await knexConnection('organisations').where({ id: data.orgId }).first('id');
        if (!organisation) throw new NotFoundException('Organisation not found');
        const [branch] = await knexConnection('branches')
            .insert({
                id: randomUUID(), org_id: data.orgId, branch_name: data.branchName, branch_code: data.branchCode,
                type: data.type, email_id: data.emailId.toLowerCase(), phone_number: data.phoneNumber ?? null,
                address: data.address ?? null,
            })
            .returning(branchColumns);
        return branch;
    }

    async updateBranch(id: string, data: UpdateBranchDto): Promise<BranchDto> {
        const changes: Record<string, unknown> = {};
        if (data.branchName !== undefined) changes.branch_name = data.branchName;
        if (data.branchCode !== undefined) changes.branch_code = data.branchCode;
        if (data.type !== undefined) changes.type = data.type;
        if (data.emailId !== undefined) changes.email_id = data.emailId.toLowerCase();
        if (data.phoneNumber !== undefined) changes.phone_number = data.phoneNumber;
        if (data.address !== undefined) changes.address = data.address;
        if (Object.keys(changes).length === 0) return this.findBranchById(id);
        changes.updated_at = knexConnection.fn.now();
        const [branch] = await knexConnection('branches').where({ id }).update(changes).returning(branchColumns);
        if (!branch) throw new NotFoundException('Branch not found');
        return branch;
    }

    async findBranchById(id: string): Promise<BranchDto> {
        const branch = await knexConnection('branches').where({ id }).select(branchColumns).first();
        if (!branch) throw new NotFoundException('Branch not found');
        return branch;
    }

    async findBranchListByOrgId(orgId: string): Promise<BranchDto[]> {
        const organisation = await knexConnection('organisations').where({ id: orgId }).first('id');
        if (!organisation) throw new NotFoundException('Organisation not found');
        return knexConnection('branches').where({ org_id: orgId }).select(branchColumns).orderBy('created_at', 'desc');
    }

    private organisationStaffQuery(orgId: string, branchId?: string) {
        return knexConnection('organisation_staff_table as s')
            .join('users_table as u', function () {
                this.on('s.user_id', 'u.id').andOn('s.org_id', 'u.org_id');
            })
            .where('s.org_id', orgId)
            .whereNot('s.status', 2)
            .modify(query => {
                if (branchId) {
                    const scopes = ['org_id', 'user_id', 'branch_id'];
                    const roles = knexConnection('user_roles_table').where({ org_id: orgId, branch_id: branchId, is_deleted: false })
                        .distinctOn(scopes).select(...scopes, 'is_active').orderBy(scopes).orderBy('is_active', 'desc');
                    query.join(roles.as('m'), function () {
                    this.on('m.org_id', 's.org_id').andOn('m.user_id', 's.user_id');
                });
                }
            })
            .select(
                's.id', 's.user_id as userId', 'u.first_name as firstName', 'u.last_name as lastName',
                'u.email_id as emailId', 'u.phone_number as phoneNumber', branchId ? 'm.branch_id as branchId' : 's.branch_id as branchId',
                's.designation', branchId ? 'm.is_active as status' : 's.status',
            );
    }

    async findOrganisationStaff(orgId: string, branchId?: string): Promise<OrganisationStaffDto[]> {
        const rows = await this.organisationStaffQuery(orgId, branchId).orderBy('u.first_name');
        return rows.map((row: OrganisationStaffDto) => ({ ...row, status: Number(row.status) }));
    }

    async findOrganisationStaffPage(orgId: string, { branchId, roleId, page, pageSize }: StaffPageQueryDto): Promise<OrganisationStaffPageDto> {
        const studentRoles = knexConnection('user_roles_table as ur')
            .join('roles_table as r', 'r.id', 'ur.role_id')
            .where('ur.user_id', knexConnection.ref('s.user_id'))
            .where('r.role_name', 'student')
            .where((scope) => scope.where('ur.org_id', orgId).orWhereNull('ur.org_id'));
        const staff = this.organisationStaffQuery(orgId, branchId).whereNotExists(studentRoles);
        if (roleId) {
            const usersWithRole = knexConnection('user_roles_table as ur')
                .join('roles_table as r', 'r.id', 'ur.role_id')
                .where({ 'ur.org_id': orgId, 'r.id': roleId, 'r.role_type': RoleType.BRANCH_LEVEL })
                .modify(query => { if (branchId) query.where('ur.branch_id', branchId); })
                .select('ur.user_id');
            staff.whereIn('s.user_id', usersWithRole);
        }
        const [count, items] = await Promise.all([
            staff.clone().clearSelect().count('* as total').first(),
            staff.orderBy(['u.first_name', 'u.last_name', 's.id']).limit(pageSize).offset((page - 1) * pageSize),
        ]);
        return { items: items.map((row: OrganisationStaffDto) => ({ ...row, status: Number(row.status) })), total: Number(count?.total ?? 0), page, pageSize };
    }

    async addOrganisationStaff(data: AddOrganisationStaffDto): Promise<OrganisationStaffDto> {
        if (!data.firstName?.trim() || !data.lastName?.trim() || !data.designation?.trim() || !data.emailId?.trim() || !data.joiningDate) {
            throw new BadRequestException('First name, last name, email, designation, and joining date are required');
        }
        const trx = await knexConnection.transaction();
        try {
            const branch = await trx('branches').where({ id: data.branchId, org_id: data.orgId }).first('id');
            if (!branch) throw new NotFoundException('Branch not found for this organisation');
            const role = await trx('roles_table').where({ id: data.roleId, role_type: RoleType.BRANCH_LEVEL }).whereNot('role_name', 'student').first('id');
            if (!role) throw new BadRequestException('Select a valid branch-level role');
            let user = await trx('users_table').whereRaw('lower(email_id) = lower(?)', [data.emailId]).first('id', 'org_id as orgId');
            if (user && user.orgId !== data.orgId) throw new ConflictException('A user with this email already exists outside this organisation');
            if (!user) {
                const [createdUser] = await trx('users_table').insert({
                    id: randomUUID(), first_name: data.firstName, last_name: data.lastName,
                    email_id: data.emailId.toLowerCase(), password_hash: await bcrypt.hash('Password@123', 10),
                    phone_number: data.phoneNumber ?? null, org_id: data.orgId,
                }).returning(['id', 'org_id as orgId']);
                user = createdUser;
            }
            const person = { org_id: data.orgId, user_id: user.id };
            const scope = { ...person, branch_id: data.branchId };
            await trx('organisation_staff_table').insert({
                id: randomUUID(), ...scope, designation: data.designation,
                joining_date: data.joiningDate, status: 1,
            }).onConflict(['org_id', 'user_id']).ignore();
            const profile = await trx('organisation_staff_table').where(person).forUpdate().first('id', 'status');
            if (profile.status !== 1) throw new ConflictException('Staff profile is inactive');
            const membership = await trx('user_roles_table').where(scope).orderBy('is_active', 'desc').first('is_active');
            if (membership && !membership.is_active) throw new ConflictException('Branch membership is inactive');
            await trx('user_roles_table').insert({ id: randomUUID(), ...scope, role_id: role.id }).onConflict().ignore();
            const staff = await this.organisationStaffQuery(data.orgId, data.branchId)
                .transacting(trx).where('s.id', profile.id).first();
            await trx.commit();
            return { ...staff, status: Number(staff.status) };
        } catch (error) {
            await trx.rollback();
            throw error;
        }
    }

    async updateOrganisationStaff(data: UpdateOrganisationStaffDto, managerBranchId?: string): Promise<OrganisationStaffDto> {
        if (data.status !== undefined && (![0, 1, 2].includes(data.status) || !Number.isInteger(data.status))) {
            throw new BadRequestException('Staff status must be INACTIVE (0), ACTIVE (1), or DELETED (2)');
        }
        if (data.designation !== undefined && typeof data.designation !== 'string') {
            throw new BadRequestException('Designation must be a string');
        }
        return knexConnection.transaction(async (trx) => {
            const { orgId, staffId } = data;
            const existing = await trx('organisation_staff_table')
                .where({ id: staffId, org_id: orgId })
                .forUpdate().first('id', 'user_id', 'status');
            if (!existing) throw new NotFoundException('Staff member not found for this organisation');
            if (managerBranchId) {
                if (data.designation !== undefined || (data.branchId !== undefined && data.branchId !== managerBranchId)) {
                    throw new ForbiddenException('Shared employment changes require organisation authority');
                }
                const scope = { org_id: orgId, user_id: existing.user_id, branch_id: managerBranchId };
                const staff = await this.organisationStaffQuery(orgId, managerBranchId).transacting(trx).where('s.id', staffId).first();
                if (!staff) throw new ForbiddenException('You do not have access to this staff member');
                if (data.status !== undefined) await trx('user_roles_table').where(scope)
                    .update({ is_active: data.status === 1, is_deleted: data.status === 2 });
                return { ...staff, status: data.status ?? Number(staff.status) };
            }
            if (data.branchId) {
                const branch = await trx('branches').where({ id: data.branchId, org_id: orgId }).first('id');
                if (!branch) throw new NotFoundException('Branch not found for this organisation');
            }
            const changes: Record<string, unknown> = {};
            if (data.status !== undefined) changes.status = data.status;
            if (data.designation !== undefined) changes.designation = data.designation;
            if (data.branchId !== undefined) changes.branch_id = data.branchId;
            if (Object.keys(changes).length) {
                changes.updated_at = trx.fn.now();
                await trx('organisation_staff_table').where({ id: staffId, org_id: orgId }).update(changes);
            }
            const staff = await trx('organisation_staff_table as s')
                .join('users_table as u', 's.user_id', 'u.id')
                .where({ 's.org_id': orgId, 's.id': staffId })
                .first(
                    's.id', 's.user_id as userId', 'u.first_name as firstName', 'u.last_name as lastName',
                    'u.email_id as emailId', 'u.phone_number as phoneNumber', 's.branch_id as branchId',
                    's.designation', 's.status',
                );
            return staff;
        });
    }

    async getBranchSummary(orgId: string, branchId: string, countsOnly = false) {
        const branch = await knexConnection('branches').where({ id: branchId, org_id: orgId }).select(branchColumns).first();
        if (!branch) throw new NotFoundException('Branch not found');
        const classes = this.branchClassesQuery(orgId, branchId);
        const [staffCount, studentCount, classData] = await Promise.all([
            this.organisationStaffQuery(orgId, branchId).clearSelect().count('* as count').first(),
            knexConnection('organisation_student_table').where({ org_id: orgId, branch_id: branchId, status: 1 }).countDistinct('user_id as count').first(),
            countsOnly
                ? classes.count('* as count').first().then((row) => ({ classCount: Number(row?.count ?? 0) }))
                : classes.select('id', 'class_name as className', 'class_code as classCode').then((rows) => ({
                    classes: rows.sort((a, b) => a.className.localeCompare(b.className)),
                })),
        ]);
        return { branch, staffCount: Number(staffCount?.count ?? 0), studentCount: Number(studentCount?.count ?? 0), ...classData };
    }

    async createOrg(data: CreateOrganisationDto): Promise<OrganisationDto> {
        const [organisation] = await knexConnection('organisations')
            .insert({
                id: randomUUID(), name: data.name, tagline: data.tagline ?? null, type: data.type,
                email_id: data.emailId.toLowerCase(), phone_number: data.phoneNumber ?? null,
                logo: data.logo ?? null, address: data.address ?? null,
            })
            .returning(organisationColumns);
        return organisation;
    }

    async getOrganisationCounts(orgId: string): Promise<{ branchCount: number; staffCount: number }> {
        const [branches, staff] = await Promise.all([
            knexConnection('branches').where({ org_id: orgId }).count('* as count').first(),
            knexConnection('organisation_staff_table as s')
                .join('users_table as u', 's.user_id', 'u.id')
                .where('s.org_id', orgId)
                .whereNot('s.status', 2)
                .count('* as count').first(),
        ]);
        return { branchCount: Number(branches?.count ?? 0), staffCount: Number(staff?.count ?? 0) };
    }

    async findOrgById(id: string): Promise<OrganisationDto> {
        const organisation = await knexConnection('organisations').where({ id }).select(organisationColumns).first();
        if (!organisation) throw new NotFoundException('Organisation not found');
        return organisation;
    }

    async findOrganisationList(): Promise<OrganisationDto[]> {
        return knexConnection('organisations').select(organisationColumns).orderBy('created_at', 'desc');
    }

    async findOrganisationAdmins(orgId: string): Promise<OrganisationAdminDto[]> {
        return knexConnection('users_table as u')
            .join('user_roles_table as ur', function joinOrganisationRole() {
                this.on('ur.user_id', '=', 'u.id').andOn('ur.org_id', '=', 'u.org_id');
            })
            .join('roles_table as r', 'r.id', 'ur.role_id')
            .where('u.org_id', orgId)
            .andWhere('r.role_name', 'org_admin')
            .distinct('u.id', 'u.first_name as firstName', 'u.last_name as lastName', 'u.email_id as emailId', 'u.phone_number as phoneNumber', 'u.org_id as orgId')
            .orderBy('u.first_name', 'asc');
    }

    async updateOrg(id: string, data: UpdateOrganisationDto): Promise<OrganisationDto> {
        const changes: Record<string, unknown> = {};
        if (data.name !== undefined) changes.name = data.name;
        if (data.tagline !== undefined) changes.tagline = data.tagline;
        if (data.type !== undefined) changes.type = data.type;
        if (data.emailId !== undefined) changes.email_id = data.emailId.toLowerCase();
        if (data.phoneNumber !== undefined) changes.phone_number = data.phoneNumber;
        if (data.logo !== undefined) changes.logo = data.logo;
        if (data.address !== undefined) changes.address = data.address;
        if (Object.keys(changes).length === 0) return this.findOrgById(id);

        changes.updated_at = knexConnection.fn.now();
        const [organisation] = await knexConnection('organisations').where({ id }).update(changes).returning(organisationColumns);
        if (!organisation) throw new NotFoundException('Organisation not found');
        return organisation;
    }
}
