import { ForbiddenException, Injectable } from '@nestjs/common';
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
import { CreateSectionSubjectMappingDto, SectionSubjectMappingDto, UpdateSectionSubjectMappingDto } from './dtos/section-subject-mapping.dto';
import { BatchSubjectMappingDto, CreateBatchSubjectMappingDto, UpdateBatchSubjectMappingDto } from './dtos/batch-subject-mapping.dto';
import { AddStudentToOrgDto, AddStudentToOrgResultDto } from './dtos/add-student-to-org.dto';
import { AddOrganisationStaffDto, OrganisationStaffDto, UpdateOrganisationStaffDto } from './dtos/organisation-staff.dto';

@Injectable()
export class OrganisationsService {
  constructor(
    private readonly organisationsRepository: OrganisationsRepository,
    private readonly rbacService: RbacService,
  ) {}

  async createOrg(data: CreateOrganisationDto): Promise<OrganisationDto> {
    return this.organisationsRepository.createOrg(data);
  }

  async findOrgById(id: string): Promise<OrganisationDto> {
    return this.organisationsRepository.findOrgById(id);
  }

  async findOrganisationList(): Promise<OrganisationDto[]> {
    return this.organisationsRepository.findOrganisationList();
  }

  async findOrganisationAdmins(actorId: string, orgId: string): Promise<OrganisationAdminDto[]> {

    return this.organisationsRepository.findOrganisationAdmins(orgId);
  }

  async updateOrg(id: string, data: UpdateOrganisationDto): Promise<OrganisationDto> {
    return this.organisationsRepository.updateOrg(id, data);
  }

  async createBranch(data: CreateBranchDto): Promise<BranchDto> {
    return this.organisationsRepository.createBranch(data);
  }

  async updateBranch(id: string, data: UpdateBranchDto): Promise<BranchDto> {
    return this.organisationsRepository.updateBranch(id, data);
  }

  async getBranchById(id: string): Promise<BranchDto> {
    return this.organisationsRepository.findBranchById(id);
  }

  async getBranchListByOrgId(orgId: string): Promise<BranchDto[]> {
    return this.organisationsRepository.findBranchListByOrgId(orgId);
  }

  async getBranchSummary(orgId: string, branchId: string) {
    return this.organisationsRepository.getBranchSummary(orgId, branchId);
  }

  async getOrganisationStaff(orgId: string): Promise<OrganisationStaffDto[]> {
    return this.organisationsRepository.findOrganisationStaff(orgId);
  }

  async addOrganisationStaff(data: AddOrganisationStaffDto): Promise<OrganisationStaffDto> {
    return this.organisationsRepository.addOrganisationStaff(data);
  }

  async updateOrganisationStaff(orgId: string, staffId: string, data: UpdateOrganisationStaffDto): Promise<OrganisationStaffDto> {
    return this.organisationsRepository.updateOrganisationStaff(orgId, staffId, data);
  }

  async createClass(data: CreateClassDto): Promise<ClassDto> {
    return this.organisationsRepository.createClass(data);
  }

  async updateClass(id: string, data: UpdateClassDto): Promise<ClassDto> {
    return this.organisationsRepository.updateClass(id, data);
  }

  async getClassListByOrgId(orgId: string): Promise<ClassDto[]> {
    return this.organisationsRepository.findClassListByOrgId(orgId);
  }

  async createClassSection(data: CreateClassSectionDto): Promise<ClassSectionDto> {
    return this.organisationsRepository.createClassSection(data);
  }

  async updateClassSection(
    id: string,
    orgId: string,
    branchId: string,
    academicSessionId: string,
    data: UpdateClassSectionDto,
  ): Promise<ClassSectionDto> {
    return this.organisationsRepository.updateClassSection(id, orgId, branchId, academicSessionId, data);
  }

  async getClassSectionList(orgId: string, branchId: string, academicSessionId: string): Promise<ClassSectionDto[]> {
    return this.organisationsRepository.findClassSectionList(orgId, branchId, academicSessionId);
  }

