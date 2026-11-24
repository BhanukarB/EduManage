import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { RbacService } from 'src/modules/rbac/rbac.service';
import { PermissionEnum } from '../../utils/constants/permissions';
import { Request } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import knexConnection from '../../db/connector/knex';

interface AuthTokenPayload extends JwtPayload {
  uid: string;
  orgId?: string;
  roles?: string[];
}

// Extend Express Request interface to include 'permissions'
declare module 'express-serve-static-core' {
  interface Request {
    permissions?: any;
  }
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly rbacService: RbacService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Authorization header is missing');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException('Token is missing');
    }

    try {
      const decoded = this.jwtService.verify<AuthTokenPayload>(token, {
        secret: process.env.JWT_SECRET,
      });

      const isStudent = decoded.roles?.includes('student') ?? false;
      const branchMembership = decoded.orgId
        ? await knexConnection(isStudent ? 'organisation_student_table' : 'organisation_staff_table')
            .where({ user_id: decoded.uid, org_id: decoded.orgId })
            .first('branch_id as branchId')
        : undefined;

      // Attach user information to the request object
      request.user = {
        ...decoded,
        uid: decoded.uid,
        branchId: branchMembership?.branchId ?? null,
      };
      
      // Fetch and attach user permissions
      const userPermissions = await this.rbacService.getUserPermissions(
        decoded.uid,
        decoded.orgId,
      );
      // Every authenticated account can maintain its own contact number.
      request.permissions = [...userPermissions, PermissionEnum.UPDATE_OWN_PHONE];

      return true;
    } catch (error) {
      console.error(error); // Better to use a logger
      throw new UnauthorizedException('Invalid token');
    }
  }
}
