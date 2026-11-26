import { Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginWithPasswordDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { AuthRepository } from './auth.repository';
import { randomBytes } from 'crypto';
import { Logger } from '../../logger';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly authRepository: AuthRepository
  ) { }

  async validateUser(email: string, password: string): Promise<any> {
    try {
      const user = await this.authRepository.findUserByEmail(email);
      if (user && (await bcrypt.compare(password, user.password))) {
        return user;
      }
      return null;
    } catch (error) {
      this.logger.error(`Failed to validate user ${email}`, error);
      throw error;
    }
  }

  async login(user: any): Promise<any> {
    try {
      // const user = await this.validateUser(LoginWithPasswordDto.email, LoginWithPasswordDto.password);
      // if (!user) {
      //   throw new UnauthorizedException('Invalid credentials');
      // }
      const userRoleData = await this.authRepository.getRoles(user.id);
      const payload = { uid: user.id, email: user.email, role_ids: userRoleData.roles, roles: userRoleData.roleNames, orgId: userRoleData.orgId, branchId: userRoleData.branchId };
      const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
      const refreshToken = this.jwtService.sign(
        { uid: user.id, email: user.email },
        { expiresIn: '7d', secret: this.getRefreshSecret() }
      );
      await this.updateRefreshToken(user.id, refreshToken);
      this.logger.log(`User ${user.id} logged in successfully`);
      // Optionally, save refreshToken in DB for revocation/rotation
      return {
        accessToken,
        refreshToken,
      };
    } catch (error) {
      this.logger.error(`Failed to log in user ${user?.id ?? 'unknown'}`, error);
      throw error;
    }
  }

  async loginWithPassword(LoginWithPasswordDto: LoginWithPasswordDto): Promise<any> {
    try {
      const user = await this.validateUser(LoginWithPasswordDto.email, LoginWithPasswordDto.password);
      if (!user) {
        this.logger.warn(`Invalid login attempt for ${LoginWithPasswordDto.email}`);
        throw new UnauthorizedException('Invalid credentials');
      }
      const tokens = await this.login(user);
      return tokens;
    } catch (error) {
      this.logger.error(`Failed to log in with password for ${LoginWithPasswordDto.email}`, error);
      throw error;
    }
  }

  async refreshToken(token: string): Promise<any> {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.getRefreshSecret(),
      });
      const user = await this.authRepository.findUserById(payload.uid);
      if (!user || !user.refreshTokenHash || !(await bcrypt.compare(token, user.refreshTokenHash))) {
        throw new UnauthorizedException('User not found');
      }
      return await this.login(user);
    } catch (err) {
      this.logger.error('Failed to refresh token', err);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async updateRefreshToken(userId: string, refreshToken: string): Promise<unknown> {
    try {
      const hashedToken = await bcrypt.hash(refreshToken, 10);
      return await this.authRepository.updateRefreshToken(userId, hashedToken);
    } catch (error) {
      this.logger.error(`Failed to update refresh token for user ${userId}`, error);
      throw error;
    }
  }

  private getRefreshSecret(): string {
    try {
      const secret = process.env.JWT_REFRESH_SECRET;
      if (!secret) throw new InternalServerErrorException('JWT_REFRESH_SECRET is not configured');
      return secret;
    } catch (error) {
      this.logger.error('Failed to retrieve JWT_REFRESH_SECRET', error);
      throw error;
    }
  }

  async logout(userId: string): Promise<void> {
    try {
      await this.authRepository.updateRefreshToken(userId, '');
      this.logger.log(`User ${userId} logged out successfully.`);
      return;
    } catch (error) {
      this.logger.error(`Failed to log out user ${userId}`, error);
      throw error;
    }
  }

  /**
 * Generate a new API key, hash it, save it in DB, and return the raw key.
 */
  async createApiKey(user_id: number, org_id: number): Promise<{ api_key: string; record: any }> {
    try {
      // Generate raw key
      const rawKey = 'sk_' + randomBytes(32).toString('hex');

      // Generate a unique prefix key
      let prefixKey = randomBytes(10).toString('hex').slice(0, 8);
      while (await this.authRepository.getUserApiKeyByPrefix(prefixKey) !== null) {
        prefixKey = randomBytes(10).toString('hex').slice(0, 8);
      }

      const hashedKey = await bcrypt.hash(rawKey, 10);

      const [record] = await this.authRepository.createUserApiKey(user_id, org_id, prefixKey, hashedKey);

      //  Add a prefix
      const api_key = prefixKey + rawKey;
      this.logger.log(`Created API key for user ${user_id} in org ${org_id}`);

      //  Return raw key
      return { api_key, record };
    } catch (error) {
      this.logger.error(`Failed to create API key for user ${user_id} in org ${org_id}`, error);
      throw error;
    }
  }

  /**
   * Validate a raw API key provided by a client.
   * Returns the DB record if valid, null otherwise.
   */
  async validateKey(apiKey: string): Promise<any | null> {
    try {
      if (!apiKey || apiKey.length <= 8) return null;

      //  Extract prefix and raw key
      const prefixKey = apiKey.slice(0, 8); // first 8 chars
      const rawKey = apiKey.slice(8);       // rest of the key

      //  Fetch the record from DB using prefix
      const record = await this.authRepository.getUserApiKeyByPrefix(prefixKey);

      if (!record || !record.is_active) return null;

      //  Compare rawKey with hashed key
      const isValid = await bcrypt.compare(rawKey, record.suffix_key);

      return isValid ? record : null;
    } catch (error) {
      this.logger.error('Failed to validate API key', error);
      throw error;
    }
  }

  /**
   * Deactivate a key
   */
  async deactivateKey(id: number): Promise<void> {
    try {
      await this.authRepository.updateUserApiKey({
        id,
        is_active: false
      });
      this.logger.log(`Deactivated API key ${id}`);
    } catch (err) {
      this.logger.error(`Failed to deactivate API key ${id}`, err);
      throw new InternalServerErrorException('Failed to deactivate API key', err instanceof Error ? err.stack : undefined);
    }
  }
}
