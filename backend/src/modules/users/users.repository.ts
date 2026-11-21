import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import knexConnection from '../../db/connector/knex';
import { CreateUserDto, UpdateUserDto, UserDto } from './dtos/user.dto';

const userColumns = [
  'id',
  'first_name as firstName',
  'middle_name as middleName',
  'last_name as lastName',
  'email_id as emailId',
  'phone_number as phoneNumber',
  'org_id as orgId',
  'address',
  'created_at as createdAt',
  'updated_at as updatedAt',
];

const DEFAULT_USER_PASSWORD = 'Password@123';

@Injectable()
export class UsersRepository {
  async create(userData: CreateUserDto, orgId: string | null): Promise<UserDto> {
    const existing = await knexConnection('users_table')
      .whereRaw('lower(email_id) = lower(?)', [userData.emailId])
      .first('id');
    if (existing) throw new ConflictException('A user with this email already exists');

    const passwordHash = await bcrypt.hash(DEFAULT_USER_PASSWORD, 10);
    const [user] = await knexConnection('users_table')
      .insert({
        id: randomUUID(),
        first_name: userData.firstName,
        middle_name: userData.middleName ?? null,
        last_name: userData.lastName,
        email_id: userData.emailId.toLowerCase(),
        password_hash: passwordHash,
        phone_number: userData.phoneNumber ?? null,
        org_id: orgId,
        address: userData.address ?? null,
      })
      .returning(userColumns);
    return user;
  }

  async findAll(orgId?: string): Promise<UserDto[]> {
    const query = knexConnection('users_table').select(userColumns);
    if (orgId) query.where({ org_id: orgId });
    return query.orderBy('created_at', 'desc');
  }

  async findById(id: string, orgId?: string): Promise<UserDto> {
    const query = knexConnection('users_table').where({ id });
    if (orgId) query.andWhere({ org_id: orgId });
    const user = await query.select(userColumns).first();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(id: string, userData: UpdateUserDto, orgId?: string): Promise<UserDto> {
    if (userData.emailId) {
      const existing = await knexConnection('users_table')
        .whereRaw('lower(email_id) = lower(?)', [userData.emailId])
        .andWhereNot({ id })
        .first('id');
      if (existing) throw new ConflictException('A user with this email already exists');
    }

    const changes: Record<string, unknown> = {};
    if (userData.firstName !== undefined) changes.first_name = userData.firstName;
    if (userData.middleName !== undefined) changes.middle_name = userData.middleName;
    if (userData.lastName !== undefined) changes.last_name = userData.lastName;
    if (userData.emailId !== undefined) changes.email_id = userData.emailId.toLowerCase();
    if (userData.phoneNumber !== undefined) changes.phone_number = userData.phoneNumber;
    if (userData.address !== undefined) changes.address = userData.address;

    if (Object.keys(changes).length === 0) return this.findById(id, orgId);
    changes.updated_at = knexConnection.fn.now();

    const query = knexConnection('users_table').where({ id });
    if (orgId) query.andWhere({ org_id: orgId });
    const [user] = await query.update(changes).returning(userColumns);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
