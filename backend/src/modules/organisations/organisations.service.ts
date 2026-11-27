import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateOrganisationDto, OrganisationAdminDto, OrganisationDto, UpdateOrganisationDto } from './dtos/organisation.dto';
import { OrganisationsRepository } from './organisations.repository';
import { RbacService } from '../rbac/rbac.service';
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
import { CreateSectionSubjectMappingDto, SectionSubjectDto, SectionSubjectMappingDto, UpdateSectionSubjectMappingDto } from './dtos/section-subject-mapping.dto';
import { BatchSubjectDto, BatchSubjectMappingDto, CreateBatchSubjectMappingDto, UpdateBatchSubjectMappingDto } from './dtos/batch-subject-mapping.dto';
import {
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
import { Logger } from '../../logger';

@Injectable()
export class OrganisationsService {
  private readonly logger = new Logger(OrganisationsService.name);

  constructor(
    private readonly organisationsRepository: OrganisationsRepository,
    private readonly rbacService: RbacService,
  ) {}

  async createOrg(data: CreateOrganisationDto): Promise<OrganisationDto> {
    try {
      const org = await this.organisationsRepository.createOrg(data);
      this.logger.log(`Created organisation ${org.id}`);
      return org;
    } catch (error) {
      this.logger.error('Failed to create organisation', error);
      throw error;
    }
  }

  async getOrganisationOverview(id: string): Promise<OrganisationDto & { branchCount: number; staffCount: number }> {
    try {
      const [organisation, counts] = await Promise.all([
        this.organisationsRepository.findOrgById(id),
        this.organisationsRepository.getOrganisationCounts(id),
      ]);
      return { ...organisation, ...counts };
    } catch (error) {
      this.logger.error(`Failed to fetch overview for organisation ${id}`, error);
      throw error;
    }
  }

  async findOrgById(id: string): Promise<OrganisationDto> {
    try {
      return await this.organisationsRepository.findOrgById(id);
    } catch (error) {
      this.logger.error(`Failed to find organisation ${id}`, error);
      throw error;
    }
  }

  async findOrganisationList(): Promise<OrganisationDto[]> {
    try {
      return await this.organisationsRepository.findOrganisationList();
    } catch (error) {
      this.logger.error('Failed to fetch organisation list', error);
      throw error;
    }
  }

  async findOrganisationAdmins(actorId: string, orgId: string): Promise<OrganisationAdminDto[]> {
    try {
      return await this.organisationsRepository.findOrganisationAdmins(orgId);
    } catch (error) {
      this.logger.error(`Failed to fetch admins for organisation ${orgId} by actor ${actorId}`, error);
      throw error;
    }
  }

  async updateOrg(id: string, data: UpdateOrganisationDto): Promise<OrganisationDto> {
    try {
      const org = await this.organisationsRepository.updateOrg(id, data);
      this.logger.log(`Updated organisation ${id}`);
      return org;
    } catch (error) {
      this.logger.error(`Failed to update organisation ${id}`, error);
      throw error;
    }
  }

  async teachingClasses(orgId: string, branchId: string, userId: string): Promise<ClassDto[]> {
    try {
      return await this.organisationsRepository.teachingClasses(orgId, branchId, userId);
    } catch (error) {
      this.logger.error(`Failed to fetch teaching classes for user ${userId} in branch ${branchId}`, error);
      throw error;
    }
  }

  async createBranch(data: CreateBranchDto): Promise<BranchDto> {
    try {
      const branch = await this.organisationsRepository.createBranch(data);
      this.logger.log(`Created branch ${branch.id}`);
      return branch;
    } catch (error) {
      this.logger.error('Failed to create branch', error);
      throw error;
    }
  }

  async updateBranch(id: string, data: UpdateBranchDto): Promise<BranchDto> {
    try {
      const branch = await this.organisationsRepository.updateBranch(id, data);
      this.logger.log(`Updated branch ${id}`);
      return branch;
    } catch (error) {
      this.logger.error(`Failed to update branch ${id}`, error);
      throw error;
    }
  }

  async getBranchById(id: string): Promise<BranchDto> {
    try {
      return await this.organisationsRepository.findBranchById(id);
    } catch (error) {
      this.logger.error(`Failed to fetch branch ${id}`, error);
      throw error;
    }
  }

  async getBranchListByOrgId(orgId: string): Promise<BranchDto[]> {
    try {
      return await this.organisationsRepository.findBranchListByOrgId(orgId);
    } catch (error) {
      this.logger.error(`Failed to fetch branches for organisation ${orgId}`, error);
      throw error;
    }
  }

  async getBranchSummary(orgId: string, branchId: string, countsOnly?: boolean) {
    try {
      return await this.organisationsRepository.getBranchSummary(orgId, branchId, countsOnly);
    } catch (error) {
      this.logger.error(`Failed to fetch summary for branch ${branchId} in org ${orgId}`, error);
      throw error;
    }
  }

  async getOrganisationStaff(orgId: string, branchId?: string): Promise<OrganisationStaffDto[]> {
    try {
      return await this.organisationsRepository.findOrganisationStaff(orgId, branchId);
    } catch (error) {
      this.logger.error(`Failed to fetch staff for organisation ${orgId}`, error);
      throw error;
    }
  }

  async getOrganisationStaffPage(orgId: string, query: StaffPageQueryDto): Promise<OrganisationStaffPageDto> {
    try {
      return await this.organisationsRepository.findOrganisationStaffPage(orgId, query);
    } catch (error) {
      this.logger.error(`Failed to fetch staff page for organisation ${orgId}`, error);
      throw error;
    }
  }

  async addOrganisationStaff(data: AddOrganisationStaffDto): Promise<OrganisationStaffDto> {
    try {
      const staff = await this.organisationsRepository.addOrganisationStaff(data);
      this.logger.log(`Added staff member to organisation ${data.orgId}`);
      return staff;
    } catch (error) {
      this.logger.error(`Failed to add staff member to organisation ${data.orgId}`, error);
      throw error;
    }
  }

  async updateOrganisationStaff(data: UpdateOrganisationStaffDto, managerBranchId?: string): Promise<OrganisationStaffDto> {
    try {
      const staff = await this.organisationsRepository.updateOrganisationStaff(data, managerBranchId);
      this.logger.log(`Updated staff member ${data.staffId} in organisation ${data.orgId}`);
      return staff;
    } catch (error) {
      this.logger.error(`Failed to update staff member ${data.staffId} in organisation ${data.orgId}`, error);
      throw error;
    }
  }

  async createClass(data: CreateClassDto): Promise<ClassDto> {
    try {
      const created = await this.organisationsRepository.createClass(data);
      this.logger.log(`Created class ${created.id}`);
      return created;
    } catch (error) {
      this.logger.error('Failed to create class', error);
      throw error;
    }
  }

  async createBranchClass(orgId: string, branchId: string, data: Omit<CreateClassDto, 'orgId'>): Promise<ClassDto> {
    try {
      const created = await this.organisationsRepository.createBranchClass(orgId, branchId, data);
      this.logger.log(`Created branch class ${created.id} in branch ${branchId}`);
      return created;
    } catch (error) {
      this.logger.error(`Failed to create branch class in branch ${branchId}`, error);
      throw error;
    }
  }

  async updateBranchClass(orgId: string, branchId: string, id: string, data: UpdateClassDto): Promise<ClassDto> {
    try {
      const updated = await this.organisationsRepository.updateBranchClass(orgId, branchId, id, data);
      this.logger.log(`Updated branch class ${id} in branch ${branchId}`);
      return updated;
    } catch (error) {
      this.logger.error(`Failed to update branch class ${id} in branch ${branchId}`, error);
      throw error;
    }
  }

  async updateClass(id: string, data: UpdateClassDto): Promise<ClassDto> {
    try {
      const updated = await this.organisationsRepository.updateClass(id, data);
      this.logger.log(`Updated class ${id}`);
      return updated;
    } catch (error) {
      this.logger.error(`Failed to update class ${id}`, error);
      throw error;
    }
  }

  async getClassListByOrgId(orgId: string): Promise<ClassDto[]> {
    try {
      return await this.organisationsRepository.findClassListByOrgId(orgId);
    } catch (error) {
      this.logger.error(`Failed to fetch classes for organisation ${orgId}`, error);
      throw error;
    }
  }

  async getClassListByBranch(orgId: string, branchId: string, classId?: string): Promise<ClassDto[]> {
    try {
      return await this.organisationsRepository.findClassListByBranch(orgId, branchId, classId);
    } catch (error) {
      this.logger.error(`Failed to fetch classes for branch ${branchId} in org ${orgId}`, error);
      throw error;
    }
  }

  async createClassSection(data: CreateClassSectionDto): Promise<ClassSectionDto> {
    try {
      const section = await this.organisationsRepository.createClassSection(data);
      this.logger.log(`Created class section ${section.id}`);
      return section;
    } catch (error) {
      this.logger.error('Failed to create class section', error);
      throw error;
    }
  }

  async updateClassSection(
    id: string,
    orgId: string,
    branchId: string,
    data: UpdateClassSectionDto,
  ): Promise<ClassSectionDto> {
    try {
      const section = await this.organisationsRepository.updateClassSection(id, orgId, branchId, data);
      this.logger.log(`Updated class section ${id}`);
      return section;
    } catch (error) {
      this.logger.error(`Failed to update class section ${id}`, error);
      throw error;
    }
  }

  async getClassSectionList(orgId: string, branchId: string, classId?: string): Promise<ClassSectionDto[]> {
    try {
      return await this.organisationsRepository.findClassSectionList(orgId, branchId, classId);
    } catch (error) {
      this.logger.error(`Failed to fetch class sections for branch ${branchId} in org ${orgId}`, error);
      throw error;
    }
  }

  async createClassBatch(data: CreateClassBatchDto): Promise<ClassBatchDto> {
    try {
      const batch = await this.organisationsRepository.createClassBatch(data);
      this.logger.log(`Created class batch ${batch.id}`);
      return batch;
    } catch (error) {
      this.logger.error('Failed to create class batch', error);
      throw error;
    }
  }

  async updateClassBatch(
    id: string,
    orgId: string,
    branchId: string,
    academicSessionId: string,
    data: UpdateClassBatchDto,
  ): Promise<ClassBatchDto> {
    try {
      const batch = await this.organisationsRepository.updateClassBatch(id, orgId, branchId, academicSessionId, data);
      this.logger.log(`Updated class batch ${id}`);
      return batch;
    } catch (error) {
      this.logger.error(`Failed to update class batch ${id}`, error);
      throw error;
    }
  }

  async getClassBatchList(orgId: string, branchId: string, academicSessionId: string, classId?: string): Promise<ClassBatchDto[]> {
    try {
      return await this.organisationsRepository.findClassBatchList(orgId, branchId, academicSessionId, classId);
    } catch (error) {
      this.logger.error(`Failed to fetch class batches for branch ${branchId} in org ${orgId}`, error);
      throw error;
    }
  }

  async createOrgAcademicSession(data: CreateOrgAcademicSessionDto): Promise<OrgAcademicSessionDto> {
    try {
      const session = await this.organisationsRepository.createOrgAcademicSession(data);
      this.logger.log(`Created academic session ${session.id}`);
      return session;
    } catch (error) {
      this.logger.error('Failed to create academic session', error);
      throw error;
    }
  }

  async updateOrgAcademicSession(
    orgId: string,
    id: string,
    data: UpdateOrgAcademicSessionDto,
  ): Promise<OrgAcademicSessionDto> {
    try {
      const session = await this.organisationsRepository.updateOrgAcademicSession(orgId, id, data);
      this.logger.log(`Updated academic session ${id} for org ${orgId}`);
      return session;
    } catch (error) {
      this.logger.error(`Failed to update academic session ${id} for org ${orgId}`, error);
      throw error;
    }
  }

  async getOrgAcademicSessionList(orgId: string): Promise<OrgAcademicSessionDto[]> {
    try {
      return await this.organisationsRepository.findOrgAcademicSessionList(orgId);
    } catch (error) {
      this.logger.error(`Failed to fetch academic sessions for org ${orgId}`, error);
      throw error;
    }
  }

  async getOrgAcademicSessionById(orgId: string, id: string): Promise<OrgAcademicSessionDto> {
    try {
      return await this.organisationsRepository.findOrgAcademicSessionById(orgId, id);
    } catch (error) {
      this.logger.error(`Failed to fetch academic session ${id} for org ${orgId}`, error);
      throw error;
    }
  }

  async createSubject(data: CreateSubjectDto): Promise<SubjectDto> {
    try {
      const subject = await this.organisationsRepository.createSubject(data);
      this.logger.log(`Created subject ${subject.id}`);
      return subject;
    } catch (error) {
      this.logger.error('Failed to create subject', error);
      throw error;
    }
  }

  async updateSubject(orgId: string, id: string, data: UpdateSubjectDto): Promise<SubjectDto> {
    try {
      const subject = await this.organisationsRepository.updateSubject(orgId, id, data);
      this.logger.log(`Updated subject ${id} for org ${orgId}`);
      return subject;
    } catch (error) {
      this.logger.error(`Failed to update subject ${id} for org ${orgId}`, error);
      throw error;
    }
  }

  async assignBranchSubject(orgId: string, branchId: string, subjectId: string): Promise<void> {
    try {
      await this.organisationsRepository.assignBranchSubject(orgId, branchId, subjectId);
      this.logger.log(`Assigned subject ${subjectId} to branch ${branchId}`);
    } catch (error) {
      this.logger.error(`Failed to assign subject ${subjectId} to branch ${branchId}`, error);
      throw error;
    }
  }

  async getSubjectListByOrgId(orgId: string, branchId?: string): Promise<SubjectDto[]> {
    try {
      return await this.organisationsRepository.findSubjectListByOrgId(orgId, branchId);
    } catch (error) {
      this.logger.error(`Failed to fetch subjects for org ${orgId}`, error);
      throw error;
    }
  }

  async getSubjectById(orgId: string, id: string): Promise<SubjectDto> {
    try {
      return await this.organisationsRepository.findSubjectById(orgId, id);
    } catch (error) {
      this.logger.error(`Failed to fetch subject ${id} for org ${orgId}`, error);
      throw error;
    }
  }

  async createClassSubjectMapping(data: CreateClassSubjectMappingDto): Promise<ClassSubjectMappingDto> {
    try {
      const mapping = await this.organisationsRepository.createClassSubjectMapping(data);
      this.logger.log(`Created class subject mapping ${mapping.id}`);
      return mapping;
    } catch (error) {
      this.logger.error('Failed to create class subject mapping', error);
      throw error;
    }
  }

  async updateClassSubjectMapping(
    orgId: string,
    id: string,
    data: UpdateClassSubjectMappingDto,
  ): Promise<ClassSubjectMappingDto> {
    try {
      const mapping = await this.organisationsRepository.updateClassSubjectMapping(orgId, id, data);
      this.logger.log(`Updated class subject mapping ${id} for org ${orgId}`);
      return mapping;
    } catch (error) {
      this.logger.error(`Failed to update class subject mapping ${id} for org ${orgId}`, error);
      throw error;
    }
  }

  private assertNoSubjectTimeOverlap(
    subjects: Array<{ id: string; subjectName: string; startTime?: string | null; endTime?: string | null }>,
    targetId: string | undefined,
    startTime: string | null | undefined,
    endTime: string | null | undefined,
  ): void {
    const normalize = (value: string): string => value.padEnd(8, ':00');
    if (startTime && endTime && normalize(startTime) >= normalize(endTime)) {
      throw new BadRequestException('Subject start time must be earlier than end time');
    }
    if (!startTime || !endTime) return;
    const nextStart = normalize(startTime);
    const nextEnd = normalize(endTime);
    const conflict = subjects.find((item) => (
      item.id !== targetId
      && item.startTime
      && item.endTime
      && nextStart < normalize(item.endTime)
      && nextEnd > normalize(item.startTime)
    ));
    if (conflict) {
      throw new BadRequestException(`Time slot overlaps with ${conflict.subjectName}`);
    }
  }

  async listSectionSubjects(orgId: string, branchId: string, academicSessionId: string, sectionId: string): Promise<SectionSubjectDto[]> {
    return this.organisationsRepository.listSectionSubjects(orgId, branchId, academicSessionId, sectionId);
  }

  async createSectionSubjectMapping(data: CreateSectionSubjectMappingDto): Promise<SectionSubjectMappingDto> {
    try {
      if (data.startTime !== undefined || data.endTime !== undefined) {
        const subjects = await this.organisationsRepository.listSectionSubjects(
          data.orgId, data.branchId, data.academicSessionId, data.sectionId,
        );
        this.assertNoSubjectTimeOverlap(subjects, undefined, data.startTime, data.endTime);
      }
      const mapping = await this.organisationsRepository.createSectionSubjectMapping(data);
      this.logger.log(`Created section subject mapping ${mapping.id}`);
      return mapping;
    } catch (error) {
      this.logger.error('Failed to create section subject mapping', error);
      throw error;
    }
  }

  async updateSectionSubjectMapping(
    orgId: string, branchId: string, academicSessionId: string, id: string, data: UpdateSectionSubjectMappingDto,
  ): Promise<SectionSubjectMappingDto> {
    try {
      if (data.startTime !== undefined || data.endTime !== undefined || data.sectionId !== undefined) {
        const current = await this.organisationsRepository.findSectionSubjectMappingById(orgId, branchId, academicSessionId, id);
        const sectionId = data.sectionId ?? current?.sectionId;
        if (sectionId) {
          const subjects = await this.organisationsRepository.listSectionSubjects(orgId, branchId, academicSessionId, sectionId);
          const effectiveStart = data.startTime !== undefined ? data.startTime : current?.startTime;
          const effectiveEnd = data.endTime !== undefined ? data.endTime : current?.endTime;
          this.assertNoSubjectTimeOverlap(subjects, id, effectiveStart, effectiveEnd);
        }
      }
      const mapping = await this.organisationsRepository.updateSectionSubjectMapping(orgId, branchId, academicSessionId, id, data);
      this.logger.log(`Updated section subject mapping ${id}`);
      return mapping;
    } catch (error) {
      this.logger.error(`Failed to update section subject mapping ${id}`, error);
      throw error;
    }
  }

  async listBatchSubjects(orgId: string, branchId: string, academicSessionId: string, batchId: string): Promise<BatchSubjectDto[]> {
    return this.organisationsRepository.listBatchSubjects(orgId, branchId, academicSessionId, batchId);
  }

  async createBatchSubjectMapping(data: CreateBatchSubjectMappingDto): Promise<BatchSubjectMappingDto> {
    try {
      if (data.startTime !== undefined || data.endTime !== undefined) {
        const subjects = await this.organisationsRepository.listBatchSubjects(
          data.orgId, data.branchId, data.academicSessionId, data.batchId,
        );
        this.assertNoSubjectTimeOverlap(subjects, undefined, data.startTime, data.endTime);
      }
      const mapping = await this.organisationsRepository.createBatchSubjectMapping(data);
      this.logger.log(`Created batch subject mapping ${mapping.id}`);
      return mapping;
    } catch (error) {
      this.logger.error('Failed to create batch subject mapping', error);
      throw error;
    }
  }

  async updateBatchSubjectMapping(
    orgId: string, branchId: string, academicSessionId: string, id: string, data: UpdateBatchSubjectMappingDto,
  ): Promise<BatchSubjectMappingDto> {
    try {
      if (data.startTime !== undefined || data.endTime !== undefined || data.batchId !== undefined) {
        const current = await this.organisationsRepository.findBatchSubjectMappingById(orgId, branchId, academicSessionId, id);
        const batchId = data.batchId ?? current?.batchId;
        if (batchId) {
          const subjects = await this.organisationsRepository.listBatchSubjects(orgId, branchId, academicSessionId, batchId);
          const effectiveStart = data.startTime !== undefined ? data.startTime : current?.startTime;
          const effectiveEnd = data.endTime !== undefined ? data.endTime : current?.endTime;
          this.assertNoSubjectTimeOverlap(subjects, id, effectiveStart, effectiveEnd);
        }
      }
      const mapping = await this.organisationsRepository.updateBatchSubjectMapping(orgId, branchId, academicSessionId, id, data);
      this.logger.log(`Updated batch subject mapping ${id}`);
      return mapping;
    } catch (error) {
      this.logger.error(`Failed to update batch subject mapping ${id}`, error);
      throw error;
    }
  }

  async getStudentList(orgId: string, branchId: string, groupType: StudentGroupType, groupId: string, query: StudentListQueryDto): Promise<StudentListPage> {
    try {
      return await this.organisationsRepository.getStudentList(orgId, branchId, groupType, groupId, query);
    } catch (error) {
      this.logger.error(`Failed to fetch student list for ${groupType} ${groupId}`, error);
      throw error;
    }
  }

  async getBranchStudentList(orgId: string, branchId: string, query: BranchStudentListQueryDto): Promise<BranchStudentListPage> {
    try {
      return await this.organisationsRepository.getBranchStudentList(orgId, branchId, query);
    } catch (error) {
      this.logger.error(`Failed to fetch student list for branch ${branchId}`, error);
      throw error;
    }
  }

  async addExistingStudentToBatch(
    orgId: string,
    branchId: string,
    batchId: string,
    data: AddExistingStudentToBatchDto,
  ): Promise<AddExistingStudentToBatchResultDto> {
    try {
      const result = await this.organisationsRepository.addExistingStudentToBatch(orgId, branchId, batchId, data);
      this.logger.log(`Added existing student ${data.studentId} to batch ${batchId}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to add existing student ${data.studentId} to batch ${batchId}`, error);
      throw error;
    }
  }

  async updateBranchStudent(
    orgId: string,
    branchId: string,
    studentId: string,
    data: UpdateBranchStudentDto,
    requireGroup = false,
  ): Promise<UpdateBranchStudentResultDto> {
    try {
      const result = await this.organisationsRepository.updateBranchStudent(orgId, branchId, studentId, data, requireGroup);
      this.logger.log(`Updated student ${studentId} in branch ${branchId}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to update student ${studentId} in branch ${branchId}`, error);
      throw error;
    }
  }

  async addStudentToOrg(orgId: string, data: AddStudentToOrgDto, requireGroup = false): Promise<AddStudentToOrgResultDto> {
    try {
      if (requireGroup && !data.sectionId && !data.batchId) {
        throw new BadRequestException('Choose a section or batch for this student.');
      }
      if (Boolean(data.guardianName?.trim()) !== Boolean(data.guardianContact?.trim())) {
        throw new BadRequestException('Provide both guardian name and guardian contact.');
      }
      const result = await this.organisationsRepository.addStudentToOrg(orgId, data);
      this.logger.log(`Added student to organisation ${orgId}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to add student to organisation ${orgId}`, error);
      throw error;
    }
  }
}