  async createClassBatch(data: CreateClassBatchDto): Promise<ClassBatchDto> {
    return this.organisationsRepository.createClassBatch(data);
  }

  async updateClassBatch(
    id: string,
    orgId: string,
    branchId: string,
    academicSessionId: string,
    data: UpdateClassBatchDto,
  ): Promise<ClassBatchDto> {
    return this.organisationsRepository.updateClassBatch(id, orgId, branchId, academicSessionId, data);
  }

  async getClassBatchList(orgId: string, branchId: string, academicSessionId: string): Promise<ClassBatchDto[]> {
    return this.organisationsRepository.findClassBatchList(orgId, branchId, academicSessionId);
  }

  async createOrgAcademicSession(data: CreateOrgAcademicSessionDto): Promise<OrgAcademicSessionDto> {
    return this.organisationsRepository.createOrgAcademicSession(data);
  }

  async updateOrgAcademicSession(
    orgId: string,
    id: string,
    data: UpdateOrgAcademicSessionDto,
  ): Promise<OrgAcademicSessionDto> {
    return this.organisationsRepository.updateOrgAcademicSession(orgId, id, data);
  }

  async getOrgAcademicSessionList(orgId: string): Promise<OrgAcademicSessionDto[]> {
    return this.organisationsRepository.findOrgAcademicSessionList(orgId);
  }

  async getOrgAcademicSessionById(orgId: string, id: string): Promise<OrgAcademicSessionDto> {
    return this.organisationsRepository.findOrgAcademicSessionById(orgId, id);
  }

  async createSubject(data: CreateSubjectDto): Promise<SubjectDto> {
    return this.organisationsRepository.createSubject(data);
  }

  async updateSubject(orgId: string, id: string, data: UpdateSubjectDto): Promise<SubjectDto> {
    return this.organisationsRepository.updateSubject(orgId, id, data);
  }

  async getSubjectListByOrgId(orgId: string): Promise<SubjectDto[]> {
    return this.organisationsRepository.findSubjectListByOrgId(orgId);
  }

  async getSubjectById(orgId: string, id: string): Promise<SubjectDto> {
    return this.organisationsRepository.findSubjectById(orgId, id);
  }

  async createClassSubjectMapping(data: CreateClassSubjectMappingDto): Promise<ClassSubjectMappingDto> {
    return this.organisationsRepository.createClassSubjectMapping(data);
  }

  async updateClassSubjectMapping(
    orgId: string,
    academicSessionId: string,
    id: string,
    data: UpdateClassSubjectMappingDto,
  ): Promise<ClassSubjectMappingDto> {
    return this.organisationsRepository.updateClassSubjectMapping(orgId, academicSessionId, id, data);
  }

  async createSectionSubjectMapping(data: CreateSectionSubjectMappingDto): Promise<SectionSubjectMappingDto> {
    return this.organisationsRepository.createSectionSubjectMapping(data);
  }

  async updateSectionSubjectMapping(
    orgId: string, branchId: string, academicSessionId: string, id: string, data: UpdateSectionSubjectMappingDto,
  ): Promise<SectionSubjectMappingDto> {
    return this.organisationsRepository.updateSectionSubjectMapping(orgId, branchId, academicSessionId, id, data);
  }

  async createBatchSubjectMapping(data: CreateBatchSubjectMappingDto): Promise<BatchSubjectMappingDto> {
    return this.organisationsRepository.createBatchSubjectMapping(data);
  }

  async updateBatchSubjectMapping(
    orgId: string, branchId: string, academicSessionId: string, id: string, data: UpdateBatchSubjectMappingDto,
  ): Promise<BatchSubjectMappingDto> {
    return this.organisationsRepository.updateBatchSubjectMapping(orgId, branchId, academicSessionId, id, data);
  }

  async addStudentToOrg(orgId: string, data: AddStudentToOrgDto): Promise<AddStudentToOrgResultDto> {
    return this.organisationsRepository.addStudentToOrg(orgId, data);
  }
}
