import { Injectable, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { join } from 'path';
import { randomUUID } from 'crypto';
import knexConnection from './connector/knex';
import { PermissionEnum } from '../utils/constants/permissions';
import { Logger } from '../logger';

@Injectable()
export class MigrationsService implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(MigrationsService.name);

  async onApplicationBootstrap(): Promise<void> {
    try {
      const [batch, migrations] = await knexConnection.migrate.latest({
        directory: join(__dirname, 'migrations'),
        loadExtensions: ['.js'],
      });

      if (migrations.length) {
        this.logger.log(`Applied migration batch ${batch}: ${migrations.join(', ')}`);
      } else {
        this.logger.log('Database migrations are up to date');
      }

      await this.renameStudentListPermission();

      const permissions = Object.values(PermissionEnum).map((permission) => ({
        id: randomUUID(),
        permission,
      }));

      await knexConnection('permissions_table')
        .insert(permissions)
        .onConflict('permission')
        .ignore();
      this.logger.log(`Synchronized ${permissions.length} permissions`);
    } catch (error) {
      this.logger.error('Failed to run database migrations or permission sync', error);
      throw error;
    }
  }

  private async renameStudentListPermission(): Promise<void> {
    try {
      await knexConnection.transaction(async (trx) => {
        const permissions = trx('permissions_table');
        const previous = await permissions.clone().where({ permission: 'view_student_roster' }).forUpdate().first('id');
        if (!previous) return;

        const permission = PermissionEnum.VIEW_STUDENT_LIST;
        const current = await permissions.clone().where({ permission }).first('id');
        if (!current) {
          await permissions.where({ id: previous.id }).update({ permission });
          return;
        }

        const roles = await trx('role_permissions_table').where({ permission_id: previous.id }).pluck('role_id');
        if (roles.length) {
          await trx('role_permissions_table')
            .insert(roles.map((roleId: string) => ({ id: randomUUID(), role_id: roleId, permission_id: current.id })))
            .onConflict(['role_id', 'permission_id']).ignore();
        }
        await permissions.where({ id: previous.id }).del();
      });
    } catch (error) {
      this.logger.error('Failed to rename student list permission', error);
      throw error;
    }
  }

  async onApplicationShutdown(): Promise<void> {
    try {
      await knexConnection.destroy();
    } catch (error) {
      this.logger.error('Failed to close database connection on shutdown', error);
      throw error;
    }
  }
}
