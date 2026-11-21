import { Injectable } from '@nestjs/common';
import knexConnection from '../../db/connector/knex';


@Injectable()
export class AuthRepository {
  async findUserByEmail(email: string): Promise<any | null> {
    const user = await knexConnection('users_table')
      .whereRaw('lower(email_id) = lower(?)', [email])
      .first({
        id: 'id',
        email: 'email_id',
        password: 'password_hash',
        orgId: 'org_id',
        refreshTokenHash: 'refresh_token_hash',
      });
    return user || null;
  }

  async getRoles(userId: string): Promise<any> {
    const [rows, user] = await Promise.all([
      knexConnection('user_roles_table as ur')
        .join('roles_table as r', 'ur.role_id', 'r.id')
        .select('ur.role_id', 'r.role_name')
        .where('ur.user_id', userId),
      knexConnection('users_table').select('org_id').where({ id: userId }).first(),
    ]);
    const roles = rows.map(row => row.role_id);
    const roleNames = rows.map(row => row.role_name);
    const orgId = user?.org_id ?? null;
    return { roles, roleNames, orgId };
  }

  async updateRefreshToken(userId: string, refreshToken: string): Promise<void> {
    await knexConnection('users_table')
      .where({ id: userId })
      .update({ refresh_token_hash: refreshToken });
  }

  async findUserById(userId: string): Promise<any | null> {
    const user = await knexConnection('users_table')
      .where({ id: userId })
      .first({
        id: 'id',
        email: 'email_id',
        password: 'password_hash',
        orgId: 'org_id',
        refreshTokenHash: 'refresh_token_hash',
      });
    return user || null;
  }

  async createUserApiKey(user_id: number, org_id: number, prefix_key: string, suffix_key: string): Promise<any> {
    // Delete existing records for the user
    await knexConnection('user_api_key')
      .where({ user_id })
      .del();

    // Create new record
    const result = await knexConnection('user_api_key').insert({ user_id, org_id, prefix_key, suffix_key }).returning('*');
    return result;
  }

  async getUserApiKeyByPrefix(prefix_key: string): Promise<any | null> {
    const userApiKey = await knexConnection('user_api_key').where('prefix_key', '=', prefix_key).first();
    return userApiKey || null;
  }

  // async getUserApiKeysByUserId(userId: number): Promise<any[]> {
  //   const userApiKeys = await knexConnection('user_api_key').where({ user_id: userId });
  //   return userApiKeys;
  // }

  async updateUserApiKey(data: {id : number, prefix_key ?: string, suffix_key ?: string, is_active ?: boolean }): Promise<void> {
    await knexConnection('user_api_key')
      .where({ id: data.id })
      .update(data);
  }

  async deleteUserApiKey(id: number): Promise<void> {
    await knexConnection('user_api_key')
      .where({ id })
      .del();
  }
}
