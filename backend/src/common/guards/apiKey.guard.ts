// src/common/guards/api-key.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { RbacService } from 'src/modules/rbac/rbac.service';
import { AuthService } from 'src/modules/auth/auth.service';
import { Logger } from 'src/logger';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly rbacService: RbacService,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = request.headers['x-api-key'];

    if (!apiKey || typeof apiKey !== 'string') {
      throw new UnauthorizedException('API key missing');
    }

    const apiKeyRecord = await this.authService.validateKey(apiKey);
    if(!apiKeyRecord) {
      throw new UnauthorizedException('Invalid API key');
    }

      // Fetch and attach user permissions
      const userPermissions = await this.rbacService.getUserPermissions(
        apiKeyRecord.user_id,
      );
      request.permissions = userPermissions;

    if (apiKeyRecord) {
      request.user = {
        uid: apiKeyRecord.user_id,
        orgId: apiKeyRecord.org_id,
        source: 'api-key',
      };
      return true;
    }

    throw new UnauthorizedException('Invalid API key');
  }
}
