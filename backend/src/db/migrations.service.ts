import { Injectable, Logger, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { join } from 'path';
import { randomUUID } from 'crypto';
import knexConnection from './connector/knex';
import { PermissionEnum } from '../utils/constants/permissions';

@Injectable()
export class MigrationsService implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(MigrationsService.name);

  async onApplicationBootstrap(): Promise<void> {
    const [batch, migrations] = await knexConnection.migrate.latest({
      directory: join(__dirname, 'migrations'),
      loadExtensions: ['.js'],
    });

    if (migrations.length) {
      this.logger.log(`Applied migration batch ${batch}: ${migrations.join(', ')}`);
    } else {
      this.logger.log('Database migrations are up to date');
    }

    const permissions = Object.values(PermissionEnum).map((permission) => ({
      id: randomUUID(),
      permission,
    }));

    await knexConnection('permissions_table')
      .insert(permissions)
      .onConflict('permission')
      .ignore();
    this.logger.log(`Synchronized ${permissions.length} permissions`);
  }

  async onApplicationShutdown(): Promise<void> {
    await knexConnection.destroy();
  }
}
