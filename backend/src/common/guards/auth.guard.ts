import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import { RbacService } from '../../modules/rbac/rbac.service';
import { Assignment, scopeId, selectAssignment } from '../../modules/rbac/access-context';
import { PermissionEnum } from '../../utils/constants/permissions';

declare module 'express-serve-static-core' {
  interface Request {
    permissions?: string[];
    accessContext?: Assignment;
  }
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService, private readonly rbac: RbacService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = request.headers.authorization?.match(/^Bearer (\S+)$/i)?.[1];
    if (!token) throw new UnauthorizedException('Bearer token is required');
    let decoded: JwtPayload;
    try {
      decoded = this.jwtService.verify<JwtPayload>(token, { secret: process.env.JWT_SECRET });
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
    if (typeof decoded.uid !== 'string') throw new UnauthorizedException('Invalid user');
    const handler = context.getHandler().name;
    if (['findCurrentUser', 'updateOwnPhone', 'currentAssignments'].includes(handler)) {
      request.user = { uid: decoded.uid };
      request.permissions = [PermissionEnum.UPDATE_OWN_PHONE];
      return true;
    }
    const branchDetail = ['getBranchById', 'updateBranch'].includes(handler);
    const roleId = scopeId([request.headers['x-active-role-id']]);
    const orgId = scopeId([request.params.orgId, request.body?.orgId, request.query.orgId,
      request.headers['x-active-org-id'], handler === 'findOrgById' ? request.params.id : undefined]);
    const branchId = scopeId([request.params.branchId, request.query.branchId, request.body?.branchId ?? undefined,
      request.headers['x-active-branch-id'], branchDetail ? request.params.id : undefined]);
    const assignment = selectAssignment(await this.rbac.activeAssignments(decoded.uid), roleId, orgId, branchId);
    if (branchId && assignment.orgId && !await this.rbac.branchBelongsToOrg(branchId, assignment.orgId)) {
      throw new ForbiddenException('Branch is outside the selected organisation');
    }
    if (context.getClass().name === 'UsersController' && !['org_admin', 'super_admin'].includes(assignment.name)) {
      throw new ForbiddenException('User management requires administrator access');
    }
    request.accessContext = assignment;
    request.user = { uid: decoded.uid, email: decoded.email, roles: [assignment.name],
      orgId: assignment.orgId, branchId: assignment.branchId };
    const role = await this.rbac.getRolePermissions(assignment.roleId);
    request.permissions = role.permissions.map(row => row.permission);
    return true;
  }
}
