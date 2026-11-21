import { ForbiddenException, Injectable } from '@nestjs/common';
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

  async findCurrentUser(userId: string): Promise<UserDto> {
    return this.usersRepository.findById(userId);
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
