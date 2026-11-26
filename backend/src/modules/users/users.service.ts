import { ForbiddenException, Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { RoleType } from '../../utils/enums/roleType';
import { CurrentUserDto, UpdateOwnPhoneDto } from './dtos/user.dto';
import { Assignment } from "../rbac/access-context";
import { RbacService } from '../rbac/rbac.service';
import { CreateUserDto, UpdateUserDto, UserDto } from './dtos/user.dto';
import { UsersRepository } from './users.repository';
import { Logger } from '../../logger';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly rbacService: RbacService,
  ) {}

  async create(userData: CreateUserDto, actorId: string, requestOrgId?: string): Promise<UserDto> {
    try {
      const orgId = requestOrgId ?? userData.orgId ?? null;
      await this.ensureCanManageUsers(actorId, orgId ?? undefined);
      const user = await this.usersRepository.create(userData, orgId);
      this.logger.log(`User ${user.id} created by actor ${actorId}`);
      return user;
    } catch (error) {
      this.logger.error(`Failed to create user by actor ${actorId}`, error);
      throw error;
    }
  }

  async findAll(actorId: string, orgId?: string): Promise<UserDto[]> {
    try {
      await this.ensureCanManageUsers(actorId, orgId);
      return await this.usersRepository.findAll(orgId);
    } catch (error) {
      this.logger.error(`Failed to fetch users for actor ${actorId}`, error);
      throw error;
    }
  }

  async currentAssignments(userId: string): Promise<Assignment[]> {
    try {
      return await this.rbacService.activeAssignments(userId);
    } catch (error) {
      this.logger.error(`Failed to fetch active assignments for user ${userId}`, error);
      throw error;
    }
  }

  async findCurrentUser(userId: string): Promise<CurrentUserDto> {
    try {
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
    } catch (error) {
      this.logger.error(`Failed to fetch current user ${userId}`, error);
      throw error;
    }
  }

  async updateOwnPhone(userId: string, phoneNumber: string): Promise<UpdateOwnPhoneDto> {
    try {
      await this.usersRepository.update(userId, { phoneNumber });
      this.logger.log(`Updated phone number for user ${userId}`);
      return { phoneNumber };
    } catch (error) {
      this.logger.error(`Failed to update phone number for user ${userId}`, error);
      throw error;
    }
  }

  async findById(id: string, actorId: string, orgId?: string): Promise<UserDto> {
    try {
      await this.ensureCanManageUsers(actorId, orgId);
      return await this.usersRepository.findById(id, orgId);
    } catch (error) {
      this.logger.error(`Failed to find user ${id} by actor ${actorId}`, error);
      throw error;
    }
  }

  async update(id: string, userData: UpdateUserDto, actorId: string, orgId?: string): Promise<UserDto> {
    try {
      await this.ensureCanManageUsers(actorId, orgId);
      const updated = await this.usersRepository.update(id, userData, orgId);
      this.logger.log(`Updated user ${id} by actor ${actorId}`);
      return updated;
    } catch (error) {
      this.logger.error(`Failed to update user ${id} by actor ${actorId}`, error);
      throw error;
    }
  }

  private async ensureCanManageUsers(actorId: string, orgId?: string): Promise<void> {
    try {
      if (await this.rbacService.userHasRole(actorId, 'super_admin')) return;
      if (orgId && await this.rbacService.userHasRole(actorId, 'org_admin', orgId)) return;
      throw new ForbiddenException('Only a super_admin or the organisation’s org_admin can manage users');
    } catch (error) {
      this.logger.error(`Permission check failed for actor ${actorId}`, error);
      throw error;
    }
  }
}
