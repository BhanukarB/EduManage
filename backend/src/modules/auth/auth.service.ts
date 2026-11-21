import { Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginWithPasswordDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { AuthRepository } from './auth.repository';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly authRepository: AuthRepository
  ) { }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.authRepository.findUserByEmail(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      return user;
    }
    return null;
  }

  async login(user: any): Promise<any> {
    // const user = await this.validateUser(LoginWithPasswordDto.email, LoginWithPasswordDto.password);
    // if (!user) {
    //   throw new UnauthorizedException('Invalid credentials');
    // }
    const userRoleData = await this.authRepository.getRoles(user.id);
    const payload = { uid: user.id, email: user.email, role_ids: userRoleData.roles, roles: userRoleData.roleNames, orgId: userRoleData.orgId };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(
      { uid: user.id, email: user.email },
      { expiresIn: '7d', secret: this.getRefreshSecret() }
    );
    await this.updateRefreshToken(user.id, refreshToken);
    // Optionally, save refreshToken in DB for revocation/rotation
    return {
      accessToken,
      refreshToken,
    };
  }

  async loginWithPassword(LoginWithPasswordDto: LoginWithPasswordDto): Promise<any> {
    const user = await this.validateUser(LoginWithPasswordDto.email, LoginWithPasswordDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const tokens = await this.login(user);
    return tokens;
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
      return this.login(user);
    } catch (err) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async updateRefreshToken(userId: string, refreshToken: string) {
    const hashedToken = await bcrypt.hash(refreshToken, 10);
    return this.authRepository.updateRefreshToken(userId, hashedToken);

  }

  private getRefreshSecret(): string {
    const secret = process.env.JWT_REFRESH_SECRET;
    if (!secret) throw new InternalServerErrorException('JWT_REFRESH_SECRET is not configured');
    return secret;
  }

  async logout(userId: string): Promise<void> {
    await this.authRepository.updateRefreshToken(userId, '');
    console.log(`User ${userId} logged out successfully.`);
    return;
  }

  /**
 * Generate a new API key, hash it, save it in DB, and return the raw key.
 */
  async createApiKey(user_id: number, org_id: number): Promise<{ api_key: string; record: any }> {
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

    //  Return raw key
    return { api_key, record };
  }

  /**
   * Validate a raw API key provided by a client.
   * Returns the DB record if valid, null otherwise.
   */
  async validateKey(apiKey: string): Promise<any | null> {
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
    } catch (err) {
      throw new InternalServerErrorException('Failed to deactivate API key', err.stack);
    }
  }
}
