import {
    BadRequestException, ConflictException, HttpException, Injectable,
    InternalServerErrorException, NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import knexConnection from '../../db/connector/knex';
import { CreateOrganisationDto, OrganisationAdminDto, OrganisationDto, UpdateOrganisationDto } from './dtos/organisation.dto';
import { BranchDto, CreateBranchDto, UpdateBranchDto } from './dtos/branch.dto';
import { ClassDto, CreateClassDto, UpdateClassDto } from './dtos/class.dto';
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
    CreateSectionSubjectMappingDto, SectionSubjectMappingDto, UpdateSectionSubjectMappingDto,
} from './dtos/section-subject-mapping.dto';
import {
    BatchSubjectMappingDto, CreateBatchSubjectMappingDto, UpdateBatchSubjectMappingDto,
} from './dtos/batch-subject-mapping.dto';
import { StudentListQueryDto, StudentListPage, StudentGroupType, AddStudentToOrgDto, AddStudentToOrgResultDto } from './dtos/add-student-to-org.dto';
import { AddOrganisationStaffDto, OrganisationStaffDto, UpdateOrganisationStaffDto } from './dtos/organisation-staff.dto';
import { RoleType } from '../../utils/enums/roleType';

const organisationColumns = [
    'id', 'name', 'tagline', 'type', 'email_id as emailId', 'phone_number as phoneNumber',
    'logo', 'address', 'status', 'created_at as createdAt', 'updated_at as updatedAt',
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
    's.academic_session_id as academicSessionId', 's.class_id as classId',
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
    'end_date as endDate', 'created_at as createdAt', 'updated_at as updatedAt',
];

const subjectColumns = [
    'id', 'organisation_id as orgId', 'subject_name as subjectName', 'subject_code as subjectCode',
    'description', 'status', 'created_at as createdAt', 'updated_at as updatedAt',
];

@Injectable()
export class OrganisationsRepository {
    async getStudentList(orgId: string, branchId: string, groupType: StudentGroupType, groupId: string, query: StudentListQueryDto): Promise<StudentListPage> {
        const section = groupType === StudentGroupType.Sections;
        const groupRow = await knexConnection(section ? 'sections_table as g' : 'batches_table as g')
            .join('classes as c', 'c.id', 'g.class_id')
            .where({ 'g.id': groupId, 'g.branch_id': branchId, 'c.org_id': orgId })
            .first('g.class_id as classId', 'c.class_name as className', 'g.academic_session_id as academicSessionId',
                ...(section ? ['g.section_code as code'] : ['g.batch_code as code', 'g.batch_name as batchName']));
        if (!groupRow) throw new NotFoundException('Class group not found in this branch');
        const { code, batchName, ...group } = groupRow;
        const list = knexConnection('organisation_student_table as s')
            .join('users_table as u', 'u.id', 's.user_id')
            .where({ 's.org_id': orgId, 's.branch_id': branchId, [section ? 's.section_id' : 's.batch_id']: groupId, 's.status': 1 });
        const count = await list.clone().count('* as total').first();
        const total = Number(count?.total ?? 0);
        const { pageSize } = query;
        const page = Math.min(query.page, Math.max(1, Math.ceil(total / pageSize)));
        const students = await list.orderBy(['u.first_name', 'u.last_name', 's.enrollment_number', 's.id'])
            .limit(pageSize).offset((page - 1) * pageSize)
            .select('s.id', 's.user_id as userId', 's.enrollment_number as enrollmentNumber', 'u.first_name as firstName',
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
        return { group: { ...group, name: section ? `Section ${code}` : batchName || code }, items, total, page, pageSize };
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
                trx('academic_sessions_table').where({ id: data.academicSessionId, org_id: orgId }).first('id'),
                trx('classes').where({ id: data.classId, org_id: orgId }).first('id'),
            ]);
            if (!branch) throw new NotFoundException('Branch not found for this organisation');
            if (!session) throw new NotFoundException('Academic session not found for this organisation');
            if (!classRecord) throw new NotFoundException('Class not found for this organisation');

