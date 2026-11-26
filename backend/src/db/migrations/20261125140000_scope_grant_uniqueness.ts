import { ConflictException } from '@nestjs/common';
import type { Knex } from 'knex';

const grants = 'user_roles_table';
const pair = ['user_id', 'role_id'];
const org = [...pair, 'org_id'];

export async function up(db: Knex): Promise<void> {
  await db.schema.alterTable(grants, table => {
    table.unique(pair, { indexName: 'global_grant_unique', predicate: db.queryBuilder().whereNull('org_id') });
    table.unique(org, { indexName: 'org_grant_unique', predicate: db.queryBuilder().whereNotNull('org_id').whereNull('branch_id') });
    table.unique([...org, 'branch_id'], { indexName: 'branch_grant_unique', predicate: db.queryBuilder().whereNotNull('branch_id') });
    table.dropUnique(org);
  });
}

export async function down(db: Knex): Promise<void> {
  if (await db(grants).whereNotNull('branch_id').first('id')) {
    throw new ConflictException('Preserve scoped grants before restoring the legacy uniqueness constraint');
  }
  await db.schema.alterTable(grants, table => {
    table.unique(org);
    table.dropIndex([], 'global_grant_unique');
    table.dropIndex([], 'org_grant_unique');
    table.dropIndex([], 'branch_grant_unique');
  });
}
