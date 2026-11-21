import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RbacModule } from '../rbac/rbac.module';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { OrganisationsController } from './organisations.controller';
import { OrganisationsRepository } from './organisations.repository';
import { OrganisationsService } from './organisations.service';

@Module({
  imports: [AuthModule, RbacModule],
  controllers: [OrganisationsController],
  providers: [OrganisationsRepository, OrganisationsService, PermissionsGuard],
  exports: [OrganisationsService],
})
export class OrganisationsModule {}
