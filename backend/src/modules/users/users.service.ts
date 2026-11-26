import { ForbiddenException, Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { RoleType } from '../../utils/enums/roleType';
import { CurrentUserDto, UpdateOwnPhoneDto } from './dtos/user.dto';
import { Assignment } from "../rbac/access-context";
import { RbacService } from '../rbac/rbac.service';
import { CreateUserDto, UpdateUserDto, UserDto } from './dtos/user.dto';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly rbacService: RbacService,
  ) {}

  async create(userData: CreateUserDto, actorId: string, requestOrgId?: string): Promise<UserDto> {
    const orgId = requestOrgId ?? userData.orgId ?? null;
    await this.ensureCanManageUsers(actorId, orgId ?? undefined);
    return this.usersRepository.create(userData, orgId);
  }

  async findAll(actorId: string, orgId?: string): Promise<UserDto[]> {
    await this.ensureCanManageUsers(actorId, orgId);
    return this.usersRepository.findAll(orgId);
  }

  currentAssignments(userId: string): Promise<Assignment[]> {
    return this.rbacService.activeAssignments(userId);
  }

  async findCurrentUser(userId: string): Promise<CurrentUserDto> {
    const user = await this.usersRepository.findById(userId);
    const roles = await this.rbacService.getUserRoles(userId, user.orgId ?? undefined);
    const student = roles.some(role => role.name === 'student');
    const branchLevel = roles.some(role => role.roleType === RoleType.BRANCH_LEVEL);
    const [organisationName, membership, guardians] = await Promise.all([
      user.orgId ? this.usersRepository.organisationName(user.orgId) : null,
      user.orgId ? this.usersRepository.membership(userId, user.orgId, student) : null,
      student ? this.usersRepository.guardians(userId) : undefined,
    ]);
    const date = membership?.joiningDate;
    // PostgreSQL DATE values arrive at local midnight. Preserve the calendar date.
    const joiningDate = date ? [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0')].join('-') : null;

    return plainToInstance(CurrentUserDto, {
      ...user, organisationName, joiningDate, guardians,
      branchName: branchLevel ? membership?.branchName ?? null : undefined,
    });
  }

  async updateOwnPhone(userId: string, phoneNumber: string): Promise<UpdateOwnPhoneDto> {
    await this.usersRepository.update(userId, { phoneNumber });
    return { phoneNumber };
  }

  async findById(id: string, actorId: string, orgId?: string): Promise<UserDto> {
    await this.ensureCanManageUsers(actorId, orgId);
    return this.usersRepository.findById(id, orgId);
  }

  async update(id: string, userData: UpdateUserDto, actorId: string, orgId?: string): Promise<UserDto> {
    await this.ensureCanManageUsers(actorId, orgId);
    return this.usersRepository.update(id, userData, orgId);
  }

  private async ensureCanManageUsers(actorId: string, orgId?: string): Promise<void> {
    if (await this.rbacService.userHasRole(actorId, 'super_admin')) return;
    if (orgId && await this.rbacService.userHasRole(actorId, 'org_admin', orgId)) return;
    throw new ForbiddenException('Only a super_admin or the organisation’s org_admin can manage users');
  }
}