            if (data.sectionId) {
                const section = await trx('sections_table').where({
                    id: data.sectionId,
                    class_id: data.classId,
                    branch_id: data.branchId,
                    academic_session_id: data.academicSessionId,
                }).first('id');
                if (!section) throw new NotFoundException('Section not found for this class, branch, and academic session');
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

    async createSectionSubjectMapping(data: CreateSectionSubjectMappingDto): Promise<SectionSubjectMappingDto> {
        await this.validateClassSectionScope(data.orgId, data.branchId, data.academicSessionId);
        const subject = await knexConnection('subjects_table').where({ id: data.subjectId, organisation_id: data.orgId }).first('id');
        if (!subject) throw new NotFoundException('Subject not found for this organisation');
        const section = await knexConnection('sections_table as s')
            .join('classes as c', 's.class_id', 'c.id')
            .where({
                's.id': data.sectionId, 's.branch_id': data.branchId,
                's.academic_session_id': data.academicSessionId, 'c.org_id': data.orgId
            })
            .first('s.id');
        if (!section) throw new NotFoundException('Section not found for this organisation, branch, and academic session');
        const [mapping] = await knexConnection('section_subjects_table')
            .insert({ id: randomUUID(), section_id: data.sectionId, subject_id: data.subjectId, teacher_user_id: null })
            .returning(['id', 'section_id as sectionId', 'subject_id as subjectId', 'teacher_user_id as teacherUserId',
                'created_at as createdAt', 'updated_at as updatedAt']);
        return { ...mapping, orgId: data.orgId, branchId: data.branchId, academicSessionId: data.academicSessionId };
    }

    async updateSectionSubjectMapping(
        orgId: string, branchId: string, academicSessionId: string, id: string,
        data: UpdateSectionSubjectMappingDto,
    ): Promise<SectionSubjectMappingDto> {
        await this.validateClassSectionScope(orgId, branchId, academicSessionId);
        const current = await knexConnection('section_subjects_table as ss')
            .join('sections_table as s', 'ss.section_id', 's.id')
            .join('classes as c', 's.class_id', 'c.id')
            .where({ 'ss.id': id, 's.branch_id': branchId, 's.academic_session_id': academicSessionId, 'c.org_id': orgId })
            .first('ss.section_id as sectionId', 'ss.subject_id as subjectId');
        if (!current) throw new NotFoundException('Section subject mapping not found in this context');
        const sectionId = data.sectionId ?? current.sectionId;
        const subjectId = data.subjectId ?? current.subjectId;
        const subject = await knexConnection('subjects_table').where({ id: subjectId, organisation_id: orgId }).first('id');
        if (!subject) throw new NotFoundException('Subject not found for this organisation');
        const section = await knexConnection('sections_table as s')
            .join('classes as c', 's.class_id', 'c.id')
            .where({ 's.id': sectionId, 's.branch_id': branchId, 's.academic_session_id': academicSessionId, 'c.org_id': orgId })
            .first('s.id');
        if (!section) throw new NotFoundException('Section not found in this context');
        if (data.sectionId !== undefined || data.subjectId !== undefined) {
            await knexConnection('section_subjects_table').where({ id }).update({
                section_id: sectionId, subject_id: subjectId,
                updated_at: knexConnection.fn.now(),
            });
        }
        const [mapping] = await knexConnection('section_subjects_table')
            .where({ id }).select('id', 'section_id as sectionId', 'subject_id as subjectId',
                'teacher_user_id as teacherUserId', 'created_at as createdAt', 'updated_at as updatedAt');
        return { ...mapping, orgId, branchId, academicSessionId };
    }

    async createBatchSubjectMapping(data: CreateBatchSubjectMappingDto): Promise<BatchSubjectMappingDto> {
        await this.validateClassSectionScope(data.orgId, data.branchId, data.academicSessionId);
        const subject = await knexConnection('subjects_table').where({ id: data.subjectId, organisation_id: data.orgId }).first('id');
        if (!subject) throw new NotFoundException('Subject not found for this organisation');
        const batch = await knexConnection('batches_table')
            .where({ id: data.batchId, org_id: data.orgId, branch_id: data.branchId, academic_session_id: data.academicSessionId })
            .first('id');
        if (!batch) throw new NotFoundException('Batch not found for this organisation, branch, and academic session');
        const [mapping] = await knexConnection('batch_subjects_table')
            .insert({ id: randomUUID(), batch_id: data.batchId, subject_id: data.subjectId, teacher_user_id: null })
            .returning(['id', 'batch_id as batchId', 'subject_id as subjectId', 'teacher_user_id as teacherUserId',
                'created_at as createdAt', 'updated_at as updatedAt']);
        return { ...mapping, orgId: data.orgId, branchId: data.branchId, academicSessionId: data.academicSessionId };
    }

    async updateBatchSubjectMapping(
        orgId: string, branchId: string, academicSessionId: string, id: string,
        data: UpdateBatchSubjectMappingDto,
    ): Promise<BatchSubjectMappingDto> {
        await this.validateClassSectionScope(orgId, branchId, academicSessionId);
        const current = await knexConnection('batch_subjects_table as bs')
            .join('batches_table as b', 'bs.batch_id', 'b.id')
            .where({ 'bs.id': id, 'b.org_id': orgId, 'b.branch_id': branchId, 'b.academic_session_id': academicSessionId })
            .first('bs.batch_id as batchId', 'bs.subject_id as subjectId');
        if (!current) throw new NotFoundException('Batch subject mapping not found in this context');
        const batchId = data.batchId ?? current.batchId;
        const subjectId = data.subjectId ?? current.subjectId;
        const subject = await knexConnection('subjects_table').where({ id: subjectId, organisation_id: orgId }).first('id');
        if (!subject) throw new NotFoundException('Subject not found for this organisation');
        const batch = await knexConnection('batches_table').where({
            id: batchId, org_id: orgId, branch_id: branchId, academic_session_id: academicSessionId,
        }).first('id');
        if (!batch) throw new NotFoundException('Batch not found in this context');
        if (data.batchId !== undefined || data.subjectId !== undefined) {
            await knexConnection('batch_subjects_table').where({ id }).update({
                batch_id: batchId, subject_id: subjectId,
                updated_at: knexConnection.fn.now(),
            });
        }
        const [mapping] = await knexConnection('batch_subjects_table')
            .where({ id }).select('id', 'batch_id as batchId', 'subject_id as subjectId',
                'teacher_user_id as teacherUserId', 'created_at as createdAt', 'updated_at as updatedAt');
        return { ...mapping, orgId, branchId, academicSessionId };
    }

    private async validateClassSubjectMapping(
        orgId: string,
        academicSessionId: string,
        classId: string,
        subjectId: string,
    ): Promise<void> {
        const [session, classRecord, subject] = await Promise.all([
            knexConnection('academic_sessions_table').where({ id: academicSessionId, org_id: orgId }).first('id'),
            knexConnection('classes').where({ id: classId, org_id: orgId }).first('id'),
            knexConnection('subjects_table').where({ id: subjectId, organisation_id: orgId }).first('id'),
        ]);
        if (!session) throw new NotFoundException('Academic session not found for this organisation');
        if (!classRecord) throw new NotFoundException('Class not found for this organisation');
        if (!subject) throw new NotFoundException('Subject not found for this organisation');
    }

    async createClassSubjectMapping(data: CreateClassSubjectMappingDto): Promise<ClassSubjectMappingDto> {
        await this.validateClassSubjectMapping(data.orgId, data.academicSessionId, data.classId, data.subjectId);
        const [mapping] = await knexConnection('class_subjects_table')
            .insert({
                id: randomUUID(), class_id: data.classId, subject_id: data.subjectId,
                academic_session_id: data.academicSessionId,
            })
            .returning(['id', 'class_id as classId', 'subject_id as subjectId',
                'academic_session_id as academicSessionId', 'created_at as createdAt', 'updated_at as updatedAt']);
        return { ...mapping, orgId: data.orgId };
    }

    async updateClassSubjectMapping(
        orgId: string,
        academicSessionId: string,
        id: string,
        data: UpdateClassSubjectMappingDto,
    ): Promise<ClassSubjectMappingDto> {
        const current = await knexConnection('class_subjects_table as cs')
            .join('classes as c', 'cs.class_id', 'c.id')
            .where({ 'cs.id': id, 'cs.academic_session_id': academicSessionId, 'c.org_id': orgId })
            .first('cs.class_id as classId', 'cs.subject_id as subjectId');
        if (!current) throw new NotFoundException('Class subject mapping not found for this organisation and academic session');

        const classId = data.classId ?? current.classId;
        const subjectId = data.subjectId ?? current.subjectId;
        await this.validateClassSubjectMapping(orgId, academicSessionId, classId, subjectId);
        if (data.classId !== undefined || data.subjectId !== undefined) {
            await knexConnection('class_subjects_table').where({ id }).update({
                class_id: classId,
                subject_id: subjectId,
                updated_at: knexConnection.fn.now(),
            });
        }

        const [mapping] = await knexConnection('class_subjects_table')
            .where({ id, academic_session_id: academicSessionId })
            .select('id', 'class_id as classId', 'subject_id as subjectId',
                'academic_session_id as academicSessionId', 'created_at as createdAt', 'updated_at as updatedAt');
        return { ...mapping, orgId };
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

    async findSubjectListByOrgId(orgId: string): Promise<SubjectDto[]> {
        const organisation = await knexConnection('organisations').where({ id: orgId }).first('id');
        if (!organisation) throw new NotFoundException('Organisation not found');
        return knexConnection('subjects_table')
            .where({ organisation_id: orgId })
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

    async createOrgAcademicSession(data: CreateOrgAcademicSessionDto): Promise<OrgAcademicSessionDto> {
        const organisation = await knexConnection('organisations').where({ id: data.orgId }).first('id');
        if (!organisation) throw new NotFoundException('Organisation not found');
        const [session] = await knexConnection('academic_sessions_table')
            .insert({
                id: randomUUID(), org_id: data.orgId, session_name: data.sessionName ?? null,
                start_date: data.startDate, end_date: data.endDate,
            })
            .returning(academicSessionColumns);
        return session;
    }

    async updateOrgAcademicSession(
        orgId: string,
        id: string,
        data: UpdateOrgAcademicSessionDto,
    ): Promise<OrgAcademicSessionDto> {
        const changes: Record<string, unknown> = {};
        if (data.sessionName !== undefined) changes.session_name = data.sessionName;
        if (data.startDate !== undefined) changes.start_date = data.startDate;
        if (data.endDate !== undefined) changes.end_date = data.endDate;
        if (!Object.keys(changes).length) return this.findOrgAcademicSessionById(orgId, id);
        changes.updated_at = knexConnection.fn.now();
        const [session] = await knexConnection('academic_sessions_table')
            .where({ id, org_id: orgId })
            .update(changes)
            .returning(academicSessionColumns);
        if (!session) throw new NotFoundException('Academic session not found for this organisation');
        return session;
    }

    async findOrgAcademicSessionList(orgId: string): Promise<OrgAcademicSessionDto[]> {
        const organisation = await knexConnection('organisations').where({ id: orgId }).first('id');
        if (!organisation) throw new NotFoundException('Organisation not found');
        return knexConnection('academic_sessions_table')
            .where({ org_id: orgId })
            .select(academicSessionColumns)
            .orderBy('start_date', 'desc');
    }

    async findOrgAcademicSessionById(orgId: string, id: string): Promise<OrgAcademicSessionDto> {
        const session = await knexConnection('academic_sessions_table')
            .where({ id, org_id: orgId })
            .select(academicSessionColumns)
            .first();
        if (!session) throw new NotFoundException('Academic session not found for this organisation');
        return session;
    }

    async createClassBatch(data: CreateClassBatchDto): Promise<ClassBatchDto> {
        await this.validateClassSectionScope(data.orgId, data.branchId, data.academicSessionId);
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
        await this.validateClassSectionScope(orgId, branchId, academicSessionId);
        const existing = await knexConnection('batches_table')
            .where({ id, org_id: orgId, branch_id: branchId, academic_session_id: academicSessionId })
            .first('id');
        if (!existing) throw new NotFoundException('Class batch not found for this organisation, branch, and academic session');
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
        await this.validateClassSectionScope(orgId, branchId, academicSessionId);
        return knexConnection('batches_table')
            .where({ org_id: orgId, branch_id: branchId, academic_session_id: academicSessionId })
            .modify((query) => { if (classId) query.where('class_id', classId); })
            .select(classBatchColumns)
            .orderBy('created_at', 'desc');
    }

    private async validateClassSectionScope(orgId: string, branchId: string, academicSessionId: string): Promise<void> {
        const [organisation, branch, academicSession] = await Promise.all([
            knexConnection('organisations').where({ id: orgId }).first('id'),
            knexConnection('branches').where({ id: branchId, org_id: orgId }).first('id'),
            knexConnection('academic_sessions_table').where({ id: academicSessionId, org_id: orgId }).first('id'),
        ]);
        if (!organisation) throw new NotFoundException('Organisation not found');
        if (!branch) throw new NotFoundException('Branch not found for this organisation');
        if (!academicSession) throw new NotFoundException('Academic session not found for this organisation');
    }

    async createClassSection(data: CreateClassSectionDto): Promise<ClassSectionDto> {
        await this.validateClassSectionScope(data.orgId, data.branchId, data.academicSessionId);
        const classRecord = await knexConnection('classes').where({ id: data.classId, org_id: data.orgId }).first('id');
        if (!classRecord) throw new NotFoundException('Class not found for this organisation');
        const [section] = await knexConnection('sections_table')
            .insert({
                id: randomUUID(), class_id: data.classId, branch_id: data.branchId,
                academic_session_id: data.academicSessionId, section_code: data.sectionCode,
                capacity: data.capacity, daily_start_time: data.dailyStartTime ?? null,
                daily_end_time: data.dailyEndTime ?? null,
            })
            .returning(['id', 'class_id as classId', 'branch_id as branchId', 'academic_session_id as academicSessionId',
                'section_code as sectionCode', 'capacity', 'daily_start_time as dailyStartTime', 'daily_end_time as dailyEndTime',
                'status', 'created_at as createdAt', 'updated_at as updatedAt']);
        return { ...section, orgId: data.orgId };
    }

    async updateClassSection(
        id: string,
        orgId: string,
        branchId: string,
        academicSessionId: string,
        data: UpdateClassSectionDto,
    ): Promise<ClassSectionDto> {
        await this.validateClassSectionScope(orgId, branchId, academicSessionId);
        const existing = await knexConnection('sections_table as s')
            .join('classes as c', 's.class_id', 'c.id')
            .where({ 's.id': id, 's.branch_id': branchId, 's.academic_session_id': academicSessionId, 'c.org_id': orgId })
            .first('s.id');
        if (!existing) throw new NotFoundException('Class section not found for this organisation, branch, and academic session');
        const changes: Record<string, unknown> = {};
        if (data.sectionCode !== undefined) changes.section_code = data.sectionCode;
        if (data.capacity !== undefined) changes.capacity = data.capacity;
        if (data.dailyStartTime !== undefined) changes.daily_start_time = data.dailyStartTime;
        if (data.dailyEndTime !== undefined) changes.daily_end_time = data.dailyEndTime;
        if (Object.keys(changes).length) {
            changes.updated_at = knexConnection.fn.now();
            await knexConnection('sections_table').where({ id }).update(changes);
        }
        return this.findClassSectionById(id, orgId, branchId, academicSessionId);
    }

    async findClassSectionById(id: string, orgId: string, branchId: string, academicSessionId: string): Promise<ClassSectionDto> {
        const section = await knexConnection('sections_table as s')
            .join('classes as c', 's.class_id', 'c.id')
            .where({ 's.id': id, 's.branch_id': branchId, 's.academic_session_id': academicSessionId, 'c.org_id': orgId })
            .select(classSectionColumns)
            .first();
        if (!section) throw new NotFoundException('Class section not found for this organisation, branch, and academic session');
        return section;
    }

    async findClassSectionList(orgId: string, branchId: string, academicSessionId: string, classId?: string): Promise<ClassSectionDto[]> {
        await this.validateClassSectionScope(orgId, branchId, academicSessionId);
        return knexConnection('sections_table as s')
            .join('classes as c', 's.class_id', 'c.id')
            .where({ 'c.org_id': orgId, 's.branch_id': branchId, 's.academic_session_id': academicSessionId })
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

    async findOrganisationStaff(orgId: string, branchId?: string): Promise<OrganisationStaffDto[]> {
        return knexConnection('organisation_staff_table as s')
            .join('users_table as u', 's.user_id', 'u.id')
            .where('s.org_id', orgId)
            .whereNot('s.status', 2)
            .modify((query) => { if (branchId) query.where('s.branch_id', branchId); })
            .select(
                's.id', 's.user_id as userId', 'u.first_name as firstName', 'u.last_name as lastName',
                'u.email_id as emailId', 'u.phone_number as phoneNumber', 's.branch_id as branchId',
                's.designation', 's.status',
            ).orderBy('u.first_name');
    }

    async addOrganisationStaff(data: AddOrganisationStaffDto): Promise<OrganisationStaffDto> {
        if (!data.firstName?.trim() || !data.lastName?.trim() || !data.designation?.trim() || !data.emailId?.trim() || !data.joiningDate) {
            throw new BadRequestException('First name, last name, email, designation, and joining date are required');
        }
        const trx = await knexConnection.transaction();
        try {
            const branch = await trx('branches').where({ id: data.branchId, org_id: data.orgId }).first('id');
            if (!branch) throw new NotFoundException('Branch not found for this organisation');
            const role = await trx('roles_table').where({ id: data.roleId, role_type: RoleType.BRANCH_LEVEL }).first('id');
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
            const existingStaff = await trx('organisation_staff_table').where({ org_id: data.orgId, user_id: user.id }).first('id');
            if (existingStaff) throw new ConflictException('This user is already a staff member of the organisation');
            await trx('user_roles_table').insert({
                id: randomUUID(), user_id: user.id, role_id: data.roleId, org_id: data.orgId,
            }).onConflict(['user_id', 'role_id', 'org_id']).ignore();
            const staffId = randomUUID();
            await trx('organisation_staff_table').insert({
                id: staffId, org_id: data.orgId, branch_id: data.branchId, user_id: user.id,
                designation: data.designation, joining_date: data.joiningDate, status: 1,
            });
            const staff = await trx('organisation_staff_table as s').join('users_table as u', 's.user_id', 'u.id')
                .where({ 's.org_id': data.orgId, 's.id': staffId })
                .first('s.id', 's.user_id as userId', 'u.first_name as firstName', 'u.last_name as lastName',
                    'u.email_id as emailId', 'u.phone_number as phoneNumber', 's.branch_id as branchId', 's.designation', 's.status');
            await trx.commit();
            return staff;
        } catch (error) {
            await trx.rollback();
            throw error;
        }
    }

    async updateOrganisationStaff(orgId: string, staffId: string, data: UpdateOrganisationStaffDto): Promise<OrganisationStaffDto> {
        if (data.status !== undefined && (![0, 1, 2].includes(data.status) || !Number.isInteger(data.status))) {
            throw new BadRequestException('Staff status must be INACTIVE (0), ACTIVE (1), or DELETED (2)');
        }
        if (data.designation !== undefined && typeof data.designation !== 'string') {
            throw new BadRequestException('Designation must be a string');
        }
        const existing = await knexConnection('organisation_staff_table').where({ id: staffId, org_id: orgId }).first('id');
        if (!existing) throw new NotFoundException('Staff member not found for this organisation');
        if (data.branchId) {
            const branch = await knexConnection('branches').where({ id: data.branchId, org_id: orgId }).first('id');
            if (!branch) throw new NotFoundException('Branch not found for this organisation');
        }
        const changes: Record<string, unknown> = {};
        if (data.status !== undefined) changes.status = data.status;
        if (data.designation !== undefined) changes.designation = data.designation;
        if (data.branchId !== undefined) changes.branch_id = data.branchId;
        if (Object.keys(changes).length) {
            changes.updated_at = knexConnection.fn.now();
            await knexConnection('organisation_staff_table').where({ id: staffId, org_id: orgId }).update(changes);
        }
        const staff = await knexConnection('organisation_staff_table as s')
            .join('users_table as u', 's.user_id', 'u.id')
            .where({ 's.org_id': orgId, 's.id': staffId })
            .first(
                's.id', 's.user_id as userId', 'u.first_name as firstName', 'u.last_name as lastName',
                'u.email_id as emailId', 'u.phone_number as phoneNumber', 's.branch_id as branchId',
                's.designation', 's.status',
            );
        return staff;
    }

    async getBranchSummary(orgId: string, branchId: string, countsOnly = false) {
        const branch = await knexConnection('branches').where({ id: branchId, org_id: orgId }).select(branchColumns).first();
        if (!branch) throw new NotFoundException('Branch not found');
        const classes = this.branchClassesQuery(orgId, branchId);
        const [staffCount, studentCount, classData] = await Promise.all([
            knexConnection('organisation_staff_table').where({ org_id: orgId, branch_id: branchId }).whereNot('status', 2).count('* as count').first(),
            knexConnection('organisation_student_table').where({ org_id: orgId, branch_id: branchId, status: 1 }).count('* as count').first(),
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
