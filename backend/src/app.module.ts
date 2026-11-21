import { Module } from '@nestjs/common';
import { RbacModule } from './modules/rbac/rbac.module';
import { UsersModule } from './modules/users/users.module';
import { OrganisationsModule } from './modules/organisations/organisations.module';
import { MigrationsService } from './db/migrations.service';

@Module({
  imports: [RbacModule, UsersModule, OrganisationsModule],
  providers: [ MigrationsService],
})
export class AppModule {}
