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
import { AddStudentToOrgDto, AddStudentToOrgResultDto } from './dtos/add-student-to-org.dto';

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

            const [student] = await trx('organisation_student_table').insert({
                id: studentId,
                academic_session_id: data.academicSessionId,
                org_id: orgId,
                branch_id: data.branchId,
                user_id: userId,
                class_id: data.classId,
                section_id: data.sectionId ?? null,
                batch_id: data.batchId ?? null,
                enrollment_number: data.enrollmentNumber,
                enrollment_date: data.enrollmentDate,
            }).returning([
                'id', 'academic_session_id as academicSessionId', 'org_id as orgId',
                'branch_id as branchId', 'user_id as userId', 'class_id as classId',
                'section_id as sectionId', 'batch_id as batchId', 'enrollment_number as enrollmentNumber',
                'enrollment_date as enrollmentDate', 'status', 'created_at as createdAt', 'updated_at as updatedAt',
            ]);
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

    async findClassBatchList(orgId: string, branchId: string, academicSessionId: string): Promise<ClassBatchDto[]> {
        await this.validateClassSectionScope(orgId, branchId, academicSessionId);
        return knexConnection('batches_table')
            .where({ org_id: orgId, branch_id: branchId, academic_session_id: academicSessionId })
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

    async findClassSectionList(orgId: string, branchId: string, academicSessionId: string): Promise<ClassSectionDto[]> {
        await this.validateClassSectionScope(orgId, branchId, academicSessionId);
        return knexConnection('sections_table as s')
            .join('classes as c', 's.class_id', 'c.id')
            .where({ 'c.org_id': orgId, 's.branch_id': branchId, 's.academic_session_id': academicSessionId })
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

    async getBranchSummary(orgId: string, branchId: string) {
        const branch = await knexConnection('branches').where({ id: branchId, org_id: orgId }).select(branchColumns).first();
        if (!branch) throw new NotFoundException('Branch not found');
        const [staffCount, studentCount, sectionClasses, batchClasses] = await Promise.all([
            knexConnection('organisation_staff_table').where({ org_id: orgId, branch_id: branchId }).count('* as count').first(),
            knexConnection('organisation_student_table').where({ org_id: orgId, branch_id: branchId, status: 1 }).count('* as count').first(),
            knexConnection('classes as c').join('sections_table as s', 's.class_id', 'c.id')
                .where({ 'c.org_id': orgId, 's.branch_id': branchId }).distinct('c.id', 'c.class_name as className', 'c.class_code as classCode')
                .orderBy('c.class_name'),
            knexConnection('classes as c').join('batches_table as b', 'b.class_id', 'c.id')
                .where({ 'c.org_id': orgId, 'b.branch_id': branchId }).distinct('c.id', 'c.class_name as className', 'c.class_code as classCode')
                .orderBy('c.class_name'),
        ]);
        const classes = [...new Map([...sectionClasses, ...batchClasses].map((item) => [item.id, item])).values()]
            .sort((a, b) => a.className.localeCompare(b.className));
        return { branch, staffCount: Number(staffCount?.count ?? 0), studentCount: Number(studentCount?.count ?? 0), classes };
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
