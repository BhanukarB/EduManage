import { Body, Controller, ForbiddenException, Get, Param, ParseBoolPipe, ParseUUIDPipe, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../common/guards/auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../utils/decorators/permission.decorator';
import {
  CreateBranchAPI,
  CreateClassAPI,
  CreateBranchClassAPI,
  UpdateBranchClassAPI,
  CreateClassBatchAPI,
  CreateClassSectionAPI,
  CreateClassSubjectMappingAPI,
  CreateSectionSubjectMappingAPI,
  CreateBatchSubjectMappingAPI,
  CreateOrgAcademicSessionAPI,
  CreateOrganisationAPI,
  AddStudentToOrgAPI,
  AddOrganisationStaffAPI,
  CreateSubjectAPI,
  GetBranchByIdAPI,
  GetBranchListByOrgIdAPI,
  GetOrganisationStaffAPI,
  GetClassListByOrgIdAPI,
  GetClassListByBranchAPI,
  GetClassBatchListAPI,
  GetClassSectionListAPI,
  GetOrganisationByIdAPI,
  GetOrganisationAdminsAPI,
  GetOrgAcademicSessionByIdAPI,
  GetOrgAcademicSessionListAPI,
  GetSubjectByIdAPI,
  GetSubjectListByOrgIdAPI,
  UpdateBranchAPI,
  UpdateOrganisationStaffAPI,
  UpdateClassAPI,
  UpdateClassBatchAPI,
  UpdateClassSectionAPI,
  UpdateClassSubjectMappingAPI,
  UpdateSectionSubjectMappingAPI,
  UpdateBatchSubjectMappingAPI,
  UpdateOrgAcademicSessionAPI,
  UpdateSubjectAPI,
  UpdateOrganisationAPI,
} from '../../utils/routes/organisation.routes';
import { CreateOrganisationDto, OrganisationAdminDto, OrganisationDto, UpdateOrganisationDto } from './dtos/organisation.dto';
import { BranchDto, CreateBranchRequestDto, UpdateBranchDto } from './dtos/branch.dto';
import { AddOrganisationStaffDto, OrganisationStaffDto, UpdateOrganisationStaffDto } from './dtos/organisation-staff.dto';
import { ClassDto, CreateClassRequestDto, UpdateClassDto } from './dtos/class.dto';
import { ClassSectionDto, CreateClassSectionRequestDto, UpdateClassSectionDto } from './dtos/class-section.dto';
import { ClassBatchDto, CreateClassBatchRequestDto, UpdateClassBatchDto } from './dtos/class-batch.dto';
import {
  CreateOrgAcademicSessionRequestDto,
  OrgAcademicSessionDto,
  UpdateOrgAcademicSessionDto,
} from './dtos/org-academic-session.dto';
import { CreateSubjectRequestDto, SubjectDto, UpdateSubjectDto } from './dtos/subject.dto';
import {
  ClassSubjectMappingDto,
  CreateClassSubjectMappingRequestDto,
  UpdateClassSubjectMappingDto,
} from './dtos/class-subject-mapping.dto';
import {
  CreateSectionSubjectMappingRequestDto, SectionSubjectMappingDto, UpdateSectionSubjectMappingDto,
} from './dtos/section-subject-mapping.dto';
import {
  BatchSubjectMappingDto, CreateBatchSubjectMappingRequestDto, UpdateBatchSubjectMappingDto,
} from './dtos/batch-subject-mapping.dto';
import { AddStudentToOrgDto, AddStudentToOrgResultDto } from './dtos/add-student-to-org.dto';
import { OrganisationsService } from './organisations.service';

@ApiTags('organisations')
@ApiBearerAuth()
@UseGuards(AuthGuard, PermissionsGuard)
@Controller('organisations')
export class OrganisationsController {
  constructor(private readonly organisationsService: OrganisationsService) {}

  private assertOrganisationAccess(req: any, orgId: string): void {
    if (!req.user?.orgId || req.user.orgId !== orgId) {
      throw new ForbiddenException('You do not have access to this organisation');
    }
  }

  private assertBranchAccess(req: any, orgId: string, branchId: string): void {
    this.assertOrganisationAccess(req, orgId);
    if (req.user?.roles?.includes('branch_manager') && req.user.branchId !== branchId) {
      throw new ForbiddenException('You do not have access to this branch');
    }
  }

  private assertNotBranchManager(req: any): void {
    if (req.user?.roles?.includes('branch_manager')) {
      throw new ForbiddenException('This action is only available to organisation administrators');
    }
  }

  // Organisations
  @Post(CreateOrganisationAPI.path)
  @UseGuards(AuthGuard, PermissionsGuard)
  @Permissions(...CreateOrganisationAPI.permissions)
  @ApiOperation({ summary: 'Create an organisation (super_admin only)' })
  @ApiResponse({ status: 201, type: OrganisationDto })
  create(@Body() data: CreateOrganisationDto): Promise<OrganisationDto> {
    return this.organisationsService.createOrg(data);
  }

  @Get(GetOrganisationByIdAPI.path)
  @UseGuards(AuthGuard, PermissionsGuard)
  @Permissions(...GetOrganisationByIdAPI.permissions)
  @ApiOperation({ summary: 'Get an organisation by UUID' })
  @ApiResponse({ status: 200, type: OrganisationDto })
  findOrgById(
    @Req() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('includeCounts', new ParseBoolPipe({ optional: true })) includeCounts?: boolean,
  ): Promise<OrganisationDto> {
    this.assertOrganisationAccess(req, id);
    if (includeCounts) {
      this.assertNotBranchManager(req);
      return this.organisationsService.getOrganisationOverview(id);
    }
    return this.organisationsService.findOrgById(id);
  }

  @Get()
  @Permissions(...GetOrganisationByIdAPI.permissions)
  @ApiOperation({ summary: 'List all organisations (super_admin only)' })
  @ApiResponse({ status: 200, type: [OrganisationDto] })
  findOrganisationList(): Promise<OrganisationDto[]> {
    return this.organisationsService.findOrganisationList();
  }

  @Get(GetOrganisationAdminsAPI.path)
  @UseGuards(AuthGuard, PermissionsGuard)
  @Permissions(...GetOrganisationAdminsAPI.permissions)
  @ApiOperation({ summary: 'List org_admin users for an organisation (super_admin only)' })
  @ApiResponse({ status: 200, type: [OrganisationAdminDto] })
  findOrganisationAdmins(@Req() req: any, @Param('orgId', ParseUUIDPipe) orgId: string): Promise<OrganisationAdminDto[]> {
    return this.organisationsService.findOrganisationAdmins(req.user.uid, orgId);
  }

  @Put(UpdateOrganisationAPI.path)
  @UseGuards(AuthGuard, PermissionsGuard)
  @Permissions(...UpdateOrganisationAPI.permissions)
  @ApiOperation({ summary: 'Update an organisation' })
  @ApiResponse({ status: 200, type: OrganisationDto })
  update(
    @Req() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: UpdateOrganisationDto,
  ): Promise<OrganisationDto> {
    this.assertOrganisationAccess(req, id);
    return this.organisationsService.updateOrg(id, data);
  }


  // Branches
  @Post(CreateBranchAPI.path)
  @UseGuards(AuthGuard, PermissionsGuard)
  @Permissions(...CreateBranchAPI.permissions)
  @ApiOperation({ summary: 'Create a branch for an organisation' })
  @ApiResponse({ status: 201, type: BranchDto })
  createBranch(
    @Req() req: any,
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Body() data: CreateBranchRequestDto,
  ): Promise<BranchDto> {
    this.assertOrganisationAccess(req, orgId);
    return this.organisationsService.createBranch({ ...data, orgId });
  }

  @Put(UpdateBranchAPI.path)
  @UseGuards(AuthGuard, PermissionsGuard)
  @Permissions(...UpdateBranchAPI.permissions)
  @ApiOperation({ summary: 'Update a branch' })
  @ApiResponse({ status: 200, type: BranchDto })
  updateBranch(
    @Req() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: UpdateBranchDto,
  ): Promise<BranchDto> {
    this.assertNotBranchManager(req);
    return this.organisationsService.updateBranch(id, data);
  }

  @Get(GetBranchByIdAPI.path)
  @UseGuards(AuthGuard, PermissionsGuard)
  @Permissions(...GetBranchByIdAPI.permissions)
  @ApiOperation({ summary: 'Get a branch by UUID' })
  @ApiResponse({ status: 200, type: BranchDto })
  getBranchById(@Req() req: any, @Param('id', ParseUUIDPipe) id: string): Promise<BranchDto> {
    if (req.user?.roles?.includes('branch_manager') && req.user.branchId !== id) {
      throw new ForbiddenException('You do not have access to this branch');
    }
    return this.organisationsService.getBranchById(id);
  }

  @Get(GetBranchListByOrgIdAPI.path)
  @UseGuards(AuthGuard, PermissionsGuard)
  @Permissions(...GetBranchListByOrgIdAPI.permissions)
  @ApiOperation({ summary: 'List branches for an organisation' })
  @ApiResponse({ status: 200, type: [BranchDto] })
  getBranchListByOrgId(@Req() req: any, @Param('orgId', ParseUUIDPipe) orgId: string): Promise<BranchDto[]> {
    this.assertOrganisationAccess(req, orgId);
    if (req.user?.roles?.includes('branch_manager')) return this.organisationsService.getBranchById(req.user.branchId).then((branch) => [branch]);
    return this.organisationsService.getBranchListByOrgId(orgId);
  }

  @Get('/:orgId/branches/:branchId/summary')
  getBranchSummary(
    @Req() req: any,
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('branchId', ParseUUIDPipe) branchId: string,
    @Query('countsOnly', new ParseBoolPipe({ optional: true })) countsOnly?: boolean,
  ) {
    this.assertBranchAccess(req, orgId, branchId);
    return this.organisationsService.getBranchSummary(orgId, branchId, countsOnly);
  }

  @Get(GetOrganisationStaffAPI.path)
  @UseGuards(AuthGuard, PermissionsGuard)
  @Permissions(...GetOrganisationStaffAPI.permissions)
  @ApiOperation({ summary: 'List staff for an organisation' })
  @ApiResponse({ status: 200, type: [OrganisationStaffDto] })
  getOrganisationStaff(@Req() req: any, @Param('orgId', ParseUUIDPipe) orgId: string,
    @Query('branchId', new ParseUUIDPipe({ optional: true })) branchId?: string,
  ): Promise<OrganisationStaffDto[]> {
    this.assertOrganisationAccess(req, orgId);
    if (branchId) this.assertBranchAccess(req, orgId, branchId);
    const scopedBranch = req.user?.roles?.includes('branch_manager') ? req.user.branchId : branchId;
    if (req.user?.roles?.includes('branch_manager') && !scopedBranch) return Promise.resolve([]);
    return this.organisationsService.getOrganisationStaff(orgId, scopedBranch);
  }

  @Put(UpdateOrganisationStaffAPI.path)
  @UseGuards(AuthGuard, PermissionsGuard)
  @Permissions(...UpdateOrganisationStaffAPI.permissions)
  @ApiOperation({ summary: 'Update a staff member in an organisation' })
  @ApiResponse({ status: 200, type: OrganisationStaffDto })
  async updateOrganisationStaff(
    @Req() req: any,
    @Body() data: UpdateOrganisationStaffDto,
  ): Promise<OrganisationStaffDto> {
    this.assertOrganisationAccess(req, data.orgId);
    if (req.user?.roles?.includes('branch_manager')) {
      const existing = await this.organisationsService.getOrganisationStaff(data.orgId);
      if (!existing.some((person) => person.id === data.staffId && person.branchId === req.user.branchId) || (data.branchId && data.branchId !== req.user.branchId)) throw new ForbiddenException('You do not have access to this staff member or branch');
    }
    return this.organisationsService.updateOrganisationStaff(data.orgId, data.staffId, data);
  }

  @Post(AddOrganisationStaffAPI.path)
  @UseGuards(AuthGuard, PermissionsGuard)
  @Permissions(...AddOrganisationStaffAPI.permissions)
  @ApiOperation({ summary: 'Add a staff member to an organisation branch' })
  @ApiResponse({ status: 201, type: OrganisationStaffDto })
  addOrganisationStaff(@Req() req: any, @Body() data: AddOrganisationStaffDto): Promise<OrganisationStaffDto> {
    this.assertOrganisationAccess(req, data.orgId);
    this.assertBranchAccess(req, data.orgId, data.branchId);
    return this.organisationsService.addOrganisationStaff(data);
  }

  // classes
  @Post(CreateBranchClassAPI.path)
  @Permissions(...CreateBranchClassAPI.permissions)
  createBranchClass(
    @Req() req: any,
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('branchId', ParseUUIDPipe) branchId: string,
    @Body() data: CreateClassRequestDto,
  ): Promise<ClassDto> {
    this.assertBranchAccess(req, orgId, branchId);
    return this.organisationsService.createBranchClass(orgId, branchId, data);
  }

  @Put(UpdateBranchClassAPI.path)
  @Permissions(...UpdateBranchClassAPI.permissions)
  updateBranchClass(
    @Req() req: any,
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('branchId', ParseUUIDPipe) branchId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: UpdateClassDto,
  ): Promise<ClassDto> {
    this.assertBranchAccess(req, orgId, branchId);
    return this.organisationsService.updateBranchClass(orgId, branchId, id, data);
  }

  @Post(CreateClassAPI.path)
  @UseGuards(AuthGuard, PermissionsGuard)
  @Permissions(...CreateClassAPI.permissions)
  @ApiOperation({ summary: 'Create a class for an organisation' })
  @ApiResponse({ status: 201, type: ClassDto })
  createClass(
    @Req() req: any,
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Body() data: CreateClassRequestDto,
  ): Promise<ClassDto> {
    this.assertNotBranchManager(req);
    this.assertOrganisationAccess(req, orgId);
    return this.organisationsService.createClass({ ...data, orgId });
  }

  @Put(UpdateClassAPI.path)
  @UseGuards(AuthGuard, PermissionsGuard)
  @Permissions(...UpdateClassAPI.permissions)
  @ApiOperation({ summary: 'Update a class' })
  @ApiResponse({ status: 200, type: ClassDto })
  updateClass(
    @Req() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: UpdateClassDto,
  ): Promise<ClassDto> {
    this.assertNotBranchManager(req);
    return this.organisationsService.updateClass(id, data);
  }

  @Get(GetClassListByOrgIdAPI.path)
  @UseGuards(AuthGuard, PermissionsGuard)
  @Permissions(...GetClassListByOrgIdAPI.permissions)
  @ApiOperation({ summary: 'List classes for an organisation' })
  @ApiResponse({ status: 200, type: [ClassDto] })
  getClassListByOrgId(@Req() req: any, @Param('orgId', ParseUUIDPipe) orgId: string): Promise<ClassDto[]> {
    this.assertOrganisationAccess(req, orgId);
    this.assertNotBranchManager(req);
    return this.organisationsService.getClassListByOrgId(orgId);
  }

  @Get(GetClassListByBranchAPI.path)
  @UseGuards(AuthGuard, PermissionsGuard)
  @Permissions(...GetClassListByBranchAPI.permissions)
  @ApiOperation({ summary: 'List classes mapped to a branch in an organisation' })
  @ApiResponse({ status: 200, type: [ClassDto] })
  getClassListByBranch(
    @Req() req: any,
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('branchId', ParseUUIDPipe) branchId: string,
    @Query('classId', new ParseUUIDPipe({ optional: true })) classId?: string,
  ): Promise<ClassDto[]> {
    this.assertBranchAccess(req, orgId, branchId);
    return this.organisationsService.getClassListByBranch(orgId, branchId, classId);
  }

  //sections
  @Post(CreateClassSectionAPI.path)
  @UseGuards(AuthGuard, PermissionsGuard)
  @Permissions(...CreateClassSectionAPI.permissions)
  @ApiOperation({ summary: 'Create a section for a class in a branch and academic session' })
  @ApiResponse({ status: 201, type: ClassSectionDto })
  createClassSection(
    @Req() req: any,
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('branchId', ParseUUIDPipe) branchId: string,
    @Param('academicSessionId', ParseUUIDPipe) academicSessionId: string,
    @Body() data: CreateClassSectionRequestDto,
  ): Promise<ClassSectionDto> {
    this.assertOrganisationAccess(req, orgId);
    this.assertBranchAccess(req, orgId, branchId);
    return this.organisationsService.createClassSection({ ...data, orgId, branchId, academicSessionId });
  }

  @Put(UpdateClassSectionAPI.path)
  @UseGuards(AuthGuard, PermissionsGuard)
  @Permissions(...UpdateClassSectionAPI.permissions)
  @ApiOperation({ summary: 'Update a class section' })
  @ApiResponse({ status: 200, type: ClassSectionDto })
  updateClassSection(
    @Req() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('branchId', ParseUUIDPipe) branchId: string,
    @Param('academicSessionId', ParseUUIDPipe) academicSessionId: string,
    @Body() data: UpdateClassSectionDto,
  ): Promise<ClassSectionDto> {
    this.assertOrganisationAccess(req, orgId);
    this.assertBranchAccess(req, orgId, branchId);
    return this.organisationsService.updateClassSection(id, orgId, branchId, academicSessionId, data);
  }

  @Get(GetClassSectionListAPI.path)
  @UseGuards(AuthGuard, PermissionsGuard)
  @Permissions(...GetClassSectionListAPI.permissions)
  @ApiOperation({ summary: 'List class sections by organisation, branch, and academic session' })
  @ApiResponse({ status: 200, type: [ClassSectionDto] })
  getClassSectionList(
    @Req() req: any,
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('branchId', ParseUUIDPipe) branchId: string,
    @Param('academicSessionId', ParseUUIDPipe) academicSessionId: string,
    @Query('classId', new ParseUUIDPipe({ optional: true })) classId?: string,
  ): Promise<ClassSectionDto[]> {
    this.assertOrganisationAccess(req, orgId);
    this.assertBranchAccess(req, orgId, branchId);
    return this.organisationsService.getClassSectionList(orgId, branchId, academicSessionId, classId);
  }

  // batches
  @Post(CreateClassBatchAPI.path)
  @UseGuards(AuthGuard, PermissionsGuard)
  @Permissions(...CreateClassBatchAPI.permissions)
  @ApiOperation({ summary: 'Create a class batch in a branch and academic session' })
  @ApiResponse({ status: 201, type: ClassBatchDto })
  createClassBatch(
    @Req() req: any,
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('branchId', ParseUUIDPipe) branchId: string,
    @Param('academicSessionId', ParseUUIDPipe) academicSessionId: string,
    @Body() data: CreateClassBatchRequestDto,
  ): Promise<ClassBatchDto> {
    this.assertOrganisationAccess(req, orgId);
    this.assertBranchAccess(req, orgId, branchId);
    return this.organisationsService.createClassBatch({ ...data, orgId, branchId, academicSessionId });
  }

  @Put(UpdateClassBatchAPI.path)
  @UseGuards(AuthGuard, PermissionsGuard)
  @Permissions(...UpdateClassBatchAPI.permissions)
  @ApiOperation({ summary: 'Update a class batch' })
  @ApiResponse({ status: 200, type: ClassBatchDto })
  updateClassBatch(
    @Req() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('branchId', ParseUUIDPipe) branchId: string,
    @Param('academicSessionId', ParseUUIDPipe) academicSessionId: string,
    @Body() data: UpdateClassBatchDto,
  ): Promise<ClassBatchDto> {
    this.assertOrganisationAccess(req, orgId);
    this.assertBranchAccess(req, orgId, branchId);
    return this.organisationsService.updateClassBatch(id, orgId, branchId, academicSessionId, data);
  }

  @Get(GetClassBatchListAPI.path)
  @UseGuards(AuthGuard, PermissionsGuard)
  @Permissions(...GetClassBatchListAPI.permissions)
  @ApiOperation({ summary: 'List class batches by organisation, branch, and academic session' })
  @ApiResponse({ status: 200, type: [ClassBatchDto] })
  getClassBatchList(
    @Req() req: any,
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('branchId', ParseUUIDPipe) branchId: string,
    @Param('academicSessionId', ParseUUIDPipe) academicSessionId: string,
    @Query('classId', new ParseUUIDPipe({ optional: true })) classId?: string,
  ): Promise<ClassBatchDto[]> {
    this.assertOrganisationAccess(req, orgId);
    this.assertBranchAccess(req, orgId, branchId);
    return this.organisationsService.getClassBatchList(orgId, branchId, academicSessionId, classId);
  }

  // academic sessions
  @Post(CreateOrgAcademicSessionAPI.path)
  @UseGuards(AuthGuard, PermissionsGuard)
  @Permissions(...CreateOrgAcademicSessionAPI.permissions)
  @ApiOperation({ summary: 'Create an academic session for an organisation' })
  @ApiResponse({ status: 201, type: OrgAcademicSessionDto })
  createOrgAcademicSession(
    @Req() req: any,
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Body() data: CreateOrgAcademicSessionRequestDto,
  ): Promise<OrgAcademicSessionDto> {
    this.assertOrganisationAccess(req, orgId);
    return this.organisationsService.createOrgAcademicSession({ ...data, orgId });
  }

  @Put(UpdateOrgAcademicSessionAPI.path)
  @UseGuards(AuthGuard, PermissionsGuard)
  @Permissions(...UpdateOrgAcademicSessionAPI.permissions)
  @ApiOperation({ summary: 'Update an organisation academic session' })
  @ApiResponse({ status: 200, type: OrgAcademicSessionDto })
  updateOrgAcademicSession(
    @Req() req: any,
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: UpdateOrgAcademicSessionDto,
  ): Promise<OrgAcademicSessionDto> {
    this.assertOrganisationAccess(req, orgId);
    return this.organisationsService.updateOrgAcademicSession(orgId, id, data);
  }

  @Get(GetOrgAcademicSessionListAPI.path)
  @UseGuards(AuthGuard, PermissionsGuard)
  @Permissions(...GetOrgAcademicSessionListAPI.permissions)
  @ApiOperation({ summary: 'List academic sessions for an organisation' })
  @ApiResponse({ status: 200, type: [OrgAcademicSessionDto] })
  getOrgAcademicSessionList(@Req() req: any, @Param('orgId', ParseUUIDPipe) orgId: string): Promise<OrgAcademicSessionDto[]> {
    this.assertOrganisationAccess(req, orgId);
    return this.organisationsService.getOrgAcademicSessionList(orgId);
  }

  @Get(GetOrgAcademicSessionByIdAPI.path)
  @UseGuards(AuthGuard, PermissionsGuard)
  @Permissions(...GetOrgAcademicSessionByIdAPI.permissions)
  @ApiOperation({ summary: 'Get an organisation academic session by UUID' })
  @ApiResponse({ status: 200, type: OrgAcademicSessionDto })
  getOrgAcademicSessionById(
    @Req() req: any,
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<OrgAcademicSessionDto> {
    this.assertOrganisationAccess(req, orgId);
    return this.organisationsService.getOrgAcademicSessionById(orgId, id);
  }

  // subjects
  @Post(CreateSubjectAPI.path)
  @UseGuards(AuthGuard, PermissionsGuard)
  @Permissions(...CreateSubjectAPI.permissions)
  @ApiOperation({ summary: 'Create a subject for an organisation' })
  @ApiResponse({ status: 201, type: SubjectDto })
  createSubject(
    @Req() req: any,
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Body() data: CreateSubjectRequestDto,
  ): Promise<SubjectDto> {
    this.assertOrganisationAccess(req, orgId);
    return this.organisationsService.createSubject({ ...data, orgId });
  }

  @Put(UpdateSubjectAPI.path)
  @UseGuards(AuthGuard, PermissionsGuard)
  @Permissions(...UpdateSubjectAPI.permissions)
  @ApiOperation({ summary: 'Update a subject' })
  @ApiResponse({ status: 200, type: SubjectDto })
  updateSubject(
    @Req() req: any,
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: UpdateSubjectDto,
  ): Promise<SubjectDto> {
    this.assertOrganisationAccess(req, orgId);
    return this.organisationsService.updateSubject(orgId, id, data);
  }

  @Get(GetSubjectListByOrgIdAPI.path)
  @UseGuards(AuthGuard, PermissionsGuard)
  @Permissions(...GetSubjectListByOrgIdAPI.permissions)
  @ApiOperation({ summary: 'List subjects for an organisation' })
  @ApiResponse({ status: 200, type: [SubjectDto] })
  getSubjectListByOrgId(@Req() req: any, @Param('orgId', ParseUUIDPipe) orgId: string): Promise<SubjectDto[]> {
    this.assertOrganisationAccess(req, orgId);
    return this.organisationsService.getSubjectListByOrgId(orgId);
  }

  @Get(GetSubjectByIdAPI.path)
  @UseGuards(AuthGuard, PermissionsGuard)
  @Permissions(...GetSubjectByIdAPI.permissions)
  @ApiOperation({ summary: 'Get a subject by UUID' })
  @ApiResponse({ status: 200, type: SubjectDto })
  getSubjectById(
    @Req() req: any,
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SubjectDto> {
    this.assertOrganisationAccess(req, orgId);
    return this.organisationsService.getSubjectById(orgId, id);
  }

  // class subject mappings
  @Post(CreateClassSubjectMappingAPI.path)
  @UseGuards(AuthGuard, PermissionsGuard)
  @Permissions(...CreateClassSubjectMappingAPI.permissions)
  @ApiOperation({ summary: 'Map a subject to a class for an academic session' })
  @ApiResponse({ status: 201, type: ClassSubjectMappingDto })
  createClassSubjectMapping(
    @Req() req: any,
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('academicSessionId', ParseUUIDPipe) academicSessionId: string,
    @Body() data: CreateClassSubjectMappingRequestDto,
  ): Promise<ClassSubjectMappingDto> {
    this.assertOrganisationAccess(req, orgId);
    return this.organisationsService.createClassSubjectMapping({ ...data, orgId, academicSessionId });
  }

  @Put(UpdateClassSubjectMappingAPI.path)
  @UseGuards(AuthGuard, PermissionsGuard)
  @Permissions(...UpdateClassSubjectMappingAPI.permissions)
  @ApiOperation({ summary: 'Update a class subject mapping' })
  @ApiResponse({ status: 200, type: ClassSubjectMappingDto })
  updateClassSubjectMapping(
    @Req() req: any,
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('academicSessionId', ParseUUIDPipe) academicSessionId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: UpdateClassSubjectMappingDto,
  ): Promise<ClassSubjectMappingDto> {
    this.assertOrganisationAccess(req, orgId);
    return this.organisationsService.updateClassSubjectMapping(orgId, academicSessionId, id, data);
  }

  // section subject mappings
  @Post(CreateSectionSubjectMappingAPI.path)
  @UseGuards(AuthGuard, PermissionsGuard)
  @Permissions(...CreateSectionSubjectMappingAPI.permissions)
  @ApiOperation({ summary: 'Assign a subject and teacher to a section' })
  @ApiResponse({ status: 201, type: SectionSubjectMappingDto })
  createSectionSubjectMapping(
    @Req() req: any,
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('branchId', ParseUUIDPipe) branchId: string,
    @Param('academicSessionId', ParseUUIDPipe) academicSessionId: string,
    @Body() data: CreateSectionSubjectMappingRequestDto,
  ): Promise<SectionSubjectMappingDto> {
    this.assertOrganisationAccess(req, orgId);
    return this.organisationsService.createSectionSubjectMapping({ ...data, orgId, branchId, academicSessionId });
  }

  @Put(UpdateSectionSubjectMappingAPI.path)
  @UseGuards(AuthGuard, PermissionsGuard)
  @Permissions(...UpdateSectionSubjectMappingAPI.permissions)
  @ApiOperation({ summary: 'Update a section subject assignment' })
  @ApiResponse({ status: 200, type: SectionSubjectMappingDto })
  updateSectionSubjectMapping(
    @Req() req: any,
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('branchId', ParseUUIDPipe) branchId: string,
    @Param('academicSessionId', ParseUUIDPipe) academicSessionId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: UpdateSectionSubjectMappingDto,
  ): Promise<SectionSubjectMappingDto> {
    this.assertOrganisationAccess(req, orgId);
    return this.organisationsService.updateSectionSubjectMapping(orgId, branchId, academicSessionId, id, data);
  }

  // batch subject mappings
  @Post(CreateBatchSubjectMappingAPI.path)
  @UseGuards(AuthGuard, PermissionsGuard)
  @Permissions(...CreateBatchSubjectMappingAPI.permissions)
  @ApiOperation({ summary: 'Assign a subject and teacher to a batch' })
  @ApiResponse({ status: 201, type: BatchSubjectMappingDto })
  createBatchSubjectMapping(
    @Req() req: any,
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('branchId', ParseUUIDPipe) branchId: string,
    @Param('academicSessionId', ParseUUIDPipe) academicSessionId: string,
    @Body() data: CreateBatchSubjectMappingRequestDto,
  ): Promise<BatchSubjectMappingDto> {
    this.assertOrganisationAccess(req, orgId);
    return this.organisationsService.createBatchSubjectMapping({ ...data, orgId, branchId, academicSessionId });
  }

  @Put(UpdateBatchSubjectMappingAPI.path)
  @UseGuards(AuthGuard, PermissionsGuard)
  @Permissions(...UpdateBatchSubjectMappingAPI.permissions)
  @ApiOperation({ summary: 'Update a batch subject assignment' })
  @ApiResponse({ status: 200, type: BatchSubjectMappingDto })
  updateBatchSubjectMapping(
    @Req() req: any,
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('branchId', ParseUUIDPipe) branchId: string,
    @Param('academicSessionId', ParseUUIDPipe) academicSessionId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: UpdateBatchSubjectMappingDto,
  ): Promise<BatchSubjectMappingDto> {
    this.assertOrganisationAccess(req, orgId);
    return this.organisationsService.updateBatchSubjectMapping(orgId, branchId, academicSessionId, id, data);
  }

  @Post(AddStudentToOrgAPI.path)
  @UseGuards(AuthGuard, PermissionsGuard)
  @Permissions(...AddStudentToOrgAPI.permissions)
  @ApiOperation({ summary: 'Create a user and enrol them as a student in an organisation' })
  @ApiResponse({ status: 201, type: AddStudentToOrgResultDto })
  addStudentToOrg(
    @Req() req: any,
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Body() data: AddStudentToOrgDto,
  ): Promise<AddStudentToOrgResultDto> {
    this.assertOrganisationAccess(req, orgId);
    return this.organisationsService.addStudentToOrg(orgId, data);
  }
}
