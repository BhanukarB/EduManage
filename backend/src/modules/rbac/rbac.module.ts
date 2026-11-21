import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RbacRepository } from './rbac.repository';
import { RbacService } from './rbac.service';
import { RbacController } from './rbac.controller';

@Module({
  imports: [JwtModule.register({ secret: process.env.JWT_SECRET })],
  providers: [RbacRepository, RbacService, AuthGuard],
  controllers: [RbacController],
  exports: [RbacService, AuthGuard],
})
export class RbacModule {}
